const express = require("express");
const router = express.Router();
const authenticateToken = require("../Middlewares/authenticateToken");

const {
  setProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  setFavouriteProduct,
  removeFromFavouriteProduct,
  getCategoryProducts,
  searchProductsByName,
  addItemsToTheCart,
  removeItemFromCart,
  updateItemInCart,
  getFavouriteProducts,
  addFavouritesToCart,
  createOrder,
  getOrders,
} = require("../Controllers/product.Controller");

const upload = require("../Middlewares/multer");

router.post("/upload", authenticateToken, upload.single("image"), setProduct);

router.get("/search", authenticateToken, searchProductsByName);
router.get("/details/:productId", authenticateToken, getProduct);
router.delete("/:productId", authenticateToken, deleteProduct);
router.put(
  "/update-product/:productId",
  authenticateToken,
  upload.single("image"),
  updateProduct
);

router.post(
  "/add-favourite/:productId",
  authenticateToken,
  setFavouriteProduct
);
router.delete(
  "/remove-favourite/:productId",
  authenticateToken,
  removeFromFavouriteProduct
);

router.get("/favourite-product", authenticateToken, getFavouriteProducts);
router.get("/category/:categoryId", authenticateToken, getCategoryProducts);

router.post("/add-item/:productId", authenticateToken, addItemsToTheCart);

router.post("/remove-item/:productId", authenticateToken, removeItemFromCart);

router.put("/update-item", authenticateToken, updateItemInCart);

router.post("/add-favourite-to-cart", authenticateToken, addFavouritesToCart);

router.post("/create-order", authenticateToken, createOrder);

router.post("/get-orders", authenticateToken, getOrders);

module.exports = router;
