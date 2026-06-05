const mongoose = require("mongoose");

const watchProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    courseId: {
      type: String,
      required: true,
      index: true,
    },

    lessonId: {
      type: String,
      required: true,
      index: true,
    },

    watchedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

watchProgressSchema.index(
  {
    userId: 1,
    courseId: 1,
    lessonId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("WatchProgress", watchProgressSchema);
