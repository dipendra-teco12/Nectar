const express = require("express");
const {
  signUp,
  login,
  sentOtp,
  verifyOtp,
  verifyOtpForResetPass,
  forgetPassword,
  resetPassword,
  logout,
  updateProfile,
} = require("../Controllers/auth.Controllers");
const authenticateToken = require("../Middlewares/authenticateToken");
const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/logout", logout);

router.post("/send-otp", sentOtp);
router.post("/verify-otp", verifyOtp);

router.post("/forgetpassword", forgetPassword);
router.post("/verifyotp", verifyOtpForResetPass);
router.post("/resetPassword", authenticateToken, resetPassword);
router.patch("/update-profile", authenticateToken, updateProfile);

module.exports = router;
