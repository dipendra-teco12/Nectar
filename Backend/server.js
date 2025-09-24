require("dotenv").config({ quiet: true });
require("./Config/oauth");

const express = require("express");
const app = express();

const connectDb = require("./Config/db");
const path = require("path");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");

const oauthRoute = require("./Routes/oauth.Routes");
const userRoutes = require("./Routes/user.Routes");
const authRoutes = require("./Routes/auth.Routes");
const paymentRoutes = require("./Routes/payment.Routes");
const productRoutes = require("./Routes/product.Routes");
const adminRoutes = require("./Routes/admin.Routes");

const port = process.env.PORT || 5000;

app.use(passport.initialize());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());

app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("layout", "layouts/admin");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

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

app.get("/", (req, res) => {
  res.render("authViews/login", {
    layout: false,
  });
});

app.get("/register", (req, res) => {
  res.render("authViews/signup", {
    layout: false,
  });
});

app.use("/admin", adminRoutes);
app.use("/auth/google", oauthRoute);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/pay", paymentRoutes);

app.use((error, req, res, next) => {
  res.status(404).json({ error: "Path not found" });
});

app.listen(port, () => {
  connectDb();
  console.log(`Server is listening on port ${port}`);
});
