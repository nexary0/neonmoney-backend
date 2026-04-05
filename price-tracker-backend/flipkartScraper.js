const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeFlipkart(url) {
    try {
        console.log("Navigating to Flipkart (1-SECOND LIGHTNING MODE)...");

        // ⚡ INSTANT FETCH: No browser, just pure text data
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        // Load the text into our lightning reader
        const $ = cheerio.load(response.data);

        let scrapedTitle = 'Unknown Flipkart Product';
        let scrapedPrice = 0;
        let scrapedImage = '';

        // 1. Get Title
        const titleEl = $('.VU-Tz5, .B_NuCI, span[class*="B_NuCI"]');
        if (titleEl.length) scrapedTitle = titleEl.first().text().trim();

        // 2. Get Price
        const priceElements = $('div.Nx9bqj, div._30jeq3, div.hl05eU');
        priceElements.each((i, el) => {
            const text = $(el).text();
            if (text.includes('₹')) {
                scrapedPrice = parseInt(text.replace(/[,₹a-zA-Z\s]/g, ''), 10);
                if (scrapedPrice > 0) return false; // stop searching
            }
        });

        // Fallback Price Hunter
        if (scrapedPrice === 0) {
            $('div, span').each((i, el) => {
                const text = $(el).text().trim();
                if (text.startsWith('₹') && text.length < 15) {
                    const cleanPrice = parseInt(text.replace(/[,₹a-zA-Z\s]/g, ''), 10);
                    if (cleanPrice > 0 && cleanPrice < 500000) {
                        scrapedPrice = cleanPrice;
                        return false;
                    }
                }
            });
        }

        // 3. Get Image
        const metaOG = $('meta[property="og:image"]');
        if (metaOG.length) {
            scrapedImage = metaOG.attr('content');
        } else {
            const img = $('img.v2s11H, img._396cs4');
            if (img.length) scrapedImage = img.first().attr('src');
        }

        if (scrapedPrice === 0) throw new Error("Could not find price in text.");

        return {
            success: true,
            title: scrapedTitle,
            currentPrice: scrapedPrice,
            imageUrl: scrapedImage || '',
            specifications: {}
        };

    } catch (error) {
        console.error("Lightning Scraper Error:", error.message);
        return { success: false, error: "Failed to scrape using lightning mode." };
    }
}

module.exports = scrapeFlipkart;