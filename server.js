<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Price History Analysis | NeonMoney</title>
<link rel="icon" type="image/png" href="logo.png">
<script src="h ps://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
:root {--bh-blue: #4f46e5;--bh-orange: #f97316;--bh-green: #10b981;--bh-red: #ef4444;--bh-yellow: #f59e0b;--bg-light: #f8fafc;--border-light: #e2e8f0;--text-main: #0f172a;--text-muted: #64748b;--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helv
etica, Arial, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
font-family: var(--font-family);
background-color: var(--bg-light);
color: var(--text-main);
line-height: 1.5;
padding-bo om: 80px;
}
a { text-decoration: none; }
/* HEADER */
.bh-header {
border-bo om: 1px solid var(--border-light);
padding: 15px 40px;
display: ex;
justify-content: space-between;
align-items: center;
background: # f;
position: sticky;
top: 0;
z-index: 50;
}
.bh-logo {
display: ex;
align-items: center;
gap: 8px;
font-size: 1.5rem;
font-weight: 800;
color: var(--bh-blue);
}
.bh-logo img { height: 32px; border-radius: 6px; }
.bh-nav { display: ex; gap: 24px; font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
.bh-nav a { color: var(--text-main); }
.bh-nav a:hover { color: var(--bh-blue); }
.bh-actions { display: ex; gap: 16px; align-items: center; }
.bh-btn-install {
background: #f1f5f9;
color: var(--text-main);
padding: 8px 16px;
border-radius: 100px;
font-weight: 600;
font-size: 0.85rem;
border: 1px solid var(--border-light);
display: ex;
align-items: center;
gap: 6px;
}
.bh-btn-login {
background: var(--bh-blue);
color: # f;
padding: 8px 24px;
border-radius: 100px;
font-weight: 600;
font-size: 0.9rem;
border: none;
cursor: pointer;
}
/* LAYOUT */
.container { max-width: 1200px; margin: 0 auto; padding: 30px 20px; }
.top-section { display: ex; gap: 30px; margin-bo om: 30px; align-items: ex-s
tart; }
.product-col { ex: 1; display: ex; gap: 30px; }
/* PRODUCT IMAGE BOX */
.product-img-box {
width: 300px;
height: 350px;
border: 1px solid var(--border-light);
border-radius: 12px;
display: ex;
align-items: center;
justify-content: center;
background: # f;
padding: 20px;
over ow: hidden;
}
ex-shrink: 0;
.product-img-box img {
max-width: 100%;
max-height: 100%;
object-t: contain;
border-radius: 8px;
}
.product-details { ex: 1; padding-top: 10px; }
.store-badge {
display: inline-ex;
align-items: center;
gap: 6px;
background: #f8fafc;
border: 1px solid var(--border-light);
padding: 4px 12px;
border-radius: 100px;
font-size: 0.8rem;
font-weight: 700;
color: var(--text-main);
margin-bo om: 12px;
}
.product-title {
font-size: 1.4rem;
font-weight: 600;
margin-bo om: 12px;
color: var(--text-main);
line-height: 1.4;
}
.product-rating { color: var(--bh-orange); font-size: 1.1rem; margin-bo om: 16px;
font-weight: bold; }
.product-price { font-size: 2.5rem; font-weight: 800; color: var(--text-main); mar
gin-bo om: 20px; }
.share-box {
display: ex;
align-items: center;
gap: 12px;
border: 1px solid var(--border-light);
padding: 8px 16px;
border-radius: 100px;
width: t-content;
font-size: 0.85rem;
color: var(--text-muted);
}
.share-btn { font-size: 1.2rem; cursor: pointer; transition: transform 0.2s; }
.share-btn:hover { transform: scale(1.2); }
/* GAUGE COLUMN */
.gauge-col {
width: 360px;
border: 1px solid var(--border-light);
border-radius: 12px;
padding: 24px;
background: # f;
ex-shrink: 0;
}
.gauge-wrapper { display: ex; align-items: center; gap: 20px; margin-bo om: 2
4px; }
.gauge-svg-box { width: 140px; position: relative; ex-shrink: 0; }
.verdict-box { ex: 1; }
.verdict-label { font-size: 0.75rem; color: var(--text-muted); margin-bo om: 4px;
}
.verdict-text { font-size: 1.1rem; font-weight: 700; color: var(--bh-green); }
.verdict-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; line
height: 1.4; }
/* STATS BOX */
.stats-box { margin-top: 20px; }
.stats-title { font-size: 1rem; font-weight: 700; margin-bo om: 12px; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.stat-card { background: #f8fafc; padding: 12px; border-radius: 8px; text-align: 
center; }
.stat-label { font-size: 0.75rem; color: var(--text-muted); margin-bo om: 4px; }
.stat-value { font-size: 1.1rem; font-weight: 700; }
.stat-card.full-width { grid-column: span 2; }
/* MIDDLE SECTION */
.middle-section { display: ex; gap: 30px; margin-bo om: 50px; }
.graph-col {
ex: 1;
border: 1px solid var(--border-light);
border-radius: 12px;
padding: 24px;
background: # f;
}
.graph-header {
display: ex;
justify-content: space-between;
align-items: center;
margin-bo om: 20px;
}
.graph-title { font-size: 1.2rem; font-weight: 700; }
.graph-tabs {
display: ex;
background: #f1f5f9;
border-radius: 100px;
padding: 4px;
}
.g-tab {
  padding: 4px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 100px;
  color: var(--text-muted);
  transition: background 0.3s;
}
.g-tab.active { background: # f; color: var(--bh-blue); box-shadow: 0 2px 4px r
gba(0,0,0,0.05); }
/* ALERT COLUMN */
.alert-col {
  width: 360px;
  background: #f8fafc;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 24px;
  display: ex;
  ex-direction: column;
  justify-content: center;
  ex-shrink: 0;
}
.alert-title { text-align: center; font-weight: 700; margin-bo om: 16px; font-size: 
1rem; }
.alert-input-group { display: ex; gap: 8px; margin-bo om: 16px; }
.alert-input {
  ex: 1;
  padding: 10px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  font-size: 1rem;
  background: # f;
}
.btn-alert {
  background: var(--bh-blue);
  color: # f;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.alert-or {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 12px 0;
}
.btn-buy-store {
  background: var(--bh-orange);
  color: # f;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  text-align: center;
  display: block;
  cursor: pointer;
  width: 100%;
}
.btn-buy-store:hover { opacity: 0.9; }
/* DEALS / SUGGESTIONS */
.deals-section { margin-bo om: 50px; }
.deals-title { font-size: 1.4rem; font-weight: 600; margin-bo om: 20px; }
.deals-grid {
display: grid;
grid-template-columns: repeat(auto-ll, minmax(220px, 1fr));
gap: 20px;
}
.deal-card {
border: 1px solid var(--border-light);
border-radius: 12px;
padding: 16px;
text-align: center;
background: # f;
transition: box-shadow 0.2s;
}
.deal-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.deal-img {
height: 160px;
display: ex;
align-items: center;
justify-content: center;
margin-bo om: 12px;
background: #f8fafc;
border-radius: 8px;
padding: 10px;
over ow: hidden;
}
.deal-img img { max-width: 100%; max-height: 100%; object-t: contain; }
.deal-name {
font-size: 0.9rem;
font-weight: 600;
margin-bo om: 8px;
color: var(--text-main);
line-height: 1.3;
height: 42px;
over ow: hidden;
display: -webkit-box;-webkit-line-clamp: 2;-webkit-box-orient: vertical;
}
.deal-price { font-size: 1rem; font-weight: 700; color: var(--text-main); margin-b
o om: 4px; }
.deal-store { font-size: 0.75rem; color: var(--text-muted); margin-bo om: 10px; 
}
.deal-discount {
font-size: 0.8rem;
color: var(--bh-green);
font-weight: 700;
background: rgba(16,185,129,0.1);
padding: 2px 6px;
border-radius: 4px;
}
.btn-deal {
display: block;
background: var(--bh-blue);
color: # f;
padding: 10px;
border-radius: 8px;
font-size: 0.85rem;
font-weight: 600;
margin-top: 10px;
transition: opacity 0.2s;
}
.btn-deal:hover { opacity: 0.85; }
/* STICKY FOOTER */
.sticky-footer {
  position: xed;
  bo om: 0;
  left: 0;
  right: 0;
  background: #3730a3;
  padding: 12px 40px;
  display: ex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  color: # f;
  font-size: 0.95rem;
  z-index: 100;
}
.btn-sticky {
  background: var(--bh-blue);
  color: # f;
  border: none;
  padding: 8px 24px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}
/* LOADING */
#loading-overlay {
  position: xed;
  inset: 0;
  background: rgba(255,255,255,0.95);
  z-index: 999;
  display: ex;
  ex-direction: column;
}
align-items: center;
justify-content: center;
.spinner {
border: 4px solid #f3f3f3;
border-top: 4px solid var(--bh-blue);
border-radius: 50%;
width: 50px;
height: 50px;
animation: spin 1s linear innite;
margin-bo om: 20px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(36
0deg); } }
/* RESPONSIVE */
@media (max-width: 900px) {
.top-section, .middle-section { ex-direction: column; }
.gauge-col, .alert-col { width: 100%; }
.product-col { ex-direction: column; }
.product-img-box { width: 100%; height: 250px; }
.bh-nav, .bh-btn-install { display: none; }
.bh-header { padding: 12px 16px; }
.container { padding: 16px; }
}
</style>
</head>
<body>
<!-- HEADER -->
<header class="bh-header">
<a href="index.html" class="bh-logo">
<img src="logo.png" alt="NeonMoney">
    <span>NeonMoney</span>
  </a>
  <div class="bh-nav">
    <a href="deals.html">Hot Deals</a>
    <a href="store.html">Stores</a>
    <a href="rewards.html">Rewards</a>
  </div>
  <div class="bh-actions">
    <div class="bh-btn-install">⭐ Track Prices Automatically</div>
    <a href="login.html" class="bh-btn-login">Login</a>
  </div>
