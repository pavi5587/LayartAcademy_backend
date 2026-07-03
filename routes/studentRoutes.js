const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");

const multer = require("multer");

const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

// MULTER CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ROUTES
router.post("/", authenticateToken, upload.single("photo"), createStudent);

router.get("/", getStudents);

router.get("/:id", authenticateToken, getStudentById);

router.put("/:id", authenticateToken, upload.single("photo"), updateStudent);

router.delete("/:id", authenticateToken, deleteStudent);

module.exports = router;
