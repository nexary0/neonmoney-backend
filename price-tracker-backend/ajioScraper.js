const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeAjio(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to Ajio (STABLE MODE)...");

        await page.route('**/*', (route) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(route.request().resourceType())) route.abort();
            else route.continue();
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
        await page.waitForTimeout(1500);

        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Ajio Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            // 1. Get Title
            const titleEl = document.querySelector('h1') || document.querySelector('.prod-name');
            if (titleEl) scrapedTitle = titleEl.innerText.trim();

            // 2. Get Price
            const priceEl = document.querySelector('.prod-sp');
            if (priceEl) {
                scrapedPrice = parseInt(priceEl.innerText.replace(/[,₹a-zA-Z\s]/g, ''), 10);
            } else {
                const scripts = document.querySelectorAll('script');
                for (let script of scripts) {
                    if (script.innerText.includes('window.__PRELOADED_STATE__')) {
                        const match = script.innerText.match(/"offerPrice"\s*:\s*(\d+)/) || script.innerText.match(/"price"\s*:\s*(\d+)/);
                        if (match) scrapedPrice = parseInt(match[1], 10);
                    }
                }
            }

            // ⚡ 3. Get High-Res Image (Bypasses the tiny swatch thumbnail)
            const metaImg = document.querySelector('meta[property="og:image"]');
            if (metaImg && metaImg.content) {
                scrapedImage = metaImg.content;
            } else {
                const fallbackImg = document.querySelector('.zoom-container img') || document.querySelector('img.rilrtl-lazy-img');
                if (fallbackImg) scrapedImage = fallbackImg.src;
            }

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();
        if (data.scrapedPrice === 0) throw new Error("Could not find Ajio price.");

        return { success: true, title: data.scrapedTitle, currentPrice: data.scrapedPrice, imageUrl: data.scrapedImage || 'https://via.placeholder.com/400x400/111827/00FFB2?text=Ajio+Image', specifications: {} };

    } catch (error) {
        await browser.close();
        return { success: false, error: "Ajio blocked the request." };
    }
}

module.exports = scrapeAjio;