const jwt = require("jsonwebtoken");
require("dotenv").config({ quiet: true });
const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

const generateAccessToken = (user) => {
  try {
    const token = jwt.sign(
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

    return token;
  } catch (error) {
    console.error("Error while Generating Access Token", error);
  }
};

const generateRefreshToken = (user) => {
  try {
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      REFRESH_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    return token;
  } catch (error) {
    console.error("Error while Generating Refresh Token", error);
  }
};

const verifyAccessToken = (token) => {
  try {
    const decodedData = jwt.verify(token, SECRET_KEY);
    return decodedData;
  } catch (error) {
    console.error("Error While Verifying Access Token", error);
  }
};

const verifyRefreshToken = (token) => {
  try {
    const decodedData = jwt.verify(token, REFRESH_SECRET_KEY);
    return decodedData;
  } catch (error) {
    console.error("Error While Verifying Refresh Token", error);
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
