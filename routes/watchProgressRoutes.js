const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");

const {
  getProgress,
  saveProgress,
  completeLesson,
  resumeProgress,
  getStats,
} = require("../controllers/watchProgressController");

router.get("/:userId/:courseId", authenticateToken, getProgress);

router.post("/save", authenticateToken, saveProgress);

router.post("/complete", authenticateToken, completeLesson);

router.get("/:userId/:courseId/resume", authenticateToken, resumeProgress);

router.get("/:userId/:courseId/stats", authenticateToken, getStats);

module.exports = router;
