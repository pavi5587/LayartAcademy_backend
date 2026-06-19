const express = require("express");
const courseRouter = express.Router();
const courseController = require("../controllers/courseController");
const upload = require("../middleware/upload");
const authenticateToken = require("../middleware/auth");

courseRouter.post("/", authenticateToken, upload.single("image"), courseController.addCourse);
courseRouter.get("/", courseController.getCourses);
courseRouter.get("/:id", courseController.getCourse);
courseRouter.put("/:id", authenticateToken, upload.single("image"), courseController.updateCourse);
courseRouter.delete("/:id", authenticateToken, courseController.deleteCourse);
courseRouter.get("/title/:title", courseController.getCourseByTitle);


module.exports = courseRouter;
