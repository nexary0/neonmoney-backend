const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeFlipkart(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to Flipkart...");

        // Use 'load' instead of 'domcontentloaded' so it waits for mobile link redirects to finish!
        await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => { });

        // Wait an extra 4 seconds specifically for redirects and React to finish drawing
        await page.waitForTimeout(4000);

        // Safely evaluate data inside the browser
        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Flipkart Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            // 1. Get Title
            const titleEl = document.querySelector('.VU-Tz5, .B_NuCI, span[class*="B_NuCI"], span[class*="VU-Tz5"]');
            if (titleEl) scrapedTitle = titleEl.innerText.trim();

            // 2. Get Price (Look for the main price tag)
            const priceElements = document.querySelectorAll('div.Nx9bqj, div._30jeq3, div.hl05eU, div[class*="Nx9bqj"]');
            for (let el of priceElements) {
                if (el.innerText.includes('₹')) {
                    scrapedPrice = parseInt(el.innerText.replace(/[,₹a-zA-Z\s]/g, ''), 10);
                    if (scrapedPrice > 0) break;
                }
            }

            // UNIVERSAL PRICE HUNTER FALLBACK: If the main tags fail, just find the first valid ₹ text!
            if (scrapedPrice === 0) {
                const allDivs = document.querySelectorAll('div, span');
                for (let el of allDivs) {
                    if (el.innerText && el.innerText.trim().startsWith('₹') && el.innerText.length < 15) {
                        const cleanPrice = parseInt(el.innerText.replace(/[,₹a-zA-Z\s]/g, ''), 10);
                        if (cleanPrice > 0 && cleanPrice < 500000) {
                            scrapedPrice = cleanPrice;
                            break;
                        }
                    }
                }
            }

            // 3. Get Image (Golden Bullet Trick)
            const metaOG = document.querySelector('meta[property="og:image"]');
            if (metaOG) scrapedImage = metaOG.content;
            else {
                const img = document.querySelector('img[class*="v2s11H"], img[class*="_396cs4"]');
                if (img) scrapedImage = img.src;
            }

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();

        if (data.scrapedPrice === 0) {
            throw new Error("Flipkart loaded, but hid the price.");
        }

        return {
            success: true,
            title: data.scrapedTitle.trim(),
            currentPrice: data.scrapedPrice,
            imageUrl: data.scrapedImage || '',
            specifications: {}
        };

    } catch (error) {
        await browser.close();
        console.error("Flipkart Scraper Error:", error.message);
        return { success: false, error: "Flipkart's layout changed or blocked the robot." };
    }
}

module.exports = scrapeFlipkart;