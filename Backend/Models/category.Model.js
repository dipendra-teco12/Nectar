const mongoose = require("mongoose");
const Product = require("./product.Model");

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  categoryProduct: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  image: {
    type: String,
    default: function () {
      // `this` refers to the document being created
      switch (this.category) {
        case "Cooking Oil":
          return "https://res.cloudinary.com/dfciwmday/image/upload/v1758781032/Nectar/Product/oil_i3xwda.jpg";
        case "Beverages":
          return "https://res.cloudinary.com/dfciwmday/image/upload/v1758781030/Nectar/Product/beverages_uxaffi.jpg";
        case "Meat & Fish":
          return "https://res.cloudinary.com/dfciwmday/image/upload/v1758781031/Nectar/Product/meat_fish_qdetyf.jpg";
        case "Bakery & Snacks":
          return "https://res.cloudinary.com/dfciwmday/image/upload/v1758781031/Nectar/Product/bakery_snacks_n7yky3.jpg";
        case "Dairy & Eggs":
          return "https://res.cloudinary.com/dfciwmday/image/upload/v1758781030/Nectar/Product/dairy_egs_cdf4uv.jpg";
        default:
          return "https://res.cloudinary.com/dfciwmday/image/upload/v1758780780/Nectar/Product/gc_o0hs5q.jpg";
      }
    },
  },
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;

