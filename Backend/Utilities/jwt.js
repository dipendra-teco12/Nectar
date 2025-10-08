const jwt = require("jsonwebtoken");
require("dotenv").config({ quiet: true });
const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

const generateAccessToken = (user) => {
  try {
    return jwt.sign(
      {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );
  } catch (error) {
    console.error("Error while Generating Access Token", error);
    throw error;
  }
};

const generateRefreshToken = (user) => {
  try {
    return jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      REFRESH_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );
  } catch (error) {
    console.error("Error while Generating Refresh Token", error);
    throw error;
  }
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    console.error("Error While Verifying Access Token", error);
    throw error; // propagate
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET_KEY);
  } catch (error) {
    console.error("Error While Verifying Refresh Token", error);
    throw error;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
