const Video = require("../models/video");

// CREATE
exports.createVideo = async (req, res) => {
  try {
    const {
      title,
      course,
      module,
      duration,
      thumbnailUrl,
      description,
      fileId,
      price,
      originalPrice,
    } = req.body;
   
    const video = new Video({
      title,
      course,
      module,
      duration,
      thumbnailUrl,
      description,
      fileId,
      price,
      originalPrice,
      // videoFile: req.file.path,
    });

    await video.save();
    res.status(201).json({ message: "Video uploaded successfully", video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ALL
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateVideo = async (req, res) => {
  try {
    const updates = { ...req.body };
    // if (req.file) updates.filePath = req.file.path;

    const video = await Video.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!video) return res.status(404).json({ error: "Video not found" });

    res.json({ message: "Video updated successfully", video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
