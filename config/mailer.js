const nodemailer = require("nodemailer");

const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;

if (!mailUser || !mailPass) {
  throw new Error("MAIL_USER and MAIL_PASS must be set for email sending.");
}

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

module.exports = transporter;
