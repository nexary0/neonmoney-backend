require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const routeUrl = require('./scraperController');
app.use(express.json());
const mongoose = require('mongoose');

// Connect to MongoDB Cloud
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Cloud!'))
    .catch((err) => console.error('MongoDB connection error:', err));

// ==========================================
// 🧠 THE VERDICT MATH LOGIC
// ==========================================
function getDealVerdict(currentPrice, averagePrice) {
    if (!averagePrice || averagePrice === 0) {
        return { text: "NEW PRODUCT - TRACKING STARTED", color: "gray" };
    }
    const tenPercentOff = averagePrice * 0.90;

    if (currentPrice <= tenPercentOff) {
        return { text: "GREAT DEAL - BUY NOW", color: "green" };
    } else if (currentPrice > averagePrice) {
        return { text: "BAD DEAL - DO NOT BUY", color: "red" };
    } else {
        return { text: "AVERAGE PRICE - CAN WAIT", color: "yellow" };
    }
}

// ==========================================
// 🚀 THE MAIN API ENDPOINT
// ==========================================
app.post('/api/track-price', async (req, res) => {
    console.log("\n=================================================");
    console.log(`🚀 NEW REQUEST RECEIVED`);
    console.log(`🔗 Link: ${req.body.productUrl}`);
    console.log("=================================================");

    const Product = require('./models/product');
    const Price = require('./models/price');

    try {
        const { productUrl, targetPrice } = req.body;

        let product = await Product.findOne({ url: productUrl });
        let finalCurrentPrice = 0;
        let finalImageUrl = "";
        let finalTitle = "";
        let finalSpecs = {};
        let isNewProduct = false;

        // ⚡ THE 3-SECOND SECRET: CHECK DATABASE FIRST
        if (product) {
            console.log("⚡ FAST LOAD: Found in Database! Loading instantly...");

            if (targetPrice) {
                product.targetPrice = targetPrice;
                await product.save();
            }

            const latestPriceDoc = await Price.findOne({ productId: product._id }).sort({ _id: -1 });
            finalCurrentPrice = latestPriceDoc ? latestPriceDoc.price : 0;
            finalImageUrl = product.imageUrl;
            finalTitle = product.title;
        }
        // 🐢 NOT IN DB: SCRAPE LIVE (Takes 10s, but only happens once!)
        else {
            console.log("🐢 SLOW LOAD: New Product. Scraping live...");
            const scrapedData = await routeUrl(productUrl);

            if (!scrapedData || !scrapedData.success) {
                console.log("❌ SCRAPER FAILED");
                return res.json({ success: false, error: scrapedData ? scrapedData.error : "Failed to extract data." });
            }

            finalCurrentPrice = scrapedData.currentPrice;
            finalImageUrl = scrapedData.imageUrl;
            finalTitle = scrapedData.title;
            finalSpecs = scrapedData.specifications;
            isNewProduct = true;

            // Save new product to DB so it loads in 3 seconds next time!
            product = new Product({
                url: productUrl,
                platform: 'Store',
                title: finalTitle,
                imageUrl: finalImageUrl,
                targetPrice: targetPrice
            });
            await product.save();

            const newPrice = new Price({
                productId: product._id,
                price: finalCurrentPrice
            });
            await newPrice.save();
            console.log("✅ Saved to Database for future fast-loading!");
        }

        // 📊 GET HISTORY AND MATH
        const allPrices = await Price.find({ productId: product._id });
        const priceValues = allPrices.map(p => p.price);

        let highestPrice = finalCurrentPrice;
        let lowestPrice = finalCurrentPrice;
        let averagePrice = finalCurrentPrice;

        if (priceValues.length > 0) {
            highestPrice = Math.max(...priceValues);
            lowestPrice = Math.min(...priceValues);
            averagePrice = Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length);
        }

        // ⚖️ GET THE VERDICT
        const verdict = isNewProduct
            ? { text: "NEW PRODUCT - TRACKING STARTED", color: "gray" }
            : getDealVerdict(finalCurrentPrice, averagePrice);

        // 🛍️ GET SIMILAR PRODUCTS
        const otherProducts = await Product.find({ _id: { $ne: product._id } }).limit(10);
        const similarProducts = await Promise.all(otherProducts.map(async (p) => {
            const pPrice = await Price.findOne({ productId: p._id }).sort({ _id: -1 });
            return {
                name: p.title,
                price: pPrice ? pPrice.price : 0,
                store: p.platform,
                image: p.imageUrl,
                url: p.url
            };
        }));

        console.log("3. Sending data back to website...");
        res.json({
            success: true,
            currentPrice: finalCurrentPrice,
            imageUrl: finalImageUrl,
            title: finalTitle,
            specifications: finalSpecs,
            history: { highest: highestPrice, lowest: lowestPrice, average: averagePrice },
            similarProducts: similarProducts,
            verdict: verdict // <-- SENDING VERDICT TO FRONTEND
        });
        console.log("=================================================\n");

    } catch (err) {
        console.error("💥 CRITICAL SERVER ERROR:", err);
        res.status(500).json({ success: false, error: "Critical Server Error: " + err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// ==========================================
// ⏰ THE AUTOMATED ALARM CLOCK & POSTMAN ✉️
// ==========================================
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'lofiplaybook007@gmail.com',
        pass: 'vijsiwyilyxqnwdm'
    }
});

cron.schedule('0 8 * * *', async () => {
    console.log("\n⏰ ALARM RINGING! Waking up the scraper robot...");
    const Product = require('./models/product');
    const Price = require('./models/price');

    try {
        const trackedProducts = await Product.find({ targetPrice: { $exists: true, $ne: null } });
        console.log(`Found ${trackedProducts.length} items to check today.`);

        for (const item of trackedProducts) {
            console.log(`\n🔍 Checking: ${item.title}`);
            const scrapedData = await routeUrl(item.url);

            if (scrapedData && scrapedData.success) {
                const currentPrice = scrapedData.currentPrice;
                console.log(`   Current: ₹${currentPrice} | Target: ₹${item.targetPrice}`);

                const newPrice = new Price({ productId: item._id, price: currentPrice });
                await newPrice.save();

                if (currentPrice <= item.targetPrice) {
                    console.log(`   🎯 PRICE DROP DETECTED! Sending email...`);
                    const mailOptions = {
                        from: 'NeonMoney Alerts <lofiplaybook007@gmail.com>',
                        to: 'lofiplaybook007@gmail.com',
                        subject: `🚨 PRICE DROP: ${item.title.substring(0, 30)}...`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                                <h1 style="color: #10B981;">Good News! Your price dropped!</h1>
                                <img src="${item.imageUrl}" style="max-height: 200px; margin: 20px 0;">
                                <p style="font-size: 18px;"><strong>${item.title}</strong></p>
                                <p style="font-size: 24px; color: #EF4444;">It is now just <strong>₹${currentPrice}</strong>!</p>
                                <p>(Your target was ₹${item.targetPrice})</p>
                                <a href="${item.url}" style="background-color: #1F2937; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px;">Buy it Now</a>
                            </div>
                        `
                    };
                    await transporter.sendMail(mailOptions);
                    console.log("   ✉️ Email sent successfully!");
                } else {
                    console.log("   😴 Still too expensive. Going back to sleep.");
                }
            } else {
                console.log("   ❌ Robot failed to scrape this item today.");
            }
        }
        console.log("\n✅ Daily price check complete. See you tomorrow!");

    } catch (error) {
        console.error("💥 Cron Job Error:", error);
    }
});