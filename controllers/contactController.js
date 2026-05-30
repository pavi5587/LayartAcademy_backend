const Contact = require("../models/contact");
const nodemailer = require("nodemailer");
// Add new contact
exports.addContact = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    subject,
    interestedCourses,
    preferredMode,
    message,
  } = req.body;

  try {
    // Configure transporter (use your SMTP or Gmail credentials)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "pavir5587@gmail.com", // sender email
        pass: "lbyf czql eybg ldsb", // Gmail App Password
      },
    });

    // Email content
    const mailOptions = {
      from: "pavir5587@gmail.com",
      to: "pavip5587@gmail.com", // recipient
      subject: `New Contact Form: ${subject}`,
      text: `
        Name: ${firstName} ${lastName}
        Email: ${email}
        Phone: ${phone}
        Subject: ${subject}
        Interested Courses: ${interestedCourses.join(", ")}
        Preferred Mode: ${preferredMode}
        Message: ${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};

// Get all contacts
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
