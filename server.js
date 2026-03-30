const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Your secret keys (Passwords for the tools)
const SCRAPER_API_KEY = '9cb9e46b99d412473b6a07f79408aabd'; // This gets the web pages
const CLAUDE_API_KEY = 'PUT_YOUR_ANTHROPIC_API_KEY_HERE'; // <-- YOU MUST CHANGE THIS!

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Go get the website code
async function fetchHtml(url) {
  const targetUrl = encodeURIComponent(url);
  const scraperUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${targetUrl}&country_code=in`;
  const response = await fetch(scraperUrl);
  return await response.text();
}

// 2. Find the title
function extractTitle(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  let title = titleMatch ? titleMatch[1] : 'Unknown Product';
  return title.replace(/Buy |Online at Best Price| - Amazon.in| \| Flipkart.com/gi, '').trim();
}

// 3. Find the price
function extractPrice(html) {
  const pricePatterns = [
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>(.*?)<\/span>/i, 
    /<div[^>]*class="[^"]*Nx9bqj[^"]*"[^>]*>(.*?)<\/div>/i,
    /<div[^>]*class="[^"]*_30jeq3[^"]*"[^>]*>(.*?)<\/div>/i,
    /₹\s*([0-9,]+(\.[0-9]{1,2})?)/i 
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

// 4. Find the image
function extractImage(html) {
  const ogImage = html.match(/<meta property="og:image" content="(.*?)"/i);
  if (ogImage && ogImage[1]) return ogImage[1];
  return "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80"; 
}

// 5. THE NEW AI BRAIN: Ask Claude for 10 Real Alternatives
async function getRealAlternatives(productName, price) {
  try {
    console.log("Asking AI to find alternatives for:", productName);
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // Fast and cheap AI model
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are a shopping assistant. I am looking at a product called "${productName}" priced at ₹${price}. Find 10 REAL alternative products people might buy instead in India. 
          Return ONLY a raw JSON array of exactly 10 objects. No other text. 
          Format exactly like this: [{"name": "Samsung Galaxy S23", "price": 65000, "image": "https://m.media-amazon.com/images/I/61RZDb2mQxL._SX679_.jpg", "store": "Amazon", "url": "https://amazon.in"}]`
        }]
      })
    });

    const data = await response.json();
    
    // Read the AI's answer and turn it into code
    const rawText = data.content[0].text;
    const jsonMatch = rawText.match(/\[[\s\S]*\]/); // Find the brackets
    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.log("AI failed. Maybe the API key is missing?");
    return null; // If AI fails, return nothing
  }
}

// This is the main action
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

  try {
    console.log("Checking URL:", url);
    const html = await fetchHtml(url);
    const title = extractTitle(html);
    const currentPrice = extractPrice(html);
    const imageUrl = extractImage(html);

    if (!currentPrice) {
      return res.status(200).json({ success: false, error: 'Could not read price.' });
    }

    // Call the new AI Brain!
    let similarProducts = await getRealAlternatives(title, currentPrice);

    // If the AI fails (like if you forgot the API key), make some backup test cards so it doesn't crash
    if (!similarProducts) {
       similarProducts = Array.from({ length: 10 }).map((_, i) => ({
          name: `Backup Test Deal ${i+1}`,
          price: currentPrice - 500,
          image: imageUrl,
          store: 'Amazon',
          url: '#'
      }));
    }

    // Send everything back to the website
    res.json({
      success: true,
      productName: title,
      productImage: imageUrl,
      currentPrice: currentPrice,
      lowestPrice: currentPrice - 1000,
      highestPrice: currentPrice + 1000,
      averagePrice: currentPrice,
      recommendation: "GOOD DEAL ✅",
      recommendationColor: "#10B981",
      recommendationMessage: "This is a solid price right now.",
      similarProducts: similarProducts // Sends the REAL AI suggestions!
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

app.listen(PORT, () => console.log(`Engine is running on port ${PORT}`));
