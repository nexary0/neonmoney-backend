const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeMeesho(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36' });
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
        await page.waitForTimeout(3000);

        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Meesho Product', scrapedPrice = 0, scrapedImage = '';

            const titleEl = document.querySelector('span[class*="Text__StyledText"], h1');
            if (titleEl) scrapedTitle = titleEl.innerText.trim();

            const priceElements = document.querySelectorAll('h4, span');
            for (let el of priceElements) {
                if (el.innerText && el.innerText.includes('₹') && el.innerText.length < 10) {
                    const num = parseInt(el.innerText.replace(/[,₹a-zA-Z\s]/g, ''), 10);
                    if (num > 0) { scrapedPrice = num; break; }
                }
            }

            const metaOG = document.querySelector('meta[property="og:image"]');
            if (metaOG) scrapedImage = metaOG.content;

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();
        if (data.scrapedPrice === 0) throw new Error("Price hidden.");

        return { success: true, title: data.scrapedTitle, currentPrice: data.scrapedPrice, imageUrl: data.scrapedImage, specifications: {} };
    } catch (error) {
        await browser.close();
        return { success: false, error: "Meesho blocked the scraper." };
    }
}
module.exports = scrapeMeesho;