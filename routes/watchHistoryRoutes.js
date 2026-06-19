// routes/watchHistory.routes.js
/**
 * Dependencies (add to package.json):
 *   npm install exceljs pdfkit
 *
 * Mount in app.js:
 *   const watchHistoryRouter = require("./routes/watchHistory.routes");
 *   app.use("/api/watch-history", watchHistoryRouter);
 */

// const express  = require("express");
// const historyRouter   = express.Router();
// const authenticateToken = require("../middleware/auth");
// const ExcelJS  = require("exceljs");
// const PDFDoc   = require("pdfkit");
// const WatchHistory = require("../models/watchHistory");

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
// const fmtDuration = (mins) => {
//   if (!mins) return "—";
//   const h = Math.floor(mins / 60);
//   const m = Math.round(mins % 60);
//   return h > 0 ? `${h}h ${m}m` : `${m}m`;
// };

// const fmtDate = (d) =>
//   d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";

/* ─────────────────────────────────────────────────────────────
   POST  /api/watch-history/track
   Body: { studentId, studentName, studentEmail, course, module,
           videoId, videoTitle, videoDuration, watchedSeconds,
           completionPct, completed }
───────────────────────────────────────────────────────────── */
// historyRouter.post("/track", authenticateToken, async (req, res) => {
//   try {
//     const {
//       studentId, studentName, studentEmail,
//       course, module, videoId, videoTitle,
//       videoDuration, watchedSeconds, completionPct, completed,
//     } = req.body;

//     if (!studentId || !videoId) {
//       return res.status(400).json({ message: "studentId and videoId are required" });
//     }

//     // Upsert: update existing record or create new one
//     const record = await WatchHistory.findOneAndUpdate(
//       { studentId, videoId },
//       {
//         $set: {
//           studentName, studentEmail,
//           course, module, videoTitle,
//           videoDuration, watchedSeconds,
//           completionPct, completed,
//           lastWatchedAt: new Date(),
//         },
//         $setOnInsert: { createdAt: new Date() },
//       },
//       { upsert: true, new: true }
//     );

//     res.status(200).json({ success: true, record });
//   } catch (err) {
//     console.error("Watch track error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

/* ─────────────────────────────────────────────────────────────
   GET  /api/watch-history
   Query: ?course=&studentId=&completed=true&page=1&limit=50
───────────────────────────────────────────────────────────── */
// historyRouter.get("/", authenticateToken, async (req, res) => {
//   try {
//     const { course, studentId, completed, page = 1, limit = 100 } = req.query;
//     const filter = {};
//     if (course)    filter.course    = { $regex: course, $options: "i" };
//     if (studentId) filter.student   = studentId;
//     if (completed !== undefined) filter.completed = completed === "true";

//     const skip  = (parseInt(page) - 1) * parseInt(limit);
//     const total = await WatchHistory.countDocuments(filter);
//     const rows  = await WatchHistory.find(filter)
//       .sort({ lastWatchedAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .lean();

//     res.json({ total, page: parseInt(page), rows });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

/* ─────────────────────────────────────────────────────────────
   GET  /api/watch-history/stats
   Aggregated stats for dashboard
───────────────────────────────────────────────────────────── */
// historyRouter.get("/stats", authenticateToken, async (req, res) => {
//   try {
//     const { course } = req.query;
//     const match = course ? { course: { $regex: course, $options: "i" } } : {};

//     const [summary] = await WatchHistory.aggregate([
//       { $match: match },
//       {
//         $group: {
//           _id: null,
//           totalWatches:     { $sum: "$watchCount" },
//           uniqueStudents:   { $addToSet: "$student" },
//           completedCount:   { $sum: { $cond: ["$completed", 1, 0] } },
//           totalWatchMins:   { $sum: "$watchedSeconds" },
//           avgCompletion:    { $avg: "$completionPct" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           totalWatches: 1,
//           uniqueStudents: { $size: "$uniqueStudents" },
//           completedCount: 1,
//           totalWatchHours: { $round: [{ $divide: ["$totalWatchMins", 3600] }, 1] },
//           avgCompletion:   { $round: ["$avgCompletion", 1] },
//         },
//       },
//     ]);

