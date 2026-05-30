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
    } = req.body;
    // if (!req.file) {
    //   return res.status(400).json({ error: "Video file is required" });
    // }
    // if (fileId) {
    //   return res.status(400).json({ error: "Video file is required" });
    // }
    // console.log("req.file", req.file, req.body);
    const video = new Video({
      title,
      course,
      module,
      duration,
      thumbnailUrl,
      description,
      fileId,
      // videoFile: req.file.path,
    });
    console.log("video", video);

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
    console.log("videos",videos)
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
