const Module = require("../models/module");

// Create
exports.addModule = async (req, res) => {
  try {
    const module = new Module(req.body);
    await module.save();
    res.status(201).json(module);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Read (all)
exports.getModules = async (req, res) => {
  try {
    const modules = await Module.find();
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read (by course)
exports.getModulesByCourse = async (req, res) => {
  try {
    const modules = await Module.find({ course: req.params.courseName });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Update
exports.updateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(module);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteModule = async (req, res) => {
  try {
    await Module.findByIdAndDelete(req.params.id);
    res.json({ message: "Module deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