//     // Per-course breakdown
//     const byCourse = await WatchHistory.aggregate([
//       {
//         $group: {
//           _id: "$course",
//           watches:   { $sum: "$watchCount" },
//           students:  { $addToSet: "$student" },
//           completed: { $sum: { $cond: ["$completed", 1, 0] } },
//         },
//       },
//       { $project: { course: "$_id", _id: 0, watches: 1, students: { $size: "$students" }, completed: 1 } },
//       { $sort: { watches: -1 } },
//     ]);

//     res.json({ summary: summary || {}, byCourse });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

/* ─────────────────────────────────────────────────────────────
   GET  /api/watch-history/export/excel
   Query: ?course=&studentId=&completed=
───────────────────────────────────────────────────────────── */
// historyRouter.get("/export/excel", authenticateToken, async (req, res) => {
//   try {
//     const { course, studentId, completed } = req.query;
//     const filter = {};
//     if (course)    filter.course  = { $regex: course, $options: "i" };
//     if (studentId) filter.student = studentId;
//     if (completed !== undefined) filter.completed = completed === "true";

//     const rows = await WatchHistory.find(filter)
//       .sort({ lastWatchedAt: -1 })
//       .lean();

//     const wb = new ExcelJS.Workbook();
//     wb.creator  = "LayArt Academy";
//     wb.created  = new Date();

//     /* ── Sheet 1: All Records ── */
//     const ws = wb.addWorksheet("Watch History", {
//       pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
//     });

//     // Header style
//     const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E1251" } };
//     const headerFont = { bold: true, color: { argb: "FFFCAF17" }, size: 11, name: "Calibri" };
//     const headerAlign = { vertical: "middle", horizontal: "center", wrapText: true };
//     const border = {
//       top:    { style: "thin", color: { argb: "FFD1D5DB" } },
//       bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
//       left:   { style: "thin", color: { argb: "FFD1D5DB" } },
//       right:  { style: "thin", color: { argb: "FFD1D5DB" } },
//     };

//     ws.columns = [
//       { header: "#",               key: "num",         width: 5  },
//       { header: "Student Name",    key: "name",        width: 22 },
//       { header: "Email",           key: "email",       width: 28 },
//       { header: "Course",          key: "course",      width: 22 },
//       { header: "Module",          key: "module",      width: 28 },
//       { header: "Video Title",     key: "title",       width: 36 },
//       { header: "Duration (mins)", key: "duration",    width: 16 },
//       { header: "Watched (sec)",   key: "watched",     width: 14 },
//       { header: "Completion %",    key: "completion",  width: 14 },
//       { header: "Status",          key: "status",      width: 14 },
//       { header: "Watch Count",     key: "watchCount",  width: 13 },
//       { header: "First Watched",   key: "firstWatch",  width: 22 },
//       { header: "Last Watched",    key: "lastWatch",   width: 22 },
//     ];

//     // Style header row
//     ws.getRow(1).eachCell((cell) => {
//       cell.fill      = headerFill;
//       cell.font      = headerFont;
//       cell.alignment = headerAlign;
//       cell.border    = border;
//     });
//     ws.getRow(1).height = 32;

//     // Data rows
//     rows.forEach((r, idx) => {
//       const row = ws.addRow({
//         num:        idx + 1,
//         name:       r.studentName || "—",
//         email:      r.studentEmail || "—",
//         course:     r.course,
//         module:     r.module,
//         title:      r.videoTitle,
//         duration:   r.videoDuration || 0,
//         watched:    r.watchedSeconds || 0,
//         completion: r.completionPct || 0,
//         status:     r.completed ? "✅ Completed" : "🔄 In Progress",
//         watchCount: r.watchCount || 1,
//         firstWatch: fmtDate(r.watchedAt),
//         lastWatch:  fmtDate(r.lastWatchedAt),
//       });

//       const isEven = idx % 2 === 0;
//       row.eachCell((cell) => {
//         cell.border    = border;
//         cell.alignment = { vertical: "middle", horizontal: "left" };
//         cell.font      = { size: 10, name: "Calibri" };
//         cell.fill      = {
//           type: "pattern", pattern: "solid",
//           fgColor: { argb: isEven ? "FFF8F9FC" : "FFFFFFFF" },
//         };
//       });

