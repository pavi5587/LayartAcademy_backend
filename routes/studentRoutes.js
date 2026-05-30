const express = require("express");
const router = express.Router();

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
router.post("/", upload.single("photo"), createStudent);

router.get("/", getStudents);

router.get("/:id", getStudentById);

router.put("/:id", upload.single("photo"), updateStudent);

router.delete("/:id", deleteStudent);

module.exports = router;
