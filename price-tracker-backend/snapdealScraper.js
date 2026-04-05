const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeSnapdeal(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to Snapdeal (STABLE MODE)...");

        // We removed the route.abort() so Snapdeal doesn't panic and hide the image!
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
        await page.waitForTimeout(1500);

        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Snapdeal Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            const titleEl = document.querySelector('h1');
            if (titleEl) scrapedTitle = titleEl.innerText.trim();

            const priceEl = document.querySelector('.payBlkBig');
            if (priceEl) {
                scrapedPrice = parseInt(priceEl.innerText.replace(/[,₹a-zA-Z\s]/g, ''), 10);
            }

            // ⚡ 3. Get High-Res Image
            const metaOG = document.querySelector('meta[property="og:image"]');
            if (metaOG && metaOG.content) {
                scrapedImage = metaOG.content;
            } else {
                const mainImg = document.querySelector('img.cloudzoom') || document.querySelector('#bx-slider-left-image-panel img');
                if (mainImg) scrapedImage = mainImg.getAttribute('data-zoom-image') || mainImg.src;
            }

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();
        if (data.scrapedPrice === 0) throw new Error("Could not find Snapdeal price.");

        return { success: true, title: data.scrapedTitle, currentPrice: data.scrapedPrice, imageUrl: data.scrapedImage || 'https://via.placeholder.com/400x400/111827/00FFB2?text=Snapdeal+Image', specifications: {} };

    } catch (error) {
        await browser.close();
        return { success: false, error: "Snapdeal blocked the request." };
    }
}

module.exports = scrapeSnapdeal;