//       // Completion % cell: colour-coded
//       const compCell = row.getCell("completion");
//       const pct = r.completionPct || 0;
//       compCell.fill = {
//         type: "pattern", pattern: "solid",
//         fgColor: { argb: pct >= 90 ? "FFD1FAE5" : pct >= 50 ? "FFFEF9C3" : "FFFEE2E2" },
//       };
//       compCell.font = {
//         bold: true, size: 10, name: "Calibri",
//         color: { argb: pct >= 90 ? "FF065F46" : pct >= 50 ? "FF78350F" : "FF991B1B" },
//       };
//       compCell.value = `${pct}%`;
//     });

//     // Auto-filter
//     ws.autoFilter = { from: "A1", to: "M1" };

//     // Freeze header
//     ws.views = [{ state: "frozen", ySplit: 1 }];

//     /* ── Sheet 2: Summary by Course ── */
//     const ws2 = wb.addWorksheet("Course Summary");
//     ws2.columns = [
//       { header: "Course",          key: "course",    width: 26 },
//       { header: "Total Views",     key: "views",     width: 14 },
//       { header: "Unique Students", key: "students",  width: 16 },
//       { header: "Completed",       key: "completed", width: 14 },
//       { header: "Completion Rate", key: "rate",      width: 16 },
//     ];
//     ws2.getRow(1).eachCell((cell) => {
//       cell.fill = headerFill; cell.font = headerFont;
//       cell.alignment = headerAlign; cell.border = border;
//     });
//     ws2.getRow(1).height = 30;

//     // Group by course
//     const courseMap = {};
//     rows.forEach((r) => {
//       if (!courseMap[r.course]) courseMap[r.course] = { views: 0, students: new Set(), completed: 0 };
//       courseMap[r.course].views++;
//       courseMap[r.course].students.add(String(r.student));
//       if (r.completed) courseMap[r.course].completed++;
//     });

//     Object.entries(courseMap).forEach(([course, d], idx) => {
//       const rate = d.views > 0 ? Math.round((d.completed / d.views) * 100) : 0;
//       const row  = ws2.addRow({
//         course, views: d.views, students: d.students.size,
//         completed: d.completed, rate: `${rate}%`,
//       });
//       row.eachCell((cell) => {
//         cell.border = border;
//         cell.alignment = { vertical: "middle", horizontal: "center" };
//         cell.font = { size: 10, name: "Calibri" };
//         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFF8F9FC" : "FFFFFFFF" } };
//       });
//     });

//     // Send file
//     const filename = `LayArt_WatchHistory_${Date.now()}.xlsx`;
//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     await wb.xlsx.write(res);
//     res.end();
//   } catch (err) {
//     console.error("Excel export error:", err);
//     res.status(500).json({ message: err.message });
//   }
// });

/* ─────────────────────────────────────────────────────────────
   GET  /api/watch-history/export/pdf
   Query: ?course=&studentId=&completed=
───────────────────────────────────────────────────────────── */
// historyRouter.get("/export/pdf",  async (req, res) => {

//   try {
//     const { course, studentId, completed } = req.query;
//     const filter = {};
//     if (course)    filter.course  = { $regex: course, $options: "i" };
//     if (studentId) filter.student = studentId;
//     if (completed !== undefined) filter.completed = completed === "true";

//     const rows = await WatchHistory.find(filter)
//       .sort({ lastWatchedAt: -1 })
//       .lean();

//     const filename = `LayArt_WatchHistory_${Date.now()}.pdf`;
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

//     const doc = new PDFDoc({ margin: 36, size: "A4", layout: "landscape" });
//     doc.pipe(res);

//     // ── Page header ──────────────────────────────────────────
//     const NAVY  = "#0E1251";
//     const GOLD  = "#FCAF17";
//     const WHITE = "#FFFFFF";
//     const GRAY  = "#F3F4F6";
//     const DKGRAY = "#374151";
//     const GREEN = "#065F46";
//     const GBG   = "#D1FAE5";

