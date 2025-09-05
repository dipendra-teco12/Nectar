const express = require("express");

const authorizeRoles = require("../Middlewares/authorizeRoles");
const {
  getUser,
  getUserList,

  changeAccountStatus,
  deleteUser,
} = require("../Controllers/user.Controller");
const authenticateToken = require("../Middlewares/authenticateToken");
const router = express.Router();
authenticateToken;

router.get("/details/:email", getUser);
router.get(
  "/userlist",
  authenticateToken,
  authorizeRoles("admin"),
  getUserList
);

// Update your routes file
router.patch(
  "/account-status/:email",
  authenticateToken,
  authorizeRoles("admin"),
  changeAccountStatus
);
router.delete(
  "/delete-user",
  authenticateToken,
  authorizeRoles("admin"),
  deleteUser
);

module.exports = router;