</header>
<!-- LOADING OVERLAY -->
<div id="loading-overlay">
  <div class="spinner"></div>
  <h2>Analyzing Price History...</h2>
  <p style="color:#64748b; margin-top:8px;">Fetching real-time data from stor
e servers</p>
</div>
<!-- MAIN CONTENT (hidden until data loads) -->
<div class="container" style="display:none;" id="main-content">
  <!-- TOP SECTION: Product + Gauge -->
  <div class="top-section">
    <!-- Product Image + Details -->
    <div class="product-col">
      <div class="product-img-box" id="res-img-box">
        <div class="spinner" style="width:30px;height:30px;border-width:3px;"></
div>
      </div>
      <div class="product-details">
        <div class="store-badge" id="res-store">🛍 Flipkart</div>
        <h1 class="product-title" id="res-title">Product Name</h1>
        <div class="product-rating">4.5 
★★★★★
 <span style="color:#64748b;f
ont-weight:normal;font-size:0.9rem;">(Estimated)</span></div>
        <div class="product-price" id="res-price">₹0</div>
        <div class="share-box">
          <span>Share on</span>
          <span class="share-btn" id="share-wa" title="Share to WhatsApp">🟢 W
hatsApp</span>
          <span class="share-btn" id="share-copy" title="Copy Link">📋 Copy</s
