const express = require("express");
const { addContact, getContacts } = require("../controllers/contactController");

const contactRouter = express.Router();

contactRouter.post("/", addContact);   // Add contact form data
contactRouter.get("/", getContacts);   // Get all contact submissions

module.exports = contactRouter;
