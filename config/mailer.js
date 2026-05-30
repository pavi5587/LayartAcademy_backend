const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service:   process.env.MAIL_HOST || "pavip5587@gmail.com",
  port:   Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = transporter;
