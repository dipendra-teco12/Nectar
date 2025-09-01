const express = require("express");
const authenticateToken = require("../Middlewares/authenticateToken");

const router = express.Router();

router.get("/dashboard", authenticateToken, (req, res) => {
  res.render("pages/dashboard", {
    title: "Dashboard - Admin Panel",
    pageTitle: "Dashboard",
    breadcrumb: '<li class="breadcrumb-item active">Dashboard</li>',
  });
});

router.get("/forgot-password", (req, res) => {
  res.render("authViews/forgotPassword", { layout: false });
});

router.get("/profile", authenticateToken, (req, res) => {
  res.render("pages/profile", {
    title: "Profile - Admin Panel",
    pageTitle: "Update Profile Details",
    breadcrumb:
      '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Profile</li>',
    user: req.user,
  });
});

router.get("/products/add", authenticateToken, (req, res) => {
  res.render("pages/addProduct", {
    title: "Profile - Admin Panel",
    pageTitle: "Add Product Details",
    breadcrumb:
      '<li class="breadcrumb-item"><a href="/admin/dashboard">Home</a></li><li class="breadcrumb-item active">Profile</li>',
    user: req.user, 
  });
});

module.exports = router;
