const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeAmazon(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to Amazon (SPEED BOOST MODE)...");

        // ⚡ SPEED BOOST 1: Block heavy images, videos, and styling from downloading!
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
                route.abort(); // Kill heavy files instantly
            } else {
                route.continue(); // Let the HTML text through
            }
        });

        // ⚡ SPEED BOOST 2: Wait only for the basic text DOM, not the full page load
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });

        // Just wait 1 second for Amazon's Javascript to show the price
        await page.waitForTimeout(1000);

        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Amazon Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            // 1. Get Title
            const titleEl = document.querySelector('#productTitle');
            if (titleEl) scrapedTitle = titleEl.innerText.trim();

            // 2. Get Price
            const priceEl = document.querySelector('.a-price-whole');
            if (priceEl) {
                scrapedPrice = parseInt(priceEl.innerText.replace(/[,.]/g, ''), 10);
            }

            // Fallback Price Hunter
            if (scrapedPrice === 0) {
                const allSpans = document.querySelectorAll('span');
                for (let el of allSpans) {
                    if (el.innerText && el.innerText.trim().startsWith('₹')) {
                        const cleanPrice = parseInt(el.innerText.replace(/[,₹a-zA-Z\s.]/g, ''), 10);
                        if (cleanPrice > 0 && cleanPrice < 500000) {
                            scrapedPrice = cleanPrice;
                            break;
                        }
                    }
                }
            }

            // 3. Get Image (Even if we blocked images from showing, the URL is still hidden in the code!)
            const imgEl = document.querySelector('#landingImage') || document.querySelector('#imgBlkFront');
            if (imgEl) scrapedImage = imgEl.src;

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();

        if (data.scrapedPrice === 0) throw new Error("Could not find Amazon price.");

        return {
            success: true,
            title: data.scrapedTitle,
            currentPrice: data.scrapedPrice,
            imageUrl: data.scrapedImage || '',
            specifications: {}
        };

    } catch (error) {
        await browser.close();
        console.error("Amazon Scraper Error:", error.message);
        return { success: false, error: "Amazon blocked the request or layout changed." };
    }
}

module.exports = scrapeAmazon;