pan>
        </div>
      </div>
    </div>
    <!-- Gauge + Stats -->
    <div class="gauge-col">
      <div style="font-weight:700; margin-bo om:20px; font-size:1.1rem;">Shoul
d you buy now?</div>
      <div class="gauge-wrapper">
        <div class="gauge-svg-box">
          <!-- Gauge: left=Bad(red), middle=Fair(yellow), right=Good(green) -->
          <svg viewBox="0 0 100 55" style="width:100%; over ow:visible;">
            <path d="M 10 50 A 40 40 0 0 1 36 18" ll="none" stroke="#ef4444" st
roke-width="12" stroke-linecap="round"/>
            <path d="M 36 18 A 40 40 0 0 1 64 18" ll="none" stroke="#f59e0b" st
roke-width="12"/>
            <path d="M 64 18 A 40 40 0 0 1 90 50" ll="none" stroke="#10b981" s
troke-width="12" stroke-linecap="round"/>
            <!-- Needle: rotated by JS using SVG transform for accuracy -->
            <g id="gauge-needle">
              <polygon points="48,50 52,50 50,15" ll="#1e293b"/>
              <circle cx="50" cy="50" r="4" ll="#1e293b"/>
            </g>
          </svg>
          <div style="display: ex;justify-content:space-between;font-size:0.65rem;f
ont-weight:700;color:var(--text-muted);margin-top:4px;">
            <span style="color:#ef4444;">
■
 Bad</span>
            <span style="color:#10b981;">
■
 Good</span>
          </div>
        </div>
        <div class="verdict-box">
          <div class="verdict-label">Our Recommendation</div>
          <div class="verdict-text" id="res-verdict">Analyzing...</div>
          <div class="verdict-sub" id="res-verdict-msg">Please wait</div>
        </div>
      </div>
      <!-- Price Stats -->
      <div class="stats-box">
        <div class="stats-title">Price Stats</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Highest Price ↑</div>
            <div class="stat-value" id="res-high">₹0</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Average Price 
