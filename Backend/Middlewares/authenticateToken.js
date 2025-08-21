const { verifyAccessToken } = require("../Utilities/jwt");

const authenticateToken = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;

    res.locals.user = decoded;

    next();
  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticateToken;
