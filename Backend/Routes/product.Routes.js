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
} = require("../Controllers/product.Controller");

const upload = require("../Middlewares/multer");

router.post("/upload", authenticateToken, upload.single("image"), setProduct);

router.get("/search", authenticateToken, searchProductsByName);
router.get("/:productId", authenticateToken, getProduct);
router.delete("/:productId", authenticateToken, deleteProduct);
router.put(
  "/:productId",
  authenticateToken,
  upload.single("image"),
  updateProduct
);

router.post("/favourite/:productId", authenticateToken, setFavouriteProduct);
router.delete("/favourite/:id", authenticateToken, removeFromFavouriteProduct);

router.get("/category/:categoryId", authenticateToken, getCategoryProducts);

module.exports = router;
