const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  url: String,
  platform: String,
  title: String,
  imageUrl: String,
  targetPrice: Number // <--- IF THIS IS MISSING, THE ROBOT FINDS 0 ITEMS!
});

module.exports = mongoose.model('Product', productSchema);