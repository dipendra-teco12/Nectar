require("dotenv").config({ quiet: true });
require("./Config/oauth");

const express = require("express");
const app = express();
const redis = require("redis");
const connectDb = require("./Config/db");
const path = require("path");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const cors = require("cors");
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
// const corsOptions = {
//   origin: "http://localhost:3000",
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

app.use(
  cors({
    origin: [
      "https://e-commerce-next-p8b3s9yqi-krishnas-projects-3a1ed039.vercel.app", // production frontend URL
      "http://localhost:3000", // your local frontend URL during development
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// app.use(cors(corsOptions));
// const client = redis.createClient({
//   url: "redis://localhost:6379", // Redis server URL
// });

// // Connect to Redis
// client
//   .connect()
//   .then(() => console.log("Connected to Redis"))
//   .catch((err) => console.error("Redis connection error:", err));

app.get("/", (req, res) => {
  let token = req.cookies.accessToken;
  if (token) {
    return res.redirect("/admin/dashboard");
  }
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

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Path not found" });
});

app.listen(port, () => {
  connectDb();
  console.log(`Server is listening on port ${port}`);
});
