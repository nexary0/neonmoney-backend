// 1. Import the new Professional Stealth plugins
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Tell the browser to put on the stealth armor before launching
chromium.use(stealth);

async function scrapeMyntra(url) {
    const browser = await chromium.launch({ headless: true });

    // Set up a totally normal-looking Windows Chrome profile
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        }
    });

    const page = await context.newPage();

    try {
        console.log("Navigating to Myntra (Ultimate Stealth Mode)...");

        // 🚨 THE HIT AND RUN TACTIC 🚨
        // Myntra traps robots by making trackers load forever. We will try to load the page, 
        // but if it hangs, we catch the error and keep moving forward to grab the text anyway!
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (navError) {
            console.log("   -> Myntra tried to trap the loader. Forcing data extraction anyway...");
        }

        // Wait up to 10 seconds specifically for the price or title to appear on the screen
        await page.waitForSelector('h1.pdp-title, h1.pdp-name, .pdp-price', { timeout: 10000 }).catch(() => { });

        // 1. GET TITLE 
        const titleBrand = await page.$('h1.pdp-title');
        const titleName = await page.$('h1.pdp-name');

        let title = 'Unknown Myntra Product';
        if (titleBrand && titleName) {
            const brandText = await titleBrand.innerText();
            const nameText = await titleName.innerText();
            title = `${brandText} ${nameText}`;
        } else if (titleBrand) {
            title = await titleBrand.innerText();
        } else if (titleName) {
            title = await titleName.innerText();
        }

        // 2. GET PRICE
        let currentPrice = 0;
        const priceElement = await page.$('.pdp-price strong, .pdp-price');
        if (priceElement) {
            let priceText = await priceElement.innerText();
            priceText = priceText.replace(/[,₹Rs\.a-zA-Z\s]/g, '');
            currentPrice = parseInt(priceText, 10);
        }

        // 3. GET IMAGE (The Bulletproof Meta Tag Method)
        let imageUrl = '';

        // First, try to steal the WhatsApp/Facebook preview image (always high quality!)
        const metaImage = await page.$('meta[property="og:image"]');
        if (metaImage) {
            imageUrl = await metaImage.getAttribute('content');
        }

        // Fallback just in case Myntra changes their meta tags
        if (!imageUrl) {
            const imgElement = await page.$('picture img, .image-grid-image, .image-components-image img');
            imageUrl = imgElement ? await imgElement.getAttribute('src') : '';
        }

        // If the price is still 0, the stealth failed.
        if (currentPrice === 0) {
            throw new Error("Page loaded, but Myntra successfully hid the price data.");
        }

        // 4. SEND SUCCESS DATA BACK
        return {
            success: true,
            title: title.trim(),
            currentPrice: currentPrice,
            imageUrl: imageUrl || '',
            specifications: {}
        };

    } catch (error) {
        await browser.close();
        console.error("Myntra Scraper Blocked:", error.message);
        return {
            success: false,
            error: "Myntra's security is exceptionally high today. Please use an Amazon or Flipkart link instead."
        };
    }
}

module.exports = scrapeMyntra;