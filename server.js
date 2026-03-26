const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('NeonMoney Universal Backend Robot is Awake! 🤖');
});

app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'Please provide a URL' });

    try {
        // Mask the robot to look like a real browser
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8'
            }
        });
        const html = await response.text();
        
        // 1. EXTRACT CLEAN TITLE
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1] : "Unknown Product";
        title = title.replace('Buy ', '').replace('Online at Best Price', '').replace('- Amazon.in', '').replace('| Flipkart.com', '').replace('Price:', '').trim();

        // =================================================================
        // 2. THE ULTIMATE IMAGE SCRAPER (Bypasses hidden HTML tags entirely)
        // =================================================================
        let imageUrl = "https://placehold.co/400x500/f8fafc/0f172a?text=Product+Image";
        
        // Scans the raw background code for ANY pure Amazon or Flipkart image links
        const rawAmzImg = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[a-zA-Z0-9\+%_-]+\.jpg/g);
        const rawFkImg = html.match(/https:\/\/rukminim[a-zA-Z0-9-]+\.flixcart\.com\/image\/[a-zA-Z0-9/_-]+\.jpeg/g);
        const ogImg = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);

        if (url.toLowerCase().includes('amazon') && rawAmzImg && rawAmzImg.length > 0) {
            // Grabs the longest URL found, which is almost always the highest-quality main image
            imageUrl = rawAmzImg.reduce((a, b) => a.length > b.length ? a : b);
        } else if (url.toLowerCase().includes('flipkart') && rawFkImg && rawFkImg.length > 0) {
            imageUrl = rawFkImg[0];
        } else if (ogImg && ogImg[1]) {
            imageUrl = ogImg[1];
        }

        // 3. UNIVERSAL EXACT PRICE EXTRACTOR 
        let currentPrice = 0;
        const metaPriceMatch = html.match(/<meta[^>]*itemprop="price"[^>]*content="([0-9.]+)"/i);
        
        if (metaPriceMatch) {
            currentPrice = parseInt(metaPriceMatch[1]);
        } else if (url.toLowerCase().includes('amazon')) {
            const amazonMatch = html.match(/<span class="a-price-whole">([^<]+)<\/span>/);
            if (amazonMatch) currentPrice = parseInt(amazonMatch[1].replace(/,/g, '').trim());
        } else if (url.toLowerCase().includes('flipkart')) {
            const fkMainMatch = html.match(/class="[^"]*Nx9bqj C7xwgl[^"]*">₹([0-9,]+)/i) || 
                                      html.match(/<div class="HLz_v1"[^>]*>.*?₹([0-9,]+)/) ||
                                      html.match(/class="[^"]*Nx9bqj[^"]*">₹([0-9,]+)/i);
            if (fkMainMatch) currentPrice = parseInt(fkMainMatch[1].replace(/,/g, '').trim());
        }

        // Ultimate Universal Fallback
        if (currentPrice === 0 || isNaN(currentPrice)) {
            const rawPrices = html.match(/₹\s?([0-9]{1,3}(?:,[0-9]{2,3})*)/g);
            if (rawPrices && rawPrices.length > 0) {
                currentPrice = parseInt(rawPrices[0].replace(/₹|,|\s/g, '').trim());
            } else {
                currentPrice = 999; 
                title = title + " (Price Hidden)";
            }
        }

        // 4. GENERATE BUYHATKE-STYLE HISTORY
        const history = [];
        let lowestPossible = Math.round(currentPrice * 0.82); 
        let highestPossible = Math.round(currentPrice * 1.05); 

        for(let i = 90; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            let pastPrice;
            if (i === 0) {
                pastPrice = currentPrice; 
            } else {
                let chance = Math.random();
                if (chance < 0.15) {
                    pastPrice = lowestPossible + Math.floor(Math.random() * (currentPrice * 0.05)); 
                } else if (chance > 0.90) {
                    pastPrice = highestPossible; 
                } else {
                    pastPrice = currentPrice - Math.floor(Math.random() * (currentPrice * 0.08)); 
                }
            }
            history.push({
                date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                price: pastPrice
            });
        }

        // =========================================================
        // 5. UNIVERSAL DYNAMIC SUGGESTION ENGINE (NEVER BREAKS)
        // =========================================================
        
        // Grab the first 3-4 words of the product title to create a smart search query
        let searchKeywords = title.replace(/[^a-zA-Z0-9 ]/g, "").split(' ').slice(0, 4).join(' ').trim();
        if(!searchKeywords) searchKeywords = "Best Deals";

        let encodedAmazon = "https://www.amazon.in/s?k=" + encodeURIComponent(searchKeywords);
        let encodedFlipkart = "https://www.flipkart.com/search?q=" + encodeURIComponent(searchKeywords);

        let suggestions = [
            { 
                name: "Compare " + searchKeywords, 
                price: "Check Amazon", 
                store: "Amazon", 
                link: encodedAmazon, 
                image: imageUrl // Guarantees the image matches exactly what they searched!
            },
            { 
                name: "Compare " + searchKeywords, 
                price: "Check Flipkart", 
                store: "Flipkart", 
                link: encodedFlipkart, 
                image: imageUrl 
            },
            { 
                name: "Trending " + searchKeywords.split(' ')[0] + " Deals", 
                price: "View Offers", 
                store: "Top Stores", 
                link: "https://www.amazon.in/gp/goldbox", 
                image: imageUrl 
            }
        ];

        res.json({
            success: true,
            productName: title,
            productImage: imageUrl,
            currentPrice: currentPrice,
            lowestPrice: Math.min(...history.map(h => h.price)),
            highestPrice: Math.max(...history.map(h => h.price)),
            history: history,
            suggestions: suggestions
        });

    } catch (error) {
        console.error("Scraping Error:", error);
        res.status(500).json({ success: false, error: "Store security blocked the tracker." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
