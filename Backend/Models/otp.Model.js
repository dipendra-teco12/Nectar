const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  attempts: {
    type: Number,
    default: 0,
  },
  used: {
    type: Boolean,
    default: false,
  },
});

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
