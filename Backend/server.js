require("dotenv").config({ quiet: true });
const express = require("express");
const connectDb = require("./Config/db");
const path = require("path");
const passport = require("passport");
const oauthRoute = require("./Routes/oauth.Routes");

const authRoutes = require("./Routes/auth.Routes");
const paymentRoutes = require("./Routes/payment.Routes");
const cookieParser = require("cookie-parser");
require("./Config/oauth");
const app = express();
const session = require("express-session");
const port = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

const expressLayouts = require("express-ejs-layouts");
// Layout setup
app.use(expressLayouts);
app.set("layout", "layouts/admin");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// app.get("/", (req, res) => {
//   res.redirect("/admin/dashboard");
// });

app.get("/", (req, res) => {
  res.render("authViews/login", {
    layout: false, // Don't use the admin layout for login page
  });
});

app.get("/admin/dashboard", (req, res) => {
  res.render("pages/dashboard", {
    title: "Dashboard - Admin Panel",
    pageTitle: "Dashboard",
    breadcrumb: '<li class="breadcrumb-item active">Dashboard</li>',
  });
});

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "yourSecretKeyHere",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true if using HTTPS in production
      maxAge: 1000 * 60 * 15, // session expires after 15 mins
    },
  })
);

app.set("view engine", "ejs");

const productRoutes = require("./Routes/product.Routes");
app.use("/auth/google", oauthRoute);
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/pay", paymentRoutes);

app.listen(port, () => {
  connectDb();
  console.log(`Server is listening on port ${port}`);
});
