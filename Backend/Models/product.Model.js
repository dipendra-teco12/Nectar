const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  imagePublicId: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
  },
  stock: {
    type: Number,
  },
  description: {
    type: String,
  },
  brand: {
    type: String,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
