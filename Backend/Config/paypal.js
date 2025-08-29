const paypal = require("paypal-rest-sdk");
require("dotenv").config({ quiet: true });

paypal.configure({
  mode: "sandbox", // 'sandbox' for testing, use 'live' when production-ready
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

module.exports = paypal;