//     const PW = doc.page.width  - 72; // printable width
//     // Header band
//     doc.rect(36, 20, PW, 52).fill(NAVY);
//     doc.fontSize(18).font("Helvetica-Bold").fillColor(GOLD)
//        .text("LayArt Academy", 48, 30, { continued: true })
//        .fillColor(WHITE).font("Helvetica")
//        .text("  —  Student Video Watch History", { continued: false });
//     doc.fontSize(9).fillColor("rgba(255,255,255,0.6)").font("Helvetica")
//        .text(
//          `Generated: ${new Date().toLocaleString("en-IN")}  |  Total Records: ${rows.length}` +
//          (course ? `  |  Course: ${course}` : ""),
//          48, 52
//        );

//     doc.moveDown(3.2);

//     // ── Summary strip ────────────────────────────────────────
//     const completed_count = rows.filter((r) => r.completed).length;
//     const avg_pct = rows.length
//       ? Math.round(rows.reduce((s, r) => s + (r.completionPct || 0), 0) / rows.length)
//       : 0;
//     const unique_students = new Set(rows.map((r) => String(r.student))).size;

//     const summaryY = doc.y;
//     const statW    = PW / 4 - 6;

//     [
//       ["Total Records",    rows.length],
//       ["Unique Students",  unique_students],
//       ["Completed",        completed_count],
//       ["Avg Completion",   `${avg_pct}%`],
//     ].forEach(([label, val], i) => {
//       const x = 36 + i * (statW + 8);
//       doc.rect(x, summaryY, statW, 42).fill(GRAY);
//       doc.rect(x, summaryY, 3, 42).fill(GOLD);
//       doc.fontSize(8).font("Helvetica").fillColor("#6B7280")
//          .text(label, x + 10, summaryY + 7, { width: statW - 14 });
//       doc.fontSize(16).font("Helvetica-Bold").fillColor(NAVY)
//          .text(String(val), x + 10, summaryY + 18, { width: statW - 14 });
//     });

//     doc.moveDown(3.8);

//     // ── Table ────────────────────────────────────────────────
//     const tableTop = doc.y;
//     const cols = [
//       { label: "#",         w: 28  },
//       { label: "Student",   w: 105 },
//       { label: "Course",    w: 88  },
//       { label: "Module",    w: 95  },
//       { label: "Video",     w: 135 },
//       { label: "Duration",  w: 52  },
//       { label: "Complete%", w: 54  },
//       { label: "Status",    w: 62  },
//       { label: "Last Watch",w: 95  },
//     ];
//     const ROW_H  = 20;
//     const HEAD_H = 24;
//     let cx = 36;

//     // Header
//     doc.rect(36, tableTop, PW, HEAD_H).fill(NAVY);
//     cols.forEach((col) => {
//       doc.fontSize(8).font("Helvetica-Bold").fillColor(GOLD)
//          .text(col.label, cx + 4, tableTop + 7, { width: col.w - 6 });
//       cx += col.w;
//     });

//     // Rows
//     rows.forEach((r, idx) => {
//       const y      = tableTop + HEAD_H + idx * ROW_H;
//       const isEven = idx % 2 === 0;

//       // Check page break
//       if (y + ROW_H > doc.page.height - 50) {
//         doc.addPage({ size: "A4", layout: "landscape", margin: 36 });
//       }

//       doc.rect(36, y, PW, ROW_H).fill(isEven ? GRAY : WHITE);

//       // Completion colour bar
//       const pct    = r.completionPct || 0;
//       const barClr = pct >= 90 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444";
//       const barW   = Math.round((pct / 100) * 50);
//       doc.rect(36 + 28 + 105 + 88 + 95 + 135 + 52 + 3, y + 6, barW, 8)
//          .fill(barClr + "40");
//       doc.rect(36 + 28 + 105 + 88 + 95 + 135 + 52 + 3, y + 6, barW, 8)
//          .fill(barClr);

//       const cells = [
//         String(idx + 1),
//         r.studentName || "—",
//         r.course,
//         r.module,
//         r.videoTitle,
//         fmtDuration(r.videoDuration),
//         `${pct}%`,
//         r.completed ? "✓ Done" : "In Progress",
//         new Date(r.lastWatchedAt).toLocaleDateString("en-IN"),
//       ];

