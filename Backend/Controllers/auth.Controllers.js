const bcrypt = require("bcrypt");
const twilio = require("twilio");
const User = require("../Models/user.Model");
const OTP = require("../Models/otp.Model");
const RefreshToken = require("../Models/refreshToken.Model");
require("dotenv").config({ quiet: true });
const nodemailer = require("nodemailer");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authTokin = process.env.TWILIO_AUTH_TOKIN;
const client = new twilio(accountSid, authTokin);
const jwt = require("jsonwebtoken");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../Utilities/jwt");

const signUp = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All Fields Required" });
    }

    const userExits = await User.findOne({ email });

    if (userExits) {
      return res.status(409).json({ message: "User Already Exits" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    const data = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    res
      .status(201)
      .json({ success: true, message: "User Successfully Registered", data });
  } catch (error) {
    console.error("Error while Registering User", error);
    res.status(500).json({success:false, message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields Required" });
    }

    const userExits = await User.findOne({ email });

    if (!userExits) {
      return res.status(404).json({ message: "User Not Found" });
    }
    const isMatch = await bcrypt.compare(password, userExits.password);

    if (!isMatch) {
      return res.status(403).json({ message: "Invalid Credentials" });
    }

    const accessToken = generateAccessToken(userExits);
    const refreshToken = generateRefreshToken(userExits);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await RefreshToken.deleteOne({ userId: userExits._id });
    await RefreshToken.create({
      token: refreshToken,
      userId: userExits._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    const data = {
      _id: userExits._id,
      name: userExits.name,
      email: userExits.email,
      role: userExits.role,
      accessToken,
      refreshToken,
    };
    userExits.updatedAt = new Date();
    await userExits.save();
    res
      .status(200)
      .json({ success: true, message: "User Successfully Logged in", data });
  } catch (error) {
    console.error("Error While logging", error);
    res.status(500).json({success:false, message: "Internal Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Refresh token not found in cookies" });
    }

    await RefreshToken.deleteOne({ token });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });

    return res.redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({success:false, message: "Internal Server Error" });
  }
};

const crypto = require("crypto");

const sentOtp = async (req, res) => {
  const { phone } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();
  const hash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await OTP.create({ phone, hash, expiresAt });

  await client.messages.create({
    body: `Your OTP is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  res.status(200).json({ message: "OTP sent" });
};

const verifyOtp = async (req, res) => {
  const { phone, otp: userOtp } = req.body;
  const record = await OTP.findOne({ phone, used: false }).sort({
    expiresAt: -1,
  });

  if (!record)
    return res.status(400).json({ message: "OTP not found or used" });

  if (record.attempts >= 5) {
    return res.status(429).json({ message: "Too many attempts" });
  }

  record.attempts++;

  const valid = await bcrypt.compare(userOtp, record.hash);
  if (!valid) {
    await record.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  record.used = true;
  await record.save();
  res.status(200).json({ message: "OTP verified successfully" });
};
const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    if (
      user.lastOTPSentAt &&
      Date.now() - user.lastOTPSentAt.getTime() < 5 * 1000 // wait for 5sec
    ) {
      return res
        .status(429)
        .json({ message: "Please wait before requesting another OTP" });
    }
    if (user.resetOtpExpiry && Date.now() > user.resetOtpExpiry) {
      user.otpAttemptCount = 0;
    }
    if (user.otpAttemptCount >= 3) {
      return res
        .status(429)
        .json({ message: "Too many OTP requests. Try again later." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP for password reset",
      html: `
        <p>if you don't want to reset password please ignore !</p>
        <p>Here is the otp for resetting password :- <h3>${otp}</h3></p>
      `,
    });

    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000;
    user.lastOTPSentAt = new Date();
    user.otpAttemptCount += 1;
    await user.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Reset password otp has been sent to your email",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({success:false, message: "Internal Server Error" });
  }
};

const verifyOtpForResetPass = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const user = await User.findOne({
      email,
      resetOtp: otp,
      resetOtpExpiry: { $gt: Date.now() },
    });
    if (!user)
      return res.status(410).json({ message: "Invalid or expired OTP" });

    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    //  user.otpAttemptCount = undefined;
    // user.lastOTPSentAt = undefined;

    await user.save();

    const tempToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "5m",
    });

    res.cookie("accessToken", tempToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 5 * 60 * 1000,
    });

    res.json({ success: true, message: "OTP verified", tempToken });
  } catch (error) {
    console.error("Error in verifying:", error);
     res.status(500).json({success:false, message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 10);

    user.otpAttemptCount = undefined;
    user.lastOTPSentAt = undefined;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
     res.status(500).json({success:false, message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updateFields = {};
    const { fullName, email, password } = req.body;

    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;
    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updated = await User.findByIdAndUpdate(
      { _id: req.user._id },
      { $set: updateFields },
      { new: true }
    );

    const accessToken = generateAccessToken(updated);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res
      .status(200)
      .json({
        success: true,
        message: "Profile updated",
        user: { fullName: updated.fullName, email: updated.email },
      });
  } catch (err) {
    console.error("Error while updating user", err);
    res.status(500).json({success:false, message: "Internal Server Error" });
  }
};
module.exports = {
  signUp,
  login,
  sentOtp,
  verifyOtp,
  forgetPassword,
  verifyOtpForResetPass,
  resetPassword,
  logout,
  updateProfile,
};
