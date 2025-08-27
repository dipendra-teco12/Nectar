const mongoose = require("mongoose");
const Product = require("./product.Model");

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  categoryProduct: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
