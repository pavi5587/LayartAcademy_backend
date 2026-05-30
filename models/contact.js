const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String },
  interestedCourses: [{ type: String }], // array of selected courses
  preferredMode: { type: String },       // Offline / Online / Both
  message: { type: String },
}, { timestamps: true });

let schema = mongoose.model("Contact", contactSchema);

module.exports = schema;
