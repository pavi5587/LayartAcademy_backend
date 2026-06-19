const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  createVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
} = require("../controllers/videoController");

const authenticateToken = require("../middleware/auth");

const videoRouter = express.Router();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("uploads/videos");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// Routes
// videoRouter.post("/", upload.single("videoFile"), createVideo);
videoRouter.post("/", authenticateToken, createVideo);
videoRouter.get("/", getVideos);
videoRouter.get("/:id", authenticateToken, getVideoById);

// videoRouter.put("/:id", upload.single("videoFile"), updateVideo);
videoRouter.put("/:id", authenticateToken, updateVideo);

videoRouter.delete("/:id", authenticateToken, deleteVideo);

module.exports = videoRouter;

// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegPath = require("ffmpeg-static");

// ffmpeg.setFfmpegPath(ffmpegPath);

// const {
//   createVideo,
//   getVideos,
//   getVideoById,
//   updateVideo,
//   deleteVideo,
// } = require("../controllers/videoController");

// const videoRouter = express.Router();

// // ======================
// // CREATE FOLDERS
// // ======================

// const uploadDir = path.join(__dirname, "../uploads/videos");
// const compressedDir = path.join(__dirname, "../uploads/compressed");

// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// if (!fs.existsSync(compressedDir)) {
//   fs.mkdirSync(compressedDir, { recursive: true });
// }

// // ======================
// // MULTER STORAGE
// // ======================

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },

//   filename: (req, file, cb) => {
//     const uniqueName =
//       Date.now() + "-" + file.originalname.replace(/\s+/g, "_");

//     cb(null, uniqueName);
//   },
// });

// // ======================
// // MULTER CONFIG
// // ======================

// const upload = multer({
//   storage,

//   limits: {
//     fileSize: 1024 * 1024 * 1024 * 200, // 200GB
//   },

//   fileFilter: (req, file, cb) => {
//     const allowed = ["video/mp4", "video/mkv", "video/webm", "video/quicktime"];

//     if (!allowed.includes(file.mimetype)) {
//       return cb(new Error("Only video files allowed"));
//     }

//     cb(null, true);
//   },
// });

// // ======================
// // COMPRESS VIDEO
// // ======================

// const compressVideo = (inputPath, outputPath) => {
//   return new Promise((resolve, reject) => {
//     ffmpeg(inputPath)
//       .videoCodec("libx264")
//       .audioCodec("aac")
//       .outputOptions(["-preset veryfast", "-crf 28"])
//       .on("end", () => {
//         console.log("Compression Finished");
//         resolve();
//       })
//       .on("error", (err) => {
//         console.log(err);
//         reject(err);
//       })
//       .save(outputPath);
//   });
// };

// // ======================
// // CREATE VIDEO
// // ======================

// videoRouter.post("/", upload.single("videoFile"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No video uploaded",
//       });
//     }

//     const inputPath = req.file.path;

//     const compressedName = "compressed-" + Date.now() + ".mp4";

//     const outputPath = path.join(compressedDir, compressedName);

//     // Compress
//     await compressVideo(inputPath, outputPath);

//     // Delete original huge file
//     fs.unlinkSync(inputPath);

//     req.body.videoUrl = outputPath;

//     // Save DB
//     await createVideo(req, res);
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// // ======================
// // OTHER ROUTES
// // ======================

// videoRouter.get("/", getVideos);

// videoRouter.get("/:id", getVideoById);

// videoRouter.put("/:id", upload.single("videoFile"), updateVideo);

// videoRouter.delete("/:id", deleteVideo);

// module.exports = videoRouter;
