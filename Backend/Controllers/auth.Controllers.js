const User = require("../Models/user.Model");
const bcrypt = require("bcrypt");
const twilio = require("twilio");
const OTP = require("../Models/otp.Model");
require("dotenv").config({ quiet: true });
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../Utilities/jwt");

const RefreshToken = require("../Models/refreshToken.Model");
const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All Fields Required" });
    }

    const userExits = await User.findOne({ email });

    if (userExits) {
      return res.status(409).json({ message: "User Already Exits" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const data = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    res.status(201).json({ message: "User Successfully Registered", data });
  } catch (error) {
    console.error("Error while Registering User", error);
    res.status(500).json({ message: "Internal Server Error" });
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
    res.status(200).json({ message: "User Successfully Logged in", data });
  } catch (error) {
    console.error("Error While logging", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authTokin = process.env.TWILIO_AUTH_TOKIN;
const client = new twilio(accountSid, authTokin);

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

  res.status(200).json({  message: "OTP sent" });
};

const verifyOtp = async (req, res) => {
  const { phone, otp: userOtp } = req.body;
  const record = await OTP.findOne({ phone, used: false }).sort({
    expiresAt: -1,
  });

  if (!record)
    return res
      .status(400)
      .json({ message: "OTP not found or used" });

  if (record.attempts >= 5) {
    return res
      .status(429)
      .json({  message: "Too many attempts" });
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

module.exports = {
  signUp,
  login,
  sentOtp,
  verifyOtp,
};