↕
</div>
            <div class="stat-value" id="res-avg">₹0</div>
          </div>
          <div class="stat-card full-width">
            <div class="stat-label">Lowest Price ↓</div>
            <div class="stat-value" style="color:var(--bh-green);font-size:1.3rem;" id
="res-low">₹0</div>
          </div>
        </div>
      </div>
    </div>
  </div><!-- /top-section -->
  <!-- MIDDLE SECTION: Chart + Alert -->
  <div class="middle-section">
    <!-- Price History Chart -->
    <div class="graph-col">
      <div class="graph-header">
        <div class="graph-title">Price History</div>
        <div class="graph-tabs">
          <span class="g-tab active" id="tab-1m">1 Month</span>
          <span class="g-tab" id="tab-3m">3 Months</span>
          <span class="g-tab" id="tab-max">Max</span>
        </div>
      </div>
      <div style="position:relative; height:300px; width:100%;">
        <canvas id="priceChart"></canvas>
      </div>
    </div>
    <!-- Price Alert + Buy Bu on -->
    <div class="alert-col">
      <div class="alert-title">Set price drop alert to buy later</div>
      <div class="alert-input-group">
        <input type="number" class="alert-input" id="alert-price" placeholder="Tar
get Price (₹)">
        <bu on class="btn-alert" id="save-alert-btn">Login & Set Alert</bu on>
      </div>
<p id="vault-success" style="display:none; color:var(--bh-green); text-align:
center; font-size:0.85rem; font-weight:bold;">✅ Saved to Vault!</p>
<div class="alert-or">OR</div>
<a href="#" target="_blank" class="btn-buy-store" id="res-buy-btn">Buy o
n Store</a>
</div>
</div><!-- /middle-section -->
<!-- SUGGESTIONS / DEALS -->
<div class="deals-section" id="suggestions-container" style="display:none;">
<h2 class="deals-title">Deals in this category</h2>
<div class="deals-grid" id="suggestions-grid"></div>
</div>
</div><!-- /container -->
<!-- STICKY FOOTER -->
<div class="sticky-footer">
<span>
○
 We compare prices and show you the lowest price instantly.</span
