const express = require("express");
const {
  signUp,
  login,
  sentOtp,
  verifyOtp,
} = require("../Controllers/auth.Controllers");
const authenticateToken = require("../Middlewares/authenticateToken");
const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);

router.post("/send-otp", sentOtp);
router.post("/verify-otp", verifyOtp);

router.get("/data", authenticateToken, (req, res) => {
  console.log("hii therer");
  res.send("asdfkjhdsfkj");
});

module.exports = router;