//       cx = 36;
//       cells.forEach((val, ci) => {
//         const textColor = ci === 6 ? (pct >= 90 ? GREEN : pct >= 50 ? "#78350F" : "#991B1B")
//                         : ci === 7 ? (r.completed ? GREEN : DKGRAY)
//                         : DKGRAY;
//         doc.fontSize(7.5)
//            .font(ci === 7 && r.completed ? "Helvetica-Bold" : "Helvetica")
//            .fillColor(textColor)
//            .text(val, cx + 4, y + 6, { width: cols[ci].w - 7, ellipsis: true });
//         cx += cols[ci].w;
//       });

//       // Row divider
//       doc.moveTo(36, y + ROW_H).lineTo(36 + PW, y + ROW_H)
//          .strokeColor("#E5E7EB").lineWidth(0.4).stroke();
//     });

//     // ── Footer ───────────────────────────────────────────────
//     const footY = doc.page.height - 28;
//     doc.rect(36, footY - 4, PW, 20).fill(NAVY);
//     doc.fontSize(7.5).font("Helvetica").fillColor(GOLD)
//        .text("LayArt Academy  ·  layartacademy@gmail.com  ·  +91 9360695718  ·  Coimbatore, Tamil Nadu",
//              40, footY + 2, { width: PW - 8, align: "center" });

//     doc.end();
//   } catch (err) {
//     console.error("PDF export error:", err);
//     if (!res.headersSent) res.status(500).json({ message: err.message });
//   }
// });

// module.exports = historyRouter;

/**
 * routes/watchProgressAdmin.js
 *
 * Admin-facing routes for the Student Watch History dashboard.
 * Mount as:  app.use("/api/watch-progress", require("./routes/watchProgressAdmin"));
 *
 * Depends on your existing controller exports PLUS the new adminHistory / adminStats handlers below.
 */

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WatchProgress = require("../models/watchProgress");
const ctrl = require("../controllers/watchProgressController");

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatSeconds(s = 0) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

