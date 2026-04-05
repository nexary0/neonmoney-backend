const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeNykaa(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to Nykaa...");

        // Block only binary assets. CSS must load — we need it for computed styles.
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'font', 'media'].includes(type)) {
                route.abort();
            } else {
                route.continue();
            }
        });

        // Use 'load' (not 'domcontentloaded') so stylesheets are fully parsed and
        // applied before we call getComputedStyle inside page.evaluate().
        await page.goto(url, { waitUntil: 'load', timeout: 40000 }).catch(() => { });
        await page.waitForTimeout(2000);

        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Nykaa Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            // ─── Title ────────────────────────────────────────────────────────────
            const titleEl = document.querySelector('h1');
            if (titleEl) scrapedTitle = titleEl.innerText.trim();

            // ─── Image ────────────────────────────────────────────────────────────
            const imgEl = document.querySelector('meta[property="og:image"]');
            if (imgEl) scrapedImage = imgEl.content;

            // ─── Helpers ──────────────────────────────────────────────────────────

            // Parse "₹1,299" → 1299. Returns 0 for anything that doesn't match.
            function parseRupeeText(text) {
                const m = (text || '').trim().match(/^₹\s*([\d,]+)$/);
                return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
            }

            // True if this element is the MRP (visually struck-through).
            // Works only when CSS is fully loaded (waitUntil:'load' above).
            function isStrikethrough(el) {
                try {
                    const s = window.getComputedStyle(el);
                    return s.textDecorationLine.includes('line-through') ||
                        s.textDecoration.includes('line-through');
                } catch (_) { return false; }
            }

            // True if the element (or any ancestor up to 3 levels) is a <del> or <s> tag.
            function isSemanticStrike(el) {
                let node = el;
                for (let i = 0; i < 4; i++) {
                    if (!node) break;
                    if (['DEL', 'S'].includes(node.tagName)) return true;
                    node = node.parentElement;
                }
                return false;
            }

            // Combined MRP check — CSS-based OR semantic HTML-based.
            function isMrp(el) {
                return isStrikethrough(el) || isSemanticStrike(el);
            }

            // Collect all leaf price elements in a container, tagged as mrp or offer.
            function collectPrices(container) {
                const results = [];
                container.querySelectorAll('span, div, p').forEach(el => {
                    if (el.children.length > 0) return; // skip wrappers
                    const price = parseRupeeText(el.innerText);
                    if (price > 0 && price < 500000) {
                        results.push({ price, mrp: isMrp(el) });
                    }
                });
                return results;
            }

            // ─── STRATEGY 0: "% Off" badge anchor (most reliable for Nykaa) ──────
            //
            // Nykaa always renders the price block as:
            //   [₹MRP struck-through]  [₹OfferPrice]  [X% Off]
            //
            // We find the "X% Off" badge, walk up to its container, collect all prices,
            // and return the lowest non-MRP one.
            //
            // This strategy is ZERO dependency on CSS class names or JSON-LD.
            const allEls = Array.from(document.querySelectorAll('span, div, p'));
            const discountBadge = allEls.find(el =>
                el.children.length === 0 && /^\d+%\s*off$/i.test(el.innerText.trim())
            );

            if (discountBadge) {
                let node = discountBadge.parentElement;
                for (let i = 0; i < 6; i++) {
                    if (!node) break;
                    const prices = collectPrices(node);
                    const offerPrices = prices.filter(p => !p.mrp).map(p => p.price);
                    if (offerPrices.length > 0) {
                        scrapedPrice = Math.min(...offerPrices);
                        console.log('[S0] Found via % Off badge:', scrapedPrice);
                        break;
                    }
                    node = node.parentElement;
                }
            }

            // ─── STRATEGY 1: Product section via h1 + MRP filter ────────────────
            //
            // Walk up from h1 to find the price block. Skip any struck-through element.
            // When a discount exists: both ₹980(mrp) and ₹931(offer) are found —
            // we take only the non-MRP prices and pick the minimum.
            if (scrapedPrice === 0 && titleEl) {
                let container = titleEl.parentElement;
                for (let i = 0; i < 8; i++) {
                    if (!container) break;
                    const prices = collectPrices(container);
                    const offerPrices = prices.filter(p => !p.mrp).map(p => p.price);
                    if (offerPrices.length > 0) {
                        scrapedPrice = Math.min(...offerPrices);
                        console.log('[S1] Found via h1 container:', scrapedPrice);
                        break;
                    }
                    container = container.parentElement;
                }
            }

            // ─── STRATEGY 2: Known offer-price class patterns ────────────────────
            if (scrapedPrice === 0) {
                const selectors = [
                    '[class*="offer-price"]', '[class*="offerPrice"]',
                    '[class*="selling-price"]', '[class*="sellingPrice"]',
                    '[class*="discounted-price"]', '[class*="discountedPrice"]',
                    '[class*="final-price"]', '[class*="finalPrice"]',
                ];
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && !isMrp(el)) {
                        const m = el.innerText.trim().match(/₹\s*([\d,]+)/);
                        if (m) {
                            const p = parseInt(m[1].replace(/,/g, ''), 10);
                            if (p > 0) { scrapedPrice = p; console.log('[S2]', sel, p); break; }
                        }
                    }
                }
            }

            // ─── STRATEGY 3: Full-page fallback with MRP filter ──────────────────
            if (scrapedPrice === 0) {
                const allPrices = [];
                document.querySelectorAll('span, p').forEach(el => {
                    if (el.children.length > 0) return;
                    if (isMrp(el)) return;
                    const price = parseRupeeText(el.innerText);
                    if (price > 0 && price < 500000) allPrices.push(price);
                });
                if (allPrices.length > 0) {
                    const freq = {};
                    allPrices.forEach(p => { freq[p] = (freq[p] || 0) + 1; });
                    const sorted = Object.entries(freq)
                        .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]));
                    scrapedPrice = parseInt(sorted[0][0], 10);
                    console.log('[S3] Fallback price:', scrapedPrice);
                }
            }

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();

        if (data.scrapedPrice === 0) throw new Error("Could not find Nykaa price.");

        return {
            success: true,
            title: data.scrapedTitle,
            currentPrice: data.scrapedPrice,
            imageUrl: data.scrapedImage || '',
            specifications: {}
        };

    } catch (error) {
        await browser.close();
        console.error("Nykaa Scraper Error:", error.message);
        return { success: false, error: "Nykaa blocked the request or layout changed." };
    }
}

module.exports = scrapeNykaa;