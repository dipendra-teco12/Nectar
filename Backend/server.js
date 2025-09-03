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

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "yourSecretKeyHere",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 5, 
    },
  })
);

app.set("view engine", "ejs");

const productRoutes = require("./Routes/product.Routes");
const adminRoutes = require("./Routes/admin.Routes");
app.get("/", (req, res) => {
  res.render("authViews/login", {
    layout: false, // Don't use the admin layout for login page
  });
});

app.use("/auth/google", oauthRoute);
app.use("/api/auth", authRoutes);

app.use("/admin", adminRoutes);
app.use("/api/product", productRoutes);
app.use("/api/pay", paymentRoutes);

app.use((error, req, res, next) => {
  res.status(404).json({ error: "Path not found" });
});

app.listen(port, () => {
  connectDb();
  console.log(`Server is listening on port ${port}`);
});
