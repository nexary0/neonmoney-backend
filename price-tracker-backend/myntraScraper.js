const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeMyntra(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to Myntra (SPEED BOOST MODE)...");

        // ⚡ SPEED BOOST 1: Block heavy images, videos, and styling
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
                route.abort();
            } else {
                route.continue();
            }
        });

        // ⚡ SPEED BOOST 2: Wait only for the basic text DOM
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });

        // Wait 1.5 seconds for Myntra's React engine to render the price text
        await page.waitForTimeout(1500);

        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Myntra Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            // 1. Get Title (Myntra usually splits Brand and Name)
            const brandEl = document.querySelector('h1.pdp-title');
            const nameEl = document.querySelector('h1.pdp-name');
            if (brandEl && nameEl) {
                scrapedTitle = brandEl.innerText.trim() + " " + nameEl.innerText.trim();
            } else if (brandEl) {
                scrapedTitle = brandEl.innerText.trim();
            }

            // 2. Get Price
            const priceEl = document.querySelector('.pdp-price strong') || document.querySelector('.pdp-price');
            if (priceEl) {
                scrapedPrice = parseInt(priceEl.innerText.replace(/[,₹Rs.a-zA-Z\s]/g, ''), 10);
            }

            // Fallback Price Hunter
            if (scrapedPrice === 0) {
                const allSpans = document.querySelectorAll('span, strong');
                for (let el of allSpans) {
                    const text = el.innerText ? el.innerText.trim() : '';
                    if (text.startsWith('₹') || text.startsWith('Rs.')) {
                        const cleanPrice = parseInt(text.replace(/[,₹Rs.a-zA-Z\s]/g, ''), 10);
                        if (cleanPrice > 0 && cleanPrice < 500000) {
                            scrapedPrice = cleanPrice;
                            break;
                        }
                    }
                }
            }

            // 3. Get Image 
            const imgEl = document.querySelector('.image-grid-image') || document.querySelector('meta[property="og:image"]');
            if (imgEl) scrapedImage = imgEl.src || imgEl.content;

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();

        if (data.scrapedPrice === 0) throw new Error("Could not find Myntra price.");

        return {
            success: true,
            title: data.scrapedTitle,
            currentPrice: data.scrapedPrice,
            imageUrl: data.scrapedImage || '',
            specifications: {}
        };

    } catch (error) {
        await browser.close();
        console.error("Myntra Scraper Error:", error.message);
        return { success: false, error: "Myntra blocked the request or layout changed." };
    }
}

module.exports = scrapeMyntra;