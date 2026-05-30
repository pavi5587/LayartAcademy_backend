const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    course: String,
    amount: Number,

    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,

    paymentStatus: {
      type: String,
      default: "Success",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Payment", paymentSchema);