// Build the $addFields stage that converts string IDs → ObjectId for $lookup
function toObjectIdField(outputField, sourceField) {
  return {
    [outputField]: {
      $cond: {
        if: {
          $regexMatch: {
            input: { $ifNull: [sourceField, ""] },
            regex: /^[a-f\d]{24}$/i,
          },
        },
        then: { $toObjectId: sourceField },
        else: "$$REMOVE",
      },
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// STATIC ROUTES  (must come before /:userId/:courseId)
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. GET /api/watchHistory/admin/stats ──────────────────────────────────────
//    Returns the 5 headline numbers for the stat cards.
router.get("/admin/stats", async (req, res) => {
  try {
    const [agg] = await WatchProgress.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          uniqueStudents: { $addToSet: "$userId" },
          completedLessons: { $sum: { $cond: ["$completed", 1, 0] } },
          totalWatchedSeconds: { $sum: { $ifNull: ["$watchedSeconds", 0] } },
          sumRatio: {
            $sum: {
              $cond: [
                { $gt: ["$totalSeconds", 0] },
                { $divide: ["$watchedSeconds", "$totalSeconds"] },
                0,
              ],
            },
          },
          countWithDuration: {
            $sum: { $cond: [{ $gt: ["$totalSeconds", 0] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalViews: 1,
          uniqueStudents: { $size: "$uniqueStudents" },
          completedLessons: 1,
          totalWatchedSeconds: 1,
          avgCompletion: {
            $cond: [
              { $gt: ["$countWithDuration", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$sumRatio", "$countWithDuration"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    const stats = {
      totalViews: agg?.totalViews ?? 0,
      uniqueStudents: agg?.uniqueStudents ?? 0,
      completedLessons: agg?.completedLessons ?? 0,
      totalWatchedSeconds: agg?.totalWatchedSeconds ?? 0,
      avgCompletion: agg?.avgCompletion ?? 0,
    };
    stats.totalWatchedFormatted = formatSeconds(stats.totalWatchedSeconds);

    return res.json({ success: true, stats });
  } catch (err) {
    console.error("[admin/stats]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── 2. GET /api/watchHistory/history ──────────────────────────────────────────
//    Full table — joins users, courses, lessons using only userId stored in WatchProgress.
//
//    Query params:
//      courseId   filter by courseId (optional)
//      status     "completed" | "in_progress" (optional)
//      search     text search across student/course/lesson (optional)
//      page       page number (default 1)
//      limit      rows per page (default 50)

router.get("/history", async (req, res) => {
  try {
    const { courseId, status, search, page = 1, limit = 50 } = req.query;

    // ── base match on WatchProgress fields ──────────────────────────────────
    const match = {};
    if (courseId && courseId !== "all") match.courseId = courseId;
    if (status === "completed") match.completed = true;
    if (status === "in_progress") match.completed = false;

    const pipeline = [
      { $match: match },

      // ── Convert string IDs → ObjectId for $lookup ────────────────────────
      {
        $addFields: {
          ...toObjectIdField("_userObjId", "$userId"),
          ...toObjectIdField("_courseObjId", "$courseId"),
          ...toObjectIdField("_lessonObjId", "$lessonId"),
        },
      },

      // ── JOIN: users (by userId) ──────────────────────────────────────────
      // ⚠ Change "users" if your collection has a different name.
      // ⚠ Change field names (name/email/phone/avatar/role) to match your User model.
      {
        $lookup: {
          from: "users",
          localField: "_userObjId",
          foreignField: "_id",
          as: "_user",
          pipeline: [
            {
              $project: {
                // common field names — add fallbacks for your schema
                name: {
                  $ifNull: [
                    "$name",
                    {
                      $ifNull: [
                        "$fullName",
                        { $ifNull: ["$username", "Unknown"] },
                      ],
                    },
                  ],
                },
                email: { $ifNull: ["$email", ""] },
                phone: { $ifNull: ["$phone", ""] },
                avatar: {
                  $ifNull: ["$avatar", { $ifNull: ["$profileImage", ""] }],
                },
                role: { $ifNull: ["$role", "student"] },
              },
            },
          ],
        },
      },
      { $unwind: { path: "$_user", preserveNullAndEmpty: true } },

      // ── JOIN: courses (by courseId) ──────────────────────────────────────
      // ⚠ Change "courses" if your collection has a different name.
      // ⚠ Change field names to match your Course model.
      {
        $lookup: {
          from: "courses",
          localField: "_courseObjId",
          foreignField: "_id",
          as: "_course",
          pipeline: [
            {
              $project: {
                title: {
                  $ifNull: ["$title", { $ifNull: ["$courseName", ""] }],
                },
                thumbnail: {
                  $ifNull: ["$thumbnail", { $ifNull: ["$image", ""] }],
                },
                category: { $ifNull: ["$category", ""] },
              },
            },
          ],
        },
      },
      { $unwind: { path: "$_course", preserveNullAndEmpty: true } },

      // ── JOIN: lessons (by lessonId) ──────────────────────────────────────
      // ⚠ Change "lessons" if your collection has a different name.
      {
        $lookup: {
          from: "lessons",
          localField: "_lessonObjId",
          foreignField: "_id",
          as: "_lesson",
          pipeline: [
            {
              $project: {
                title: {
                  $ifNull: ["$title", { $ifNull: ["$videoTitle", ""] }],
                },
                moduleTitle: {
                  $ifNull: ["$moduleTitle", { $ifNull: ["$module", ""] }],
                },
                duration: { $ifNull: ["$duration", 0] },
              },
            },
          ],
        },
      },
      { $unwind: { path: "$_lesson", preserveNullAndEmpty: true } },

      // ── Final projection ─────────────────────────────────────────────────
      {
        $project: {
          _userObjId: 0,
          _courseObjId: 0,
          _lessonObjId: 0, // remove temp fields

          // WatchProgress core
          userId: 1,
          courseId: 1,
          lessonId: 1,
          watchedSeconds: 1,
          totalSeconds: { $ifNull: ["$totalSeconds", "$_lesson.duration"] },
          completed: 1,
          completedAt: 1,
          lastWatchedAt: 1,
          viewCount: { $ifNull: ["$viewCount", 1] },

          // From users collection
          studentName: { $ifNull: ["$_user.name", "$userId"] },
          studentEmail: { $ifNull: ["$_user.email", ""] },
          studentPhone: { $ifNull: ["$_user.phone", ""] },
          studentAvatar: { $ifNull: ["$_user.avatar", ""] },
          studentRole: { $ifNull: ["$_user.role", "student"] },

          // From courses collection
          courseTitle: { $ifNull: ["$_course.title", "$courseId"] },
          courseThumbnail: { $ifNull: ["$_course.thumbnail", ""] },
          courseCategory: { $ifNull: ["$_course.category", ""] },

          // From lessons collection
          lessonTitle: { $ifNull: ["$_lesson.title", "$lessonId"] },
          moduleTitle: { $ifNull: ["$_lesson.moduleTitle", ""] },
        },
      },

      { $sort: { lastWatchedAt: -1 } },
    ];

    // Run aggregation
    let records = await WatchProgress.aggregate(pipeline);

    // ── Text search across joined fields (post-aggregate) ───────────────────
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      records = records.filter(
        (r) =>
          r.studentName?.toLowerCase().includes(q) ||
          r.studentEmail?.toLowerCase().includes(q) ||
          r.courseTitle?.toLowerCase().includes(q) ||
          r.lessonTitle?.toLowerCase().includes(q) ||
          r.moduleTitle?.toLowerCase().includes(q) ||
          r.courseCategory?.toLowerCase().includes(q),
      );
    }

    const total = records.length;

    // ── Pagination ───────────────────────────────────────────────────────────
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const paginated = records.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum,
    );

    return res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      records: paginated,
    });
  } catch (err) {
    console.error("[history]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── 3. GET /api/watchHistory/export ──────────────────────────────────────────
//    Export as Excel or PDF. Wire up exceljs / pdfkit here.
router.get("/export", async (req, res) => {
  try {
    const { format = "excel", courseId, status } = req.query;

    // Fetch all records (reuse history logic without pagination)
    const match = {};
    if (courseId && courseId !== "all") match.courseId = courseId;
    if (status === "completed") match.completed = true;
    if (status === "in_progress") match.completed = false;

    const records = await WatchProgress.find(match).lean();

    if (format === "excel") {
      // npm install exceljs  → then uncomment below
      // const ExcelJS = require("exceljs");
      // const wb = new ExcelJS.Workbook();
      // const ws = wb.addWorksheet("Watch History");
      // ws.columns = [
      //   { header: "Student",    key: "userId",         width: 30 },
      //   { header: "Course",     key: "courseId",       width: 30 },
      //   { header: "Lesson",     key: "lessonId",       width: 30 },
      //   { header: "Watched(s)", key: "watchedSeconds", width: 14 },
      //   { header: "Total(s)",   key: "totalSeconds",   width: 12 },
      //   { header: "Completed",  key: "completed",      width: 12 },
      //   { header: "Last Seen",  key: "lastWatchedAt",  width: 22 },
      // ];
      // records.forEach(r => ws.addRow(r));
      // res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      // res.setHeader("Content-Disposition","attachment; filename=watch-history.xlsx");
      // return wb.xlsx.write(res);
      return res
        .status(501)
        .json({
          success: false,
          error: "Install exceljs and uncomment the export code.",
        });
    }

    return res
      .status(501)
      .json({
        success: false,
        error: "PDF export: install pdfkit and implement here.",
      });
  } catch (err) {
    console.error("[export]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── 4. POST /api/watchHistory/save ───────────────────────────────────────────
router.post("/save", ctrl.saveProgress);

// ── 5. POST /api/watchHistory/complete ───────────────────────────────────────
router.post("/complete", ctrl.completeLesson);

// ══════════════════════════════════════════════════════════════════════════════
// DYNAMIC ROUTES  (after all static routes)
// ══════════════════════════════════════════════════════════════════════════════

// ── 6. GET /api/watchHistory/resume/:userId/:courseId ─────────────────────────
router.get("/resume/:userId/:courseId", ctrl.resumeProgress);

// ── 7. GET /api/watchHistory/stats/:userId/:courseId  (per-user stats) ────────
router.get("/stats/:userId/:courseId", ctrl.getStats);

// ── 8. GET /api/watchHistory/:userId/:courseId  (raw progress map) ────────────
router.get("/:userId/:courseId", ctrl.getProgress);

module.exports = router;
