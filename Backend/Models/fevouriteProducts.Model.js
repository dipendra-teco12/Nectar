const mongoose = require("mongoose");
const Product = require("./product.Model");
const favouriteProductSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const FavouriteProduct = mongoose.model(
  "FavouriteProduct",
  favouriteProductSchema
);

module.exports = FavouriteProduct;
