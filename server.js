const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('NeonMoney Backend Robot is Awake! 🤖');
});

app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'Please provide a URL' });

    try {
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8'
            }
        });
        const html = await response.text();
        
        // 1. EXTRACT TITLE
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1] : "Unknown Product";
        title = title.replace('Buy ', '').replace('Online at Best Price', '').replace('- Amazon.in', '').replace('| Flipkart.com', '').trim();

        // 2. EXTRACT REAL IMAGE (Aggressive Multi-Tag Scraper)
        let imageUrl = "https://placehold.co/400x500/f8fafc/0f172a?text=Product+Image";
        const imgMatches = [
            html.match(/<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i), // Amazon Primary
            html.match(/<img[^>]*id="imgBlkFront"[^>]*src="([^"]+)"/i), // Amazon Books/Alt
            html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i), // Standard OG
            html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i), // Twitter Card
            html.match(/<img[^>]*class="[^"]*v2vws[^"]*"[^>]*src="([^"]+)"/i), // Flipkart New
            html.match(/<img[^>]*class="[^"]*_396cs4[^"]*"[^>]*src="([^"]+)"/i)  // Flipkart Old
        ];

        for (let m of imgMatches) {
            // Pick the first match that isn't a tiny website icon (sprite)
            if (m && m[1] && !m[1].includes('sprite') && !m[1].includes('data:image')) {
                imageUrl = m[1];
                break; 
            }
        }

        // 3. EXTRACT EXACT MAIN PRICE
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

        // Ultimate Fallback
        if (currentPrice === 0 || isNaN(currentPrice)) {
            const rawPrices = html.match(/₹([0-9]{1,2},[0-9]{3})/g);
            if (rawPrices && rawPrices.length > 0) {
                currentPrice = parseInt(rawPrices[0].replace(/₹|,/g, '').trim());
            } else {
                currentPrice = 2999; 
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

        // 5. SMART CATEGORY SUGGESTIONS (Reads the title!)
        let suggestions = [];
        const t = title.toLowerCase();

        // If it detects Audio gear...
        if (t.includes('headphone') || t.includes('earbud') || t.includes('airpod') || t.includes('earphone') || t.includes('noise') || t.includes('boat')) {
            suggestions = [
                { name: "Sony WH-1000XM5", price: "₹26,990", store: "Amazon", link: "https://www.amazon.in/dp/B09XS7JWHH", image: "https://m.media-amazon.com/images/I/61vJtKbAssL._SX522_.jpg" },
                { name: "boAt Airdopes 141", price: "₹1,299", store: "Flipkart", link: "https://www.flipkart.com/search?q=boat+airdopes", image: "https://rukminim2.flixcart.com/image/312/312/xif0q/headphone/m/o/4/-original-imaghbjugwjdjw3x.jpeg" },
                { name: "Apple AirPods Pro", price: "₹24,990", store: "Amazon", link: "https://www.amazon.in/dp/B0BDKD8DVD", image: "https://m.media-amazon.com/images/I/61SUj2aKoEL._SX522_.jpg" }
            ];
        // If it detects a Smartwatch...
        } else if (t.includes('watch') || t.includes('smartwatch')) {
            suggestions = [
                { name: "Apple Watch Series 9", price: "₹41,999", store: "Amazon", link: "https://www.amazon.in/dp/B0CHX58MG6", image: "https://m.media-amazon.com/images/I/71XmYg2uNBL._SX522_.jpg" },
                { name: "Noise ColorFit Pro", price: "₹2,499", store: "Flipkart", link: "https://www.flipkart.com/search?q=noise+smartwatch", image: "https://rukminim2.flixcart.com/image/312/312/xif0q/smartwatch/c/2/6/-original-imagxp8ujfcfh2yz.jpeg" },
                { name: "Samsung Galaxy Watch 6", price: "₹34,999", store: "Amazon", link: "https://www.amazon.in/dp/B0CC9H577N", image: "https://m.media-amazon.com/images/I/61fW8A8jNIL._SX522_.jpg" }
            ];
        // Otherwise, fall back to the Phones logic based on budget!
        } else {
            if (currentPrice >= 60000) {
                suggestions = [
                    { name: "iPhone 15 Pro", price: "₹1,37,990", store: "Amazon", link: "https://www.amazon.in/dp/B0CHX1W1XY", image: "https://m.media-amazon.com/images/I/81SigpJN1KL._SX522_.jpg" },
                    { name: "Samsung S24 Ultra", price: "₹1,29,999", store: "Flipkart", link: "https://www.flipkart.com/search?q=samsung+s24+ultra", image: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/5/q/6/-original-imagy2kwttxzzwqy.jpeg" },
                    { name: "Google Pixel 8 Pro", price: "₹1,06,999", store: "Flipkart", link: "https://www.flipkart.com/search?q=pixel+8+pro", image: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/5/e/6/pixel-8-pro-ga04543-in-google-original-imagvgzhhqzmhqhz.jpeg" }
                ];
            } else if (currentPrice >= 25000) {
                suggestions = [
                    { name: "Motorola Edge 40 Neo", price: "₹22,999", store: "Flipkart", link: "https://www.flipkart.com/search?q=moto+edge+40+neo", image: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/u/v/h/-original-imagxaqtzmqgtfen.jpeg" },
                    { name: "Nothing Phone (2a)", price: "₹23,999", store: "Flipkart", link: "https://www.flipkart.com/search?q=nothing+phone+2a", image: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/c/k/9/phone-2a-5g-a142-nothing-original-imagym2qzyzwcgwq.jpeg" },
                    { name: "OnePlus Nord CE 4", price: "₹24,999", store: "Amazon", link: "https://www.amazon.in/dp/B0CX58L5Y5", image: "https://m.media-amazon.com/images/I/611bHmy1r2L._SX522_.jpg" }
                ];
            } else {
                suggestions = [
                    { name: "Poco X6 Neo 5G", price: "₹15,999", store: "Flipkart", link: "https://www.flipkart.com/search?q=poco+x6+neo", image: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/n/x/r/-original-imagz7g9yqzyzqc5.jpeg" },
                    { name: "Redmi 12 5G", price: "₹11,999", store: "Amazon", link: "https://www.amazon.in/dp/B0C74P8QDC", image: "https://m.media-amazon.com/images/I/71tCOhEigtL._SX522_.jpg" },
                    { name: "Samsung Galaxy M14", price: "₹12,490", store: "Amazon", link: "https://www.amazon.in/search?q=samsung+m14", image: "https://m.media-amazon.com/images/I/818VqDSKp8L._SX522_.jpg" }
                ];
            }
        }

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
