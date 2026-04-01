const { chromium } = require('playwright');

async function scrapeAmazon(url) {
    // Runs completely invisibly in the background!
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    try {
        console.log("Navigating to Amazon...");
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });

        // 🚨 1. CHECK FOR AMAZON BOT-BLOCK (CAPTCHA) 🚨
        const isCaptcha = await page.$('form[action="/errors/validateCaptcha"]');
        if (isCaptcha) {
            console.log("🚨 Amazon Bot-Block detected! 🚨");
            await browser.close();
            // Sends a REAL error message to your website!
            return { success: false, error: "Amazon blocked the robot with a CAPTCHA. Please try a completely different product link!" };
        }

        // 2. GET TITLE
        const titleElement = await page.$('#productTitle');
        const title = titleElement ? await titleElement.innerText() : 'Unknown Product';

        // 3. GET CORRECT BUY-BOX PRICE
        let currentPrice = 0;
        const priceElement = await page.$('.priceToPay span.a-price-whole, .a-price span.a-price-whole');
        if (priceElement) {
            let priceText = await priceElement.innerText();
            priceText = priceText.replace(/[,₹a-zA-Z\s\.]/g, '');
            currentPrice = parseInt(priceText, 10);
        }

        // 4. GET IMAGE
        const imgElement = await page.$('#landingImage, #imgBlkFront');
        const imageUrl = imgElement ? await imgElement.getAttribute('src') : '';

        // 5. GET THE MASSIVE SPECIFICATIONS TABLE
        const specifications = {};
        console.log("Extracting full specifications...");
        const specRows = await page.$$('table#productDetails_techSpec_section_1 tr, table.a-keyvalue tr, #technicalSpecifications_section_1 tr');

        for (const row of specRows) {
            const keyEl = await row.$('th');
            const valEl = await row.$('td');
            if (keyEl && valEl) {
                const key = (await keyEl.innerText()).trim().replace(/\u200E/g, '');
                const val = (await valEl.innerText()).trim().replace(/\u200E/g, '');
                if (key && val) specifications[key] = val; // Saves to the massive list!
            }
        }

        await browser.close();

        // 6. SEND EVERYTHING TO THE CONTROLLER
        return {
            success: true,
            title: title.trim(),
            currentPrice,
            imageUrl,
            specifications
        };

    } catch (error) {
        await browser.close();
        return { success: false, error: error.message };
    }
}

module.exports = scrapeAmazon;