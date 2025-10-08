const express = require("express");

const router = express.Router();
const authenticateToken = require("../Middlewares/authenticateToken");
const {
  createPayment,
  paymentCancel,
  executePayment,
} = require("../Controllers/payment.Controller");

router.post("/create-payment", authenticateToken, createPayment);
router.get("/payment-success", executePayment);
router.get("/payment-cancel", paymentCancel);

module.exports = router;
