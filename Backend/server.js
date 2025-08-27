require("dotenv").config({ quiet: true });
const express = require("express");
const connectDb = require("./Config/db");
const path = require("path");
const passport = require("passport");
const oauthRoute = require("./Routes/oauth.Routes");
const authenticateToken = require("./Middlewares/authenticateToken");
const authRoutes = require("./Routes/auth.Routes");
const cookieParser = require("cookie-parser");
require("./Config/oauth");
const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("authViews/login");
});
const productRoutes = require("./Routes/product.Routes");
app.use("/auth/google", oauthRoute);
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);

app.use("/admin/dashboard", authenticateToken, (req, res) => {
  res.render("index");
});

app.listen(port, () => {
  connectDb();
  console.log(`Serve is listening on port ${port}`);
});
