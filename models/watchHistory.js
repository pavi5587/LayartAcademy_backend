// // models/WatchHistory.model.js
// const mongoose = require("mongoose");

// const watchHistorySchema = new mongoose.Schema(
//   {
//     student: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Student",
//       required: true,
//       index: true,
//     },
//     studentName: { type: String, required: true },
//     studentEmail: { type: String },
//     course: { type: String, required: true },
//     module: { type: String, required: true },
//     videoId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Videos",
//       required: true,
//     },
//     videoTitle: { type: String, required: true },
//     videoDuration: { type: Number, default: 0 }, // in minutes
//     watchedSeconds: { type: Number, default: 0 },
//     completionPct: { type: Number, default: 0, min: 0, max: 100 },
//     completed: { type: Boolean, default: false },
//     watchedAt: { type: Date, default: Date.now },
//     lastWatchedAt: { type: Date, default: Date.now },
//     watchCount: { type: Number, default: 1 },
//   },
//   { timestamps: true }
// );

// // Compound index: one record per student+video, upserted on replay
// watchHistorySchema.index({ student: 1, videoId: 1 }, { unique: true });

// module.exports = mongoose.model("WatchHistory", watchHistorySchema);

const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String },
  studentEmail: { type: String },
  course: { type: String },
  module: { type: String },
  videoId: { type: String, required: true },
  videoTitle: { type: String },
  videoDuration: { type: Number },
  watchedSeconds: { type: Number, default: 0 },
  completionPct: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  lastWatchedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Compound index so lookups by student+video are fast
watchHistorySchema.index({ studentId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model("WatchHistory", watchHistorySchema);
