const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      validate: {
        validator: function (v) {
          if (this.googleId) return true;
          return v && v.length >= 8;
        },
        message: "Password is required for local signups",
      },
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    resetOtp: String,

    resetOtpExpiry: Date,

    otpAttemptCount: {
      type: Number,
      default: 0,
    },
    lastOTPSentAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model("User", userSchema);

module.exports = User;
