const express = require("express");
const { addContact, getContacts } = require("../controllers/contactController");
const authenticateToken = require("../middleware/auth");

const contactRouter = express.Router();

contactRouter.post("/", addContact);   // Add contact form data (public)
contactRouter.get("/", authenticateToken, getContacts);   // Get all contact submissions (admin only)

module.exports = contactRouter;
