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
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
        await page.waitForTimeout(3000); // Nykaa relies heavily on React, so we wait 3 seconds

        // Safely evaluate data inside the browser
        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Nykaa Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            // 1. Get Title
            const h1 = document.querySelector('h1');
            if (h1) scrapedTitle = h1.innerText;

            // 2. Get Price by finding the first small piece of text with a ₹ sign
            const spans = document.querySelectorAll('span, div');
            for (let el of spans) {
                if (el.innerText && el.innerText.includes('₹') && el.innerText.length < 15) {
                    const num = parseInt(el.innerText.replace(/[,₹a-zA-Z\s:\n]/g, ''), 10);
                    if (num > 0 && num < 500000) {
                        scrapedPrice = num;
                        break; // Stop at the first valid price we find
                    }
                }
            }

            // 3. Get Image
            const metaOG = document.querySelector('meta[property="og:image"]');
            if (metaOG) scrapedImage = metaOG.content;

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();

        if (data.scrapedPrice === 0) {
            throw new Error("Nykaa loaded, but hid the price.");
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
        console.error("Nykaa Scraper Error:", error.message);
        return { success: false, error: "Nykaa's layout changed or blocked the robot." };
    }
}

module.exports = scrapeNykaa;