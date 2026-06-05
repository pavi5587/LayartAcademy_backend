const Contact = require("../models/Contact");
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
        user: "academy@layart.in", // sender email
        pass: "fvpx jllc ziru ddhr", // Gmail App Password
      },
    });

    // Email content
    const mailOptions = {
      from: "academy@layart.in",
      to: email, // recipient
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
