const express = require("express");

const router = express.Router();

const authentication = require("../Middlewares/authenticateToken");
const {
  createPayment,
  paymentSuccess,
  paymentCancel,
} = require("../Controllers/payment.Controller");

router.post("/create-payment", createPayment);
router.get("/payment-success", paymentSuccess);
router.get("/payment-cancel", paymentCancel);

module.exports = router;
