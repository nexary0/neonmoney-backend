const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeMeesho(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to Meesho (STABLE MODE)...");

        // NO ROUTE ABORT: Let the page load naturally so it doesn't freeze and timeout!
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
        await page.waitForTimeout(2000);

        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Meesho Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            // 1. Get Title from Meta Tag (Safest)
            const metaTitle = document.querySelector('meta[property="og:title"]');
            if (metaTitle && metaTitle.content) scrapedTitle = metaTitle.content.split('|')[0].trim();

            // 2. Get Image from Meta Tag (Safest)
            const metaImg = document.querySelector('meta[property="og:image"]');
            if (metaImg && metaImg.content) scrapedImage = metaImg.content;

            // 3. Get Price
            document.querySelectorAll('h4, span').forEach(el => {
                if (el.innerText && el.innerText.includes('₹') && scrapedPrice === 0) {
                    let cleanPrice = parseInt(el.innerText.replace(/[^0-9]/g, ''), 10);
                    if (cleanPrice > 0 && cleanPrice < 100000) scrapedPrice = cleanPrice;
                }
            });

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();
        if (data.scrapedPrice === 0) throw new Error("Could not find Meesho price.");

        return { success: true, title: data.scrapedTitle, currentPrice: data.scrapedPrice, imageUrl: data.scrapedImage || 'https://via.placeholder.com/400x400/111827/00FFB2?text=Meesho+Image', specifications: {} };

    } catch (error) {
        await browser.close();
        return { success: false, error: "Meesho blocked the request or layout changed." };
    }
}

module.exports = scrapeMeesho;