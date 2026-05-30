const express = require("express");
const Stripe = require("stripe");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
const XLSX = require("xlsx");
const path = require("path");
const Razorpay = require("razorpay");
const userRouter = require("./routes/userRoutes");
const videoRoutes = require("./routes/videoRoutes");
const courseRoutes = require("./routes/courseRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const contactRoutes = require("./routes/contactRoutes");
const studentRoutes = require("./routes/studentRoutes");
const historyRoutes = require("./routes/watchHistoryRoutes");
const transporter = require("./config/mailer");
const Payment = require("./models/payment");

require("./db");
require("dotenv").config();

const stripe = new Stripe(
  "sk_test_51TVpLJLxounSeQ56tm30fgr2hXqsHfgtdLSEeCFIYmmVENLLvueaSc9GtDKoSXKOGPJRLT42T746F1p6zxac2lxz00AmsMYpPk",
);
const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

app.use("/api", userRouter);
app.use("/api/videos", videoRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/watch-history", historyRoutes);

const crypto = require("crypto");
const razorpayKeyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
const razorpayKeySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

if (!razorpayKeyId || !razorpayKeySecret) {
  console.error(
    "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
  );
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

app.get("/api/razorpay-key", (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return res.status(500).json({
      success: false,
      message: "Razorpay key id is not configured.",
    });
  }

  res.json({
    key_id: keyId,
  });
});

app.post("/api/create-order", async (req, res) => {
  const {
    amount: rawAmount,
    currency = "INR",
    receipt = `receipt_${Date.now()}`,
  } = req.body;
  console.log("req.body", req.body);
  const amount = typeof rawAmount === "string" ? Number(rawAmount) : rawAmount;

  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return res.status(400).json({
      success: false,
      message: "Amount is required and must be a number in paise.",
    });
  }

  if (amount < 100) {
    return res.status(400).json({
      success: false,
      message: "Minimum payment amount is 100 paise.",
    });
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: 1,
    });
    console.log("order33", order);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    const statusCode = error.statusCode === 401 ? 401 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to create Razorpay order.",
    });
  }
});

// app.post("/api/verify-payment", async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//       req.body;
//     console.log("req.body1", req.body);

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "razorpay_order_id, razorpay_payment_id and razorpay_signature are required.",
//       });
//     }

//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", razorpayKeySecret)
//       .update(body.toString())
//       .digest("hex");

//     if (expectedSignature === razorpay_signature) {
//       return res.json({
//         success: true,
//         paymentStatus: "Success",
//       });
//     }

//     res.status(400).json({
//       success: false,
//       paymentStatus: "Failed",
//       message: "Signature verification failed.",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message || "Unable to verify payment signature.",
//     });
//   }
// });

app.post("/api/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      name,
      course,
      amount,
    } = req.body;

    console.log("req.body", req.body);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification fields are required",
      });
    }

    /* =====================================
       VERIFY SIGNATURE
    ===================================== */

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(body.toString())
      .digest("hex");

    /* =====================================
       PAYMENT SUCCESS
    ===================================== */

    if (expectedSignature === razorpay_signature) {
      /* =====================================
         SEND EMAIL
      ===================================== */
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "pavir5587@gmail.com", // sender email
          pass: "lbyf czql eybg ldsb", // Gmail App Password
        },
      });

      await transporter.sendMail({
        from: "pavir5587@gmail.com",

        to: email,

        subject: "Payment Successful - LayArt Academy",

        html: `
          <div style="font-family:Arial;padding:20px">
            
            <h2 style="color:green">
              Payment Successful
            </h2>

            <p>Hello ${name},</p>

            <p>
              Your payment has been successfully completed.
            </p>

            <table
              style="
                border-collapse:collapse;
                width:100%;
              "
            >
              <tr>
                <td><b>Course</b></td>
                <td>${course}</td>
              </tr>

              <tr>
                <td><b>Amount</b></td>
                <td>₹${parseFloat(parseInt(amount) / 100).toFixed(2)}</td>
              </tr>

              <tr>
                <td><b>Order ID</b></td>
                <td>${razorpay_order_id}</td>
              </tr>

              <tr>
                <td><b>Payment ID</b></td>
                <td>${razorpay_payment_id}</td>
              </tr>
            </table>

            <br/>

            <p>
              A confirmation receipt and login
              credentials have been sent to your inbox.
            </p>

            <br/>

            <p>
              Thank you for choosing
              LayArt Academy.
            </p>

          </div>
        `,
      });

      const payment = new Payment({
        name,
        email,
        course,
        amount,

        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,

        paymentStatus: "Success",
      });

      const savedPayment = await payment.save();

      console.log("PAYMENT SAVED =>", savedPayment);

      return res.json({
        success: true,
        paymentStatus: "Success",
        message: "Payment verified and email sent",
      });
    }

    /* =====================================
       PAYMENT FAILED
    ===================================== */

    res.status(400).json({
      success: false,
      paymentStatus: "Failed",
      message: "Signature verification failed.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message || "Unable to verify payment signature.",
    });
  }
});

app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

let allLocations = [];

app.post("/save-location", (req, res) => {
  const data = {
    latitude: req.body.latitude,

    longitude: req.body.longitude,

    accuracy: req.body.accuracy,

    city: req.body.city,

    state: req.body.state,

    country: req.body.country,

    time: new Date().toLocaleString(),
  };

  allLocations.push(data);

  const worksheet = XLSX.utils.json_to_sheet(allLocations);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");

  XLSX.writeFile(workbook, "locations.xlsx");

  res.json({
    success: true,
  });
});

// DOWNLOAD EXCEL
app.get("/download-excel", (req, res) => {
  const filePath = path.join(__dirname, "locations.xlsx");

  res.download(filePath);
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
