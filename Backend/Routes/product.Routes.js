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
  cancelOrder,
  getAllCategory,
  getOrderDetails,
  changeOrderStatus,
  bulkproducts,
  getProductByCategoryId,
  getProductByCategoryName,

  datatable,
  getCart,
} = require("../Controllers/product.Controller");

const upload = require("../Middlewares/multer");
const { route } = require("./oauth.Routes");

router.post("/add", authenticateToken, upload.single("image"), setProduct);

router.get("/search", searchProductsByName);
router.get("/details/:productId", getProduct);
router.delete("/:productId", authenticateToken, deleteProduct);
router.patch(
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
router.get("/category-list", getAllCategory);
router.get("/category/:categoryId", getCategoryProducts);

router.post("/add-item/:productId", authenticateToken, addItemsToTheCart);

router.delete("/remove-item/:productId", authenticateToken, removeItemFromCart);

router.patch("/update-item/:productId", authenticateToken, updateItemInCart);

router.post("/add-favourite-to-cart", authenticateToken, addFavouritesToCart);

router.post("/create-order", authenticateToken, createOrder);

router.get("/order/:orderId", authenticateToken, getOrderDetails);
router.post("/get-orders", authenticateToken, getOrders);

router.put("/cancel-order", authenticateToken, cancelOrder);

router.patch("/order/:orderId/status", authenticateToken, changeOrderStatus);

router.post("/bulk", authenticateToken, bulkproducts);
router.get("/categories", authenticateToken, getAllCategory);
router.get(
  "/categories/:categoryId/products",
  authenticateToken,
  getProductByCategoryId
);
router.get(
  "/categories/name/:categoryName/products",
  authenticateToken,
  getProductByCategoryName
);

router.post(
  "/categories/:categoryId/products/datatable",
  authenticateToken,
  datatable
);

router.get("/cart", authenticateToken, getCart);
module.exports = router;
