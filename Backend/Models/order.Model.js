const mongoose = require("mongoose");
const Product = require("./product.Model");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  Products: [
    {
      ProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
      },
      price: {
        type: Number,
        required: true,
        min: [0, "Price must be a positive number"],
      },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ["Pending", "Delivered", "Processing", "Cancelled", "Shipped"],
    default: "Pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  note: {
    type: String,
  },
});

orderSchema.index({ location: "2dsphere" });

orderSchema.pre("save", function (next) {
  this.Products.forEach((item) => {
    item.total = item.quantity * item.price;
  });

  // Calculate totalItems and subtotal
  this.subtotal = this.Products.reduce((acc, item) => acc + item.total, 0);
  this.totalItems = this.Products.reduce((acc, item) => acc + item.quantity, 0);

  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
