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
    default:
      "https://res.cloudinary.com/dfciwmday/image/upload/v1756786073/Nectar/Product/1756786071012-Screenshot_10.png.png",
  },
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
