const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    course: { type: String, required: true },
    module: { type: String, required: true },
    duration: { type: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    description: { type: String },
    // videoFile: { type: String, required: true },
    fileId: { type: String, required: true },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

let schema = mongoose.model("Videos", videoSchema);

module.exports = schema;
