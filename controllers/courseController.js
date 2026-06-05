const Course = require("../models/Course");

// Create
exports.addCourse = async (req, res) => {
  try {
     const courseData = {
      ...req.body,
      image: req.file ? req.file.path : null
    };
    const course = new Course(courseData);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Read (all)
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourseByTitle = async (req, res) => {
  try {
    const course = await Course.findOne({ title: req.params.title });
    if (!course) return res.status(404).json({ error: "Course not found" });
    const courseData = course.toObject();
    courseData.tags = course.tags.join(", ");
    courseData.language = course.language.join(", ");
    res.json(courseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateCourse = async (req, res) => {
  try {
      const updateData = {
      ...req.body,
      ...(req.file && { image: req.file.path })
    };
    const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
