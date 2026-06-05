const express = require("express");
const router = express.Router();

const {
  getProgress,
  saveProgress,
  completeLesson,
  resumeProgress,
  getStats,
} = require("../controllers/watchProgressController");

router.get(
  "/:userId/:courseId",
  getProgress
);

router.post(
  "/save",
  saveProgress
);

router.post(
  "/complete",
  completeLesson
);

router.get(
  "/:userId/:courseId/resume",
  resumeProgress
);

router.get(
  "/:userId/:courseId/stats",
  getStats
);

module.exports = router;