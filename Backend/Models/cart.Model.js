const mongoose = require("mongoose");
const Product = require("./product.Model");

const ItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
    },
    price: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cartItems: [ItemSchema],
    subTotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ItemSchema.pre('save', function(next) {
//   this.total = this.quantity * this.price;
//   next();
// });

// CartSchema.pre('save', function(next) {
//   this.subTotal = this.cartItems.reduce((acc, item) => acc + item.total, 0);
//   next();
// });

const Cart = mongoose.model("Cart", CartSchema);

module.exports = Cart;
