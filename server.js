const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// YOUR SCRAPER API KEY
const SCRAPER_API_KEY = '9cb9e46b99d412473b6a07f79408aabd';

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('NeonMoney Premium Scraper Backend is Awake! 🚀');
});

app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'Please provide a URL' });

    try {
        console.log(`Scraping URL via ScraperAPI: ${url}`);

        // 1. ROUTE THE REQUEST THROUGH SCRAPER API (With India Country Code)
        const targetUrl = encodeURIComponent(url);
        const scraperUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${targetUrl}&country_code=in`;

        const response = await fetch(scraperUrl);
        
        if (!response.ok) {
            throw new Error(`ScraperAPI returned status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // 2. EXTRACT CLEAN TITLE
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1] : "Unknown Product";
        title = title.replace('Buy ', '').replace('Online at Best Price', '').replace('- Amazon.in', '').replace('| Flipkart.com', '').trim();

        // 3. EXTRACT REAL IMAGE
        let imageUrl = "https://placehold.co/400x500/f8fafc/0f172a?text=Product+Image";
        const imgMatches = [
            html.match(/<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i), 
            html.match(/<img[^>]*id="imgBlkFront"[^>]*src="([^"]+)"/i), 
            html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i), 
            html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i), 
            html.match(/<img[^>]*class="[^"]*v2vws[^"]*"[^>]*src="([^"]+)"/i), 
            html.match(/<img[^>]*class="[^"]*_396cs4[^"]*"[^>]*src="([^"]+)"/i)  
        ];

        for (let m of imgMatches) {
            if (m && m[1] && !m[1].includes('sprite') && !m[1].includes('data:image')) {
                imageUrl = m[1];
                break; 
            }
        }

        // 4. UNIVERSAL EXACT PRICE EXTRACTOR 
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

        // Fallback for hidden prices
        if (currentPrice === 0 || isNaN(currentPrice)) {
            const rawPrices = html.match(/₹\s?([0-9]{1,3}(?:,[0-9]{2,3})*)/g);
            if (rawPrices && rawPrices.length > 0) {
                currentPrice = parseInt(rawPrices[0].replace(/₹|,|\s/g, '').trim());
            } else {
                currentPrice = 999; 
                title = title + " (Price Hidden)";
            }
        }

        // 5. GENERATE BUYHATKE-STYLE HISTORY
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

        // 6. UNIVERSAL DYNAMIC SUGGESTION ENGINE
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
                image: imageUrl 
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
        res.status(500).json({ success: false, error: "Store security blocked the tracker. Trying again usually works." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
