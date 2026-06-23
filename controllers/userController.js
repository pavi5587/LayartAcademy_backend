const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const https = require("https");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

require("dotenv").config();

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "68157426130-bcave0v2j7ci1ck1fesmv4ecodcujacf.apps.googleusercontent.com";

const verifyGoogleToken = (tokenId) =>
  new Promise((resolve, reject) => {
    if (!tokenId) return reject(new Error("Google token is required"));

    const url = new URL(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenId}`,
    );

    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            return reject(new Error("Google token verification failed"));
          }

          try {
            const data = JSON.parse(body);
            if (data.aud !== GOOGLE_CLIENT_ID) {
              return reject(new Error("Google token audience mismatch"));
            }
            if (
              data.email_verified !== "true" &&
              data.email_verified !== true
            ) {
              return reject(new Error("Google email is not verified"));
            }
            resolve(data);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });

const sanitizeUser = (user) => {
  if (!user) return null;
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  return safeUser;
};

const postUser = async (req, res) => {
  const { name, email, mobileNumber, password, course, professional, city } =
    req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      course,
    });

    await newUser.save();
    res.status(201).json({ message: "User Registered" });
  } catch (error) {
    res.status(400).json({ message: "Error Registering User" });
  }
};

const getUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "User Not Found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "5h" },
  );

  res.json({ token, user: sanitizeUser(user) });
};

const googleRegister = async (req, res) => {
  const tokenId =
    req.body.token ||
    req.body.tokenId ||
    req.body.credential ||
    req.body.id_token ||
    req.body.idToken;

  try {
    const googleData = await verifyGoogleToken(tokenId);
    const { email, name, sub: googleId } = googleData;

    if (!email) {
      return res.status(400).json({ message: "Google email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message:
          "User already exists. Please login with Google or use a different email.",
      });
    }

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    const newUser = new User({
      name: name || email.split("@")[0],
      email,
      password: hashedPassword,
      mobileNumber: req.body.mobileNumber || "",
      course: req.body.course || "",
      isGoogleUser: true,
      googleId,
      professional: req.body.professional || "",
      city: req.body.city || "",
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
    );

    res.status(201).json({ token, user: sanitizeUser(newUser) });
  } catch (error) {
    res
      .status(400)
      .json({ message: error.message || "Google registration failed" });
  }
};

const googleLogin = async (req, res) => {
  const tokenId =
    req.body.tokenId ||
    req.body.credential ||
    req.body.id_token ||
    req.body.idToken;

  try {
    const googleData = await verifyGoogleToken(tokenId);
    const { email, name, sub: googleId } = googleData;

    if (!email) {
      return res.status(400).json({ message: "Google email is required" });
    }

    const user = await User.findOne({ email });

    // 🛑 REMOVED AUTO-REGISTER LOGIC
    // If the user doesn't exist, block the login and send an error message
    if (!user) {
      return res.status(404).json({
        message: "User not registered. Please register first.",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
    );

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(400).json({ message: error.message || "Google login failed" });
  }
};

// ✅ Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "layartacademy@gmail.com", // sender email
        pass: "jqca bbsr deet efqn", // Gmail App Password
      },
    });

    const resetUrl = `https://layartacademy.in/reset-password/${token}`;

    await transporter.sendMail({
      from: '"Layart Academy" <layartacademy@gmail.com>',
      to: email,
      subject: "Password Reset",
      html: `
        <h2>Password Reset</h2>
        <p>Click below link to reset password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });

    res.json({
      success: true,
      message: "Reset link sent to email",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getUser,
  postUser,
  getAllUsers,
  googleLogin,
  googleRegister,
  forgotPassword,
  resetPassword,
};
