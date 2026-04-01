// 1. Import the Professional Stealth plugins
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function scrapeAjio(url) {
    const browser = await chromium.launch({ headless: true });

    // Set up a normal-looking Windows Chrome profile
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    try {
        console.log("Navigating to Ajio (Ultimate Stealth Mode)...");

        // 🚨 THE HIT AND RUN TACTIC 🚨
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (navError) {
            console.log("   -> Ajio tried to trap the loader. Forcing data extraction anyway...");
        }

        // Give Ajio's React engine 3 seconds to finish drawing the screen
        await page.waitForTimeout(3000);

        // Safely evaluate data inside the browser to prevent crashes
        const data = await page.evaluate(() => {
            let scrapedTitle = 'Unknown Ajio Product';
            let scrapedPrice = 0;
            let scrapedImage = '';

            // 1. Get Title (Ajio almost always uses an h1 tag for the product name)
            const h1 = document.querySelector('h1, h1.prod-name');
            if (h1) scrapedTitle = h1.innerText.trim();

            // 2. Get Price (Universal Price Hunter looking for ₹ or Rs.)
            const priceElements = document.querySelectorAll('.prod-sp, .prod-price, span, div');
            for (let el of priceElements) {
                if (el.innerText && (el.innerText.includes('₹') || el.innerText.includes('Rs.')) && el.innerText.length < 15) {
                    // Clean out commas, symbols, and spaces
                    const num = parseInt(el.innerText.replace(/[,₹Rs\.\sa-zA-Z]/g, ''), 10);
                    if (num > 0 && num < 500000) {
                        scrapedPrice = num;
                        break; // Stop at the first valid price we find!
                    }
                }
            }

            // 3. Get Image (The Golden Bullet Trick!)
            const metaOG = document.querySelector('meta[property="og:image"]');
            if (metaOG) {
                scrapedImage = metaOG.content;
            } else {
                // Fallback for Ajio's specific image slider
                const img = document.querySelector('.rilrtl-lazy-img, .img-responsive');
                if (img) scrapedImage = img.src;
            }

            return { scrapedTitle, scrapedPrice, scrapedImage };
        });

        await browser.close();

        // If the price is 0, the robot failed to find it
        if (data.scrapedPrice === 0) {
            throw new Error("Page loaded, but Ajio successfully hid the price data.");
        }

        // 4. SEND SUCCESS DATA BACK
        return {
            success: true,
            title: data.scrapedTitle,
            currentPrice: data.scrapedPrice,
            imageUrl: data.scrapedImage || '',
            specifications: {}
        };

    } catch (error) {
        await browser.close();
        console.error("Ajio Scraper Blocked:", error.message);
        return {
            success: false,
            error: "Ajio's layout changed or blocked the robot. Please try again later."
        };
    }
}

module.exports = scrapeAjio;