>
<bu on class="btn-sticky" onclick="window.location.href='index.html'">Find t
he Lowest Price</bu on>
</div>
<!-- CUELINKS -->
<script type='text/javascript'>
var cId = '271764';
(function(d, t) {
var s = document.createElement('script');
s.type = 'text/javascript';
s.async = true;
s.src = (document.location.protocol == 'h ps:' ? 'h ps://cdn0.cuelinks.com/js
/' : 'h p://cdn0.cuelinks.com/js/') + 'cuelinksv2.js';
document.getElementsByTagName('body')[0].appendChild(s);
}());
</script>
<!-- MAIN SCRIPT -->
<script type="module">
import { initializeApp, getApps, getApp } from "h ps://www.gstatic.com/ rebas
ejs/10.8.1/ rebase-app.js";
import { getAuth, onAuthStateChanged } from "h ps://www.gstatic.com/ rebas
ejs/10.8.1/ rebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "h ps://ww
w
.gstatic.com/ rebasejs/10.8.1/ rebase-restore.js";
// YOUR FIREBASE CONFIG — DO NOT CHANGE
const rebaseCong = {
apiKey: "AIzaSyBNXh2aPjvZcWceDxCuMNzJegJ3RKwNsx0",
authDomain: "neonmoney-a2d18. rebaseapp.com",
projectId: "neonmoney-a2d18",
storageBucket: "neonmoney-a2d18. rebasestorage.app",
messagingSenderId: "759618988071",
appId: "1759618988071web:b65d190a3a7ececabc4602"
};
const app = !getApps().length ? initializeApp( rebaseCong) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
let currentUser = null;
let chartInstance = null;
let globalHistoryData = [];
onAuthStateChanged(auth, (user) => { currentUser = user; });
// Get product URL from query params
const params = new URLSearchParams(window.location.search);
const productUrl = params.get('url');
if (!productUrl) {
alert("No product link found. Returning to home.");
window.location.href = "index.html";
}
// SHARE BUTTONS
document.getElementById('share-wa').addEventListener('click', () => {
const text = encodeURIComponent("Check out this price I found! " + product
Url);
window.open(`
h ps://api.whatsapp.com/send?text=${text}`
, '_blank');
});
document.getElementById('share-copy').addEventListener('click', () => {
navigator.clipboard.writeText(productUrl).then(() => {
alert("Product Link Copied to Clipboard!");
});
});
// 
─────────────────────────────────────────────
// SET GAUGE NEEDLE (uses SVG transform for accuracy)
// angle: -90 = left (bad/red), 0 = up (fair/yellow), +90 = right (good/green)
// 
─────────────────────────────────────────────
function setGaugeNeedle(ratio) {
// ratio 0 = lowest price (BUY NOW = right = green)
// ratio 1 = highest price (WAIT = left = red)
const angle = 90 - (ratio * 180);
document.getElementById('gauge-needle').setA ribute('transform', 
`
rotate(${
Math.round(angle)}, 50, 50)`
);
}
// 
─────────────────────────────────────────────
// MAIN: Fetch & Display Product
// 
─────────────────────────────────────────────
async function analyzeProduct() {
  try {
    const response = await fetch('h ps://neonmoney-backend.onrender.com/api
/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: productUrl })
    });
    const data = await response.json();
    if (data.success) {
      // Hide loading, show content
      document.getElementById('loading-overlay').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      // Store badge
      const isAmazon = productUrl.toLowerCase().includes('amazon');
      document.getElementById('res-store').textContent = isAmazon ? '🛒 Amazo
n' : '🛍 Flipkart';
      // Buy bu on
      const buyBtn = document.getElementById('res-buy-btn');
      buyBtn.textContent = 
`
Buy on ${isAmazon ? 'Amazon' : 'Flipkart'}`
;
      buyBtn.style.background = isAmazon ? '#f59e0b' : '#f97316';
      buyBtn.href = productUrl;
      // REAL Product Image (no dummy)
      const imgBox = document.getElementById('res-img-box');
      const img = new Image();
      img.onload = () => {
        imgBox.innerHTML = '';
        imgBox.appendChild(img);
      };
      img.onerror = () => {
        imgBox.innerHTML = '<span style="font-size:4rem;">📦</span>';
      };
      img.src = data.productImage;
      img.style.cssText = 'max-width:100%; max-height:100%; object-t:contain;';
      img.alt = data.productName;
      // Title & Price
      document.getElementById('res-title').textContent = data.productName;
      document.getElementById('res-price').textContent = '₹' + data.currentPrice.t
oLocaleString('en-IN');
      // Price Stats — use server-computed values
      document.getElementById('res-low').textContent  = '₹' + data.lowestPrice.to
LocaleString('en-IN');
      document.getElementById('res-high').textContent = '₹' + data.highestPrice.t
oLocaleString('en-IN');
      document.getElementById('res-avg').textContent  = '₹' + data.averagePrice.t
oLocaleString('en-IN');
      // Alert price pre-ll
      document.getElementById('alert-price').value = data.lowestPrice;
      // 
──
 SMART GAUGE + VERDICT (from server — NOT random) 
──
      const range = data.highestPrice - data.lowestPrice;
      const ratio = range === 0 ? 0.5 : (data.currentPrice - data.lowestPrice) / ran
ge;
      setGaugeNeedle(ratio);
      const verdictEl = document.getElementById('res-verdict');
      const verdictMsg = document.getElementById('res-verdict-msg');
      // Use server recommendation if available, else calculate from ratio
      if (data.recommendation) {
        verdictEl.textContent = data.recommendation;
        verdictMsg.textContent = data.recommendationMessage || '';
      } else {
        if (ratio <= 0.10) {
          verdictEl.textContent = 'BUY NOW 🔥';
          verdictMsg.textContent = 'Lowest price in 90 days!';
        } else if (ratio <= 0.33) {
          verdictEl.textContent = 'GREAT DEAL ✅';
          verdictMsg.textContent = 'Price is well below average.';
        } else if (ratio <= 0.55) {
          verdictEl.textContent = 'FAIR VALUE ⚖';
          verdictMsg.textContent = 'Price is around average.';
        } else if (ratio <= 0.80) {
          verdictEl.textContent = 'WAIT ⏳';
          verdictMsg.textContent = 'Price is above average.';
        } else {
          verdictEl.textContent = 'WAIT FOR DROP 🔴';
          verdictMsg.textContent = 'Near the highest price. Do NOT buy now.';
        }
      }
      // Set verdict color based on server recommendationColor or ratio
      const color = data.recommendationColor ||
        (ratio <= 0.10 ? 'green' : ratio <= 0.33 ? 'lightgreen' : ratio <= 0.55 ? 'orange'
 : ratio <= 0.80 ? '#f59e0b' : '#ef4444');
      verdictEl.style.color = color;
      // 
──
 PRICE HISTORY CHART 
──
      globalHistoryData = data.history;
      drawChart(globalHistoryData.slice(-30));
      // 
──
 BUDGET SUGGESTIONS 
──
      const sugGrid = document.getElementById('suggestions-grid');
      if (data.suggestions && data.suggestions.length > 0) {
        sugGrid.innerHTML = '';
        data.suggestions.forEach(item => {
          sugGrid.innerHTML += 
`
            <div class="deal-card">
              <div class="deal-img">
                <img src="${item.image}"
                     onerror="this.parentElement.innerHTML='<span style=\\"font-size:
3rem;\\">📦</span>'"
                     alt="${item.name}">
              </div>
              <div class="deal-name">${item.name}</div>
              <div class="deal-price">${item.price}</div>
              <div class="deal-store">${item.store}</div>
              <div><span class="deal-discount">↓ Search Deals</span></div>
              <a href="${item.link}" target="_blank" class="btn-deal">Search on ${it
em.store}</a>
            </div>
          
`
;
        });
        document.getElementById('suggestions-container').style.display = 'block';
      }
    } else {
      document.getElementById('loading-overlay').style.display = 'none';
      alert("Analysis Error: " + (data.error || "Unknown error. Please try again."));
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error(error);
    document.getElementById('loading-overlay').style.display = 'none';
    alert("Backend server is currently o ine or unreachable. Please try again.");
    window.location.href = "index.html";
  }
}
// 
─────────────────────────────────────────────
// CHART DRAW (BuyHatke style gradient area chart)
// 
─────────────────────────────────────────────
function drawChart(historyData) {
  const ctx = document.getElementById('priceChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  const sorted = [...historyData].reverse(); // oldest → newest
  const labels = sorted.map(h => h.date);
  const prices = sorted.map(h => h.price);
  let gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
  gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Price (₹)',
        data: prices,
        borderColor: '#ef4444',
        backgroundColor: gradient,
        borderWidth: 2,
        pointBackgroundColor: '# f',
        pointBorderColor: '#ef4444',
        pointRadius: 0,
        pointHoverRadius: 6,
        ll: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => '₹' + ctx.parsed.y.toLocaleString('en-IN')
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: '#94a3b8',
            callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0) + 'K' : v)
          },
          grid: { display: false },
          border: { display: false }
        },
        x: {
          ticks: { color: '#94a3b8', maxTicksLimit: 8 },
          grid: { display: false },
          border: { display: false }
        }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}
