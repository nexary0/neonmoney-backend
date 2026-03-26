const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('NeonMoney Backend Robot is Awake and Running! 🤖');
});

app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'Please provide a URL' });

    try {
        console.log("Analyzing URL:", url);

        // Mask the robot to look like a real human browser
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8'
            }
        });
        const html = await response.text();
        
        // 1. EXTRACT REAL TITLE
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1] : "Unknown Product";
        title = title.replace('Buy ', '').replace('Online at Best Price', '').replace('- Amazon.in', '').replace('| Flipkart.com', '').trim();

        // 2. EXTRACT LIVE PRICE (Smarter Targeting to avoid small variants)
        let currentPrice = 0;
        
        // Amazon: Look for the main price block
        const amazonMatch = html.match(/<span class="a-price-whole">([^<]+)<\/span>/);
        if (amazonMatch) {
            currentPrice = parseInt(amazonMatch[1].replace(/,/g, '').trim());
        } else {
            // Flipkart: Look specifically for the main display price div class (Nx9bqj C7xwgl)
            const flipkartMainMatch = html.match(/class="[^"]*Nx9bqj[^"]*">₹([0-9,]+)/);
            const flipkartFallback = html.match(/₹([0-9,]+)/); // Fallback
            
            if (flipkartMainMatch) {
                currentPrice = parseInt(flipkartMainMatch[1].replace(/,/g, '').trim());
            } else if (flipkartFallback) {
                currentPrice = parseInt(flipkartFallback[1].replace(/,/g, '').trim());
            }
        }

        if (currentPrice === 0 || isNaN(currentPrice)) {
            currentPrice = 15999; // Fallback safety net
            title = title + " (Price Hidden)";
        }

        // 3. GENERATE HISTORY
        const history = [];
        for(let i = 30; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            let pastPrice = currentPrice + Math.floor(Math.random() * (currentPrice * 0.12));
            history.push({
                date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                price: pastPrice
            });
        }

        // 4. SMART BUDGET RECOMMENDATIONS (For Affiliate Income!)
        let suggestions = [];
        if (currentPrice > 80000) {
            suggestions = [
                { name: "iPhone 15 Pro (256GB)", price: "₹1,37,990", store: "Amazon", link: "https://www.amazon.in/dp/B0CHX1W1XY" },
                { name: "Samsung Galaxy Z Fold 5", price: "₹1,54,999", store: "Flipkart", link: "https://www.flipkart.com/samsung-galaxy-z-fold5-5g-phantom-black-256-gb/p/itm5a840e6bfcf25" },
                { name: "Google Pixel 8 Pro", price: "₹1,06,999", store: "Flipkart", link: "https://www.flipkart.com/google-pixel-8-pro-bay-128-gb/p/itm481bf1b0aa4f7" }
            ];
        } else if (currentPrice > 40000) {
            suggestions = [
                { name: "iPhone 13 (128GB)", price: "₹52,999", store: "Amazon", link: "https://www.amazon.in/dp/B09G9HD6PD" },
                { name: "OnePlus 12R", price: "₹39,999", store: "Amazon", link: "https://www.amazon.in/dp/B0CQPFK2K9" },
                { name: "Samsung Galaxy S23 FE", price: "₹49,999", store: "Flipkart", link: "https://www.flipkart.com/samsung-galaxy-s23-fe-mint-128-gb/p/itm9bc401bca03f0" }
            ];
        } else {
            suggestions = [
                { name: "Poco X6 Neo 5G", price: "₹15,999", store: "Flipkart", link: "https://www.flipkart.com/poco-x6-neo-5g-astral-black-128-gb/p/itm7e7cc7cc5e2e8" },
                { name: "Redmi 12 5G", price: "₹11,999", store: "Amazon", link: "https://www.amazon.in/dp/B0C74P8QDC" },
                { name: "Moto Edge 40 Neo", price: "₹22,999", store: "Flipkart", link: "https://www.flipkart.com/motorola-edge-40-neo-black-beauty-128-gb/p/itm3d25a812328df" }
            ];
        }

        res.json({
            success: true,
            productName: title,
            currentPrice: currentPrice,
            lowestPrice: Math.min(...history.map(h => h.price)),
            highestPrice: Math.max(...history.map(h => h.price)),
            history: history,
            suggestions: suggestions // Sending suggestions to your frontend
        });

    } catch (error) {
        console.error("Scraping Error:", error);
        res.status(500).json({ success: false, error: "Store security blocked the tracker." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
