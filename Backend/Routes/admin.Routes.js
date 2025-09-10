const express = require("express");
const authenticateToken = require("../Middlewares/authenticateToken");
const authorizeRoles = require("../Middlewares/authorizeRoles");
const {
  getUserList,
  getAllProduct,
  getOrders,
  privacy_policy,
  save_privacy,
  dashboardCount,
} = require("../Controllers/admin.Controller");

const router = express.Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("pages/dashboard", {
      title: "Dashboard - Admin Panel",
      pageTitle: "Dashboard",
      breadcrumb: '<li class="breadcrumb-item active">Dashboard</li>',
    });
  }
);

router.get("/forgot-password", (req, res) => {
  res.render("authViews/forgotPassword", { layout: false });
});

router.get(
  "/profile",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("pages/profile", {
      title: "Profile - Admin Panel",
      pageTitle: "Update Profile Details",
      breadcrumb:
        '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Profile</li>',
      user: req.user,
    });
  }
);

router.get(
  "/products/add",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("pages/addProduct", {
      title: "Profile - Admin Panel",
      pageTitle: "Add Product Details",
      breadcrumb:
        '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Product</li>',
      user: req.user,
    });
  }
);

router.get(
  "/products/edit/:productId",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("pages/updateProduct", {
      title: "Update Product",
      pageTitle: "Update Product Details",
      breadcrumb:
        '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Product</li>',
      user: req.user,
    });
  }
);

router.get("/users", authenticateToken, authorizeRoles("admin"), (req, res) => {
  res.render("pages/users", {
    title: "Nectar Users",
    pageTitle: "User Details",
    breadcrumb:
      '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Users</li>',
    user: req.user,
  });
});

router.get(
  "/products",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("pages/product", {
      title: "Product",
      pageTitle: "Product Management",
      breadcrumb:
        '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Products</li>',
      user: req.user,
    });
  }
);

router.get(
  "/categories",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("pages/categories", {
      title: "Product Catagories",
      pageTitle: "Product Categories",
      breadcrumb:
        '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">categories</li>',
      user: req.user,
    });
  }
);

router.get(
  "/orders",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("pages/orders", {
      title: "Orders",
      pageTitle: "order management",
      breadcrumb:
        '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Orders</li>',
      user: req.user,
    });
  }
);

router.get(
  "/text-editor",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.render("pages/text-editor", {
      title: "Privacy Policy",
      pageTitle: "text-editor",
      breadcrumb:
        '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Orders</li>',
      user: req.user,
    });
  }
);

router.get("/privacy-policy", privacy_policy);
router.post("/save-privacy", save_privacy);

router.get("/productlist", authenticateToken, getAllProduct);

router.get("/orders/list", authenticateToken, getOrders);

router.get("/dashboard/stats", authenticateToken, dashboardCount);

module.exports = router;