// 
─────────────────────────────────────────────
// CHART TAB SWITCHING
// 
─────────────────────────────────────────────
const tab1m  = document.getElementById('tab-1m');
const tab3m  = document.getElementById('tab-3m');
const tabMax = document.getElementById('tab-max');
const allTabs = [tab1m, tab3m, tabMax];
function clearTabs() { allTabs.forEach(t => t.classList.remove('active')); }
tab1m.addEventListener('click', () => {
  clearTabs(); tab1m.classList.add('active');
  drawChart(globalHistoryData.slice(-30));
});
tab3m.addEventListener('click', () => {
  clearTabs(); tab3m.classList.add('active');
  drawChart(globalHistoryData.slice(-90));
});
tabMax.addEventListener('click', () => {
  clearTabs(); tabMax.classList.add('active');
  drawChart(globalHistoryData);
});
// 
─────────────────────────────────────────────
// SAVE ALERT TO FIREBASE
// 
─────────────────────────────────────────────
document.getElementById('save-alert-btn').addEventListener('click', async () =
> {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }
  const btn = document.getElementById('save-alert-btn');
  btn.textContent = "Saving...";
  try {
    await addDoc(collection(db, "users", currentUser.uid, "trackedProducts"), {
      productUrl: productUrl,
      targetPrice: document.getElementById('alert-price').value,
      dateAdded: serverTimestamp(),
      status: "Tracking"
    });
    btn.style.display = "none";
    document.getElementById('vault-success').style.display = "block";
  } catch (error) {
    console.error(error);
    alert("Could not save. Please try again.");
    btn.textContent = "Login & Set Alert";
  }
});
// START
analyzeProduct();
</script>
</body>
</html
