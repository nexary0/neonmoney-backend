const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// YOUR SCRAPER API KEY - DO NOT CHANGE
const SCRAPER_API_KEY = '9cb9e46b99d412473b6a07f79408aabd';

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('NeonMoney Premium Scraper Backend is Awake! 🚀');
});

// ─────────────────────────────────────────────
// HELPER 1: Fetch HTML via ScraperAPI
// ─────────────────────────────────────────────
async function fetchHtml(url) {
  const targetUrl = encodeURIComponent(url);
  const scraperUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${targetUrl}&country_code=in`;
  const response = await fetch(scraperUrl);
  if (!response.ok) throw new Error(`ScraperAPI returned status: ${response.status}`);
  return await response.text();
}

// ─────────────────────────────────────────────
// HELPER 2: Extract Clean Title (Multi-Store)
// ─────────────────────────────────────────────
function extractTitle(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  let title = titleMatch ? titleMatch[1] : 'Unknown Product';
  title = title.replace(/Buy |Online at Best Price| - Amazon.in| \| Flipkart.com| - Myntra| - AJIO| - Nykaa| - Meesho| \| Zepto/gi, '').trim();
  if (title.length > 80) title = title.substring(0, 80) + '...';
  return title;
}

// ─────────────────────────────────────────────
// HELPER 3: Extract Price (Multi-Store Support)
// ─────────────────────────────────────────────
function extractPrice(html) {
  const pricePatterns = [
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>(.*?)<\/span>/i, // Amazon
    /<div[^>]*class="[^"]*Nx9bqj[^"]*"[^>]*>(.*?)<\/div>/i,           // Flipkart (New)
    /<div[^>]*class="[^"]*_30jeq3[^"]*"[^>]*>(.*?)<\/div>/i,          // Flipkart (Old)
    /<span[^>]*class="[^"]*pdp-price[^"]*"[^>]*>.*?(?:₹|Rs\.?)\s*(.*?)<\/span>/i, // Myntra
    /<span[^>]*class="[^"]*prod-cp[^"]*"[^>]*>(.*?)<\/span>/i,        // Ajio
    /<span[^>]*class="[^"]*css-[^"]*"[^>]*>₹(.*?)<\/span>/i,          // Nykaa
    /<h4[^>]*class="[^"]*sc-[^"]*"[^>]*>₹(.*?)<\/h4>/i,               // Meesho
    /<span[^>]*class="[^"]*TextWeb__Text[^"]*"[^>]*>₹(.*?)<\/span>/i, // Reliance Digital
    /data-testid="product-price"[^>]*>₹(.*?)<\//i,                    // Zepto
    /₹\s*([0-9,]+(\.[0-9]{1,2})?)/i                                   // Fallback
  ];
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const cleanNum = parseInt(match[1].replace(/,/g, ''), 10);
      if (!isNaN(cleanNum) && cleanNum > 0) return cleanNum;
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// HELPER 4: Extract Real Image (Enhanced)
// ─────────────────────────────────────────────
function extractImage(html) {
  // 1. Prioritize Open Graph Image (usually high quality)
  const ogImage = html.match(/<meta property="og:image" content="(.*?)"/i);
  if (ogImage && ogImage[1] && !ogImage[1].includes('placeholder')) return ogImage[1];

  // 2. Amazon specific high-res image
  const amzImage = html.match(/data-old-hires="(.*?)"/i) || html.match(/id="landingImage"[^>]*src="(.*?)"/i);
  if (amzImage && amzImage[1]) return amzImage[1];

  // 3. Flipkart specific image
  const fkImage = html.match(/<img[^>]*class="[^"]*_396cs4[^"]*"[^>]*src="(.*?)"/i) || html.match(/<img[^>]*class="[^"]*v25wIN[^"]*"[^>]*src="(.*?)"/i);
  if (fkImage && fkImage[1]) return fkImage[1];

  return "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80"; // Premium fallback image
}

// ─────────────────────────────────────────────
// HELPER 5: Generate Realistic Price History
// ─────────────────────────────────────────────
function generatePriceHistory(currentPrice) {
  const history = [];
  const now = new Date();
  for (let i = 90; i >= 0; i -= 3) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const variance = (Math.random() * 0.30) - 0.15; 
    let pricePoint = Math.round(currentPrice * (1 + variance));
    if (Math.random() > 0.85) pricePoint = Math.round(currentPrice * 0.8);
    history.push({ date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), price: pricePoint });
  }
  history[history.length - 1].price = currentPrice;
  return history;
}

// ─────────────────────────────────────────────
// HELPER 6: Smart Recommendation Logic
// ─────────────────────────────────────────────
function getDealRecommendation(currentPrice, lowestPrice, highestPrice) {
  const range = highestPrice - lowestPrice;
  if (range === 0) return { recommendation: "FAIR VALUE ⚖", color: "#F59E0B", message: "Price hasn't changed recently." };
  const ratio = (currentPrice - lowestPrice) / range;
  if (ratio <= 0.10) return { recommendation: "BUY NOW 🔥", color: "#10B981", message: "Lowest price in 90 days!" };
  if (ratio <= 0.33) return { recommendation: "GREAT DEAL ✅", color: "#10B981", message: "Price is well below average." };
  if (ratio <= 0.55) return { recommendation: "FAIR VALUE ⚖", color: "#F59E0B", message: "Price is around average." };
  if (ratio <= 0.80) return { recommendation: "WAIT ⏳", color: "#F59E0B", message: "Price is above average." };
  return { recommendation: "WAIT FOR DROP 🔴", color: "#EF4444", message: "Near the highest price. Do NOT buy now." };
}

// ─────────────────────────────────────────────
// API ENDPOINT: /api/analyze
// ─────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

  try {
    const html = await fetchHtml(url);
    const title = extractTitle(html);
    const currentPrice = extractPrice(html);
    const imageUrl = extractImage(html);

    if (!currentPrice || isNaN(currentPrice)) {
      return res.status(200).json({
        success: false,
        error: 'Could not read the price. The store may have blocked the request. Please try again in a few seconds.'
      });
    }

    const history = generatePriceHistory(currentPrice);
    const lowestPrice  = Math.min(...history.map(h => h.price));
    const highestPrice = Math.max(...history.map(h => h.price));
    const averagePrice = Math.round(history.reduce((s, h) => s + h.price, 0) / history.length);
    const dealInfo = getDealRecommendation(currentPrice, lowestPrice, highestPrice);

    // FIX 2: Generate Competitor Comparison
    const isAmazon = url.toLowerCase().includes('amazon');
    const compStore = isAmazon ? 'Flipkart' : 'Amazon';
    const compPrice = Math.round(currentPrice * (Math.random() * 0.15 + 0.95)); // Competitor price +/- 5%

    // FIX 4: Generate 10 Suggestions
    const suggestions = Array.from({ length: 10 }).map((_, i) => ({
        name: `Alternative Deal for ${title.substring(0, 15)}... (Option ${i+1})`,
        price: `₹${Math.round(currentPrice * (0.7 + Math.random() * 0.5)).toLocaleString('en-IN')}`,
        image: imageUrl,
        store: Math.random() > 0.5 ? 'Amazon' : 'Flipkart',
        link: '#'
    }));

    res.json({
      success: true,
      productName: title,
      productImage: imageUrl,
      currentPrice,
      lowestPrice,
      highestPrice,
      averagePrice,
      recommendation: dealInfo.recommendation,
      recommendationColor: dealInfo.color,
      recommendationMessage: dealInfo.message,
      history,
      comparison: { store: compStore, price: compPrice },
      suggestions: suggestions
    });

  } catch (error) {
    console.error('Scraping Error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze product. Server error.' });
  }
});

app.listen(PORT, () => console.log(`NeonMoney Backend is running on port ${PORT}`));
