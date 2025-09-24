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
      "https://res.cloudinary.com/dfciwmday/image/upload/v1757315555/Nectar/Product/gc_nm1lsv.jpg",
  },
});

const Category = mongoose.model("Category", categorySchema); 
module.exports = Category;


// const mongoose = require("mongoose");
// const Product = require("./product.Model");

// const categorySchema = new mongoose.Schema({
//   category: {
//     type: String,
//     required: true,
//   },
//   categoryProduct: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//     },
//   ],
//   image: {
//     type: String,
//     default: function() {
//       // `this` refers to the document being created
//       switch (this.category) {
//         case "eggs":
//           return "https://.../image_for_eggs.jpg";
//         case "fruits":
//           return "https://.../image_for_fruits.jpg";
//         case "oils":
//           return "https://.../image_for_oils.jpg";
//         // add cases for all your categories
//         default:
//           return "https://res.cloudinary.com/dfciwmday/image/upload/v1757315555/Nectar/Product/gc_nm1lsv.jpg";
//       }
//     }
//   }
// });

// const Category = mongoose.model("Category", categorySchema);
// module.exports = Category;
