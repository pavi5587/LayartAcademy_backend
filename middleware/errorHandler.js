const { validationResult } = require("express-validator");

/* ── Check validation result and short-circuit if invalid ────── */
exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/* ── Global error handler (used at bottom of server.js) ─────── */
exports.globalErrorHandler = (err, req, res, next) => {
  console.error("❌ Unhandled error:", err.message);

  // Multer file size / type errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large. Max 2 MB." });
  }
  if (err.message === "Only JPG and PNG files are allowed") {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  res.status(500).json({ success: false, message: "Internal server error." });
};
