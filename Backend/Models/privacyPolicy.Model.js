const mongoose = require("mongoose");

const privacyPolicySchema = new mongoose.Schema(
  {
    html: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const PrivacyPolicy = mongoose.model("PrivacyPolicy", privacyPolicySchema);
module.exports = PrivacyPolicy;
