const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json("You Can't Access this Url");
    }
    next();
  };
};

module.exports = authorizeRoles;
