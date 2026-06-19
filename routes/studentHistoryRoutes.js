// routes/studentHistory.routes.js
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/studentHistoryController");

const adminGuard = (req, res, next) => {
  // e.g. if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/admin/student-history              → paginated table + header stats
router.get("/",          adminGuard, ctrl.getStudentHistory);

// GET /api/admin/student-history/courses      → course dropdown
router.get("/courses",   adminGuard, ctrl.getCourseList);

// GET /api/admin/student-history/modules      → module dropdown (?courseId=xxx to filter)
// router.get("/modules",   adminGuard, ctrl.getModuleList);

// GET /api/admin/student-history/export       → flat export list
router.get("/export",    adminGuard, ctrl.exportStudentHistory);

// GET /api/admin/student-history/:userId      → single student detail grouped by module
router.get("/:userId",   adminGuard, ctrl.getStudentDetail);

module.exports = router;

// ─── Mount in app.js ──────────────────────────────────────────────────────
//   const studentHistoryRoutes = require("./routes/studentHistory.routes");
//   app.use("/api/admin/student-history", studentHistoryRoutes);