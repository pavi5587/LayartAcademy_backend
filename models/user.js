const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter Name"],
  },
  email: {
    type: String,
    required: [true, "Please enter email"],
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  },
  mobileNumber: {
    type: String,
    required: function () {
      return !this.isGoogleUser;
    },
  },
  password: {
    type: String,
    required: function () {
      return !this.isGoogleUser;
    },
  },
  course: {
    type: String,
  },
  professional: {
    type: String,
  },
  city: {
    type: String,
  },
  googleId: {
    type: String,
  },
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
});

let schema = mongoose.model("User", userSchema);

module.exports = schema;
