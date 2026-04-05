const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    price: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Price', priceSchema);