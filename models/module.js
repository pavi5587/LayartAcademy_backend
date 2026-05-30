const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
  course: { type: String, required: true }, // course name or courseId
  title: { type: String, required: true },
  order: { type: Number, default: 1 },
  videos: { type: Number, default: 0 },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  created: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Module", moduleSchema);
