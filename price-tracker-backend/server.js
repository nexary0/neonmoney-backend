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

// The main endpoint your frontend calls
// The main endpoint your frontend calls
// The main endpoint your frontend calls
app.post('/api/track-price', async (req, res) => {
    // MAKE THE TERMINAL LOUD AND CLEAR!
    console.log("\n=================================================");
    console.log(`🚀 NEW REQUEST RECEIVED`);
    console.log(`🔗 Link: ${req.body.productUrl}`);
    console.log("=================================================");

    const Product = require('./models/product');
    const Price = require('./models/price');

    try {
        const { productUrl } = req.body;

        console.log("1. Sending URL to scraper controller...");
        const scrapedData = await routeUrl(productUrl);

        // 🛑 SAFETY NET: Check for Scraper Failure
        if (!scrapedData || !scrapedData.success) {
            console.log("❌ SCRAPER FAILED:", scrapedData ? scrapedData.error : "Unknown error");
            return res.json({ success: false, error: scrapedData ? scrapedData.error : "Failed to extract data." });
        }

        console.log("✅ Scraper succeeded! Found:", scrapedData.title);
        console.log("2. Saving to database...");

        // --- DATABASE CODE ---
        let product = await Product.findOne({ url: productUrl });
        const { targetPrice } = req.body; // <-- Get the target price from the frontend!

        // If brand new product, create it
        if (!product) {
            product = new Product({
                url: productUrl,
                platform: 'Store',
                title: scrapedData.title,
                imageUrl: scrapedData.imageUrl,
                targetPrice: targetPrice // <-- SAVE IT HERE!
            });
            await product.save();
            console.log('   -> New product & alert created!');
        } else if (targetPrice) {
            // If the product exists but the user just added a new alert price, update it!
            product.targetPrice = targetPrice;
            await product.save();
            console.log('   -> Target price updated!');
        }
        const newPrice = new Price({
            productId: product._id,
            price: scrapedData.currentPrice
        });
        await newPrice.save();
        console.log('   -> Price logged successfully!');

        const allPrices = await Price.find({ productId: product._id });
        const priceValues = allPrices.map(p => p.price);
        const highestPrice = Math.max(...priceValues);
        const lowestPrice = Math.min(...priceValues);
        const averagePrice = Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length);

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
            currentPrice: scrapedData.currentPrice,
            imageUrl: scrapedData.imageUrl,
            title: scrapedData.title,
            specifications: scrapedData.specifications,
            history: { highest: highestPrice, lowest: lowestPrice, average: averagePrice },
            similarProducts: similarProducts
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

// 1. Setup the Postman 
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'lofiplaybook007@gmail.com', // <-- Put your real Gmail here
        pass: 'vijsiwyilyxqnwdm'      // <-- Your App Password (NO SPACES!)
    }
});

// 2. The Alarm Clock: "0 8 * * *" means "Run at 8:00 AM every single day"
// (Tip: Change it to "*/2 * * * *" to test it every 2 minutes while building!)
cron.schedule('*/2 * * * *', async () => {
    console.log("\n⏰ ALARM RINGING! Waking up the scraper robot...");
    const Product = require('./models/product');
    const Price = require('./models/price');

    try {
        // Find all products that have a target price set
        const trackedProducts = await Product.find({ targetPrice: { $exists: true, $ne: null } });
        console.log(`Found ${trackedProducts.length} items to check today.`);

        // Loop through them one by one and check the price
        for (const item of trackedProducts) {
            console.log(`\n🔍 Checking: ${item.title}`);

            // Send the robot to the website!
            const scrapedData = await routeUrl(item.url);

            if (scrapedData && scrapedData.success) {
                const currentPrice = scrapedData.currentPrice;
                console.log(`   Current: ₹${currentPrice} | Target: ₹${item.targetPrice}`);

                // Log the new price to the database
                const newPrice = new Price({ productId: item._id, price: currentPrice });
                await newPrice.save();

                // 🚨 THE BRAIN: Did the price drop below our target?!
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

                    // Send the email!
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