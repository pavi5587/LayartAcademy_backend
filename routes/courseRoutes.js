const express = require("express");
const courseRouter = express.Router();
const courseController = require("../controllers/courseController");
const upload = require("../middleware/upload");

courseRouter.post("/", upload.single("image"), courseController.addCourse);
courseRouter.get("/", courseController.getCourses);
courseRouter.get("/:id", courseController.getCourse);
courseRouter.put("/:id", upload.single("image"), courseController.updateCourse);
courseRouter.delete("/:id", courseController.deleteCourse);
courseRouter.get("/title/:title", courseController.getCourseByTitle);


module.exports = courseRouter;
