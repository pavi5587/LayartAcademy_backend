// routes/watchHistory.routes.js
/**
 * Dependencies (add to package.json):
 *   npm install exceljs pdfkit
 *
 * Mount in app.js:
 *   const watchHistoryRouter = require("./routes/watchHistory.routes");
 *   app.use("/api/watch-history", watchHistoryRouter);
 */

const express  = require("express");
const historyRouter   = express.Router();
const ExcelJS  = require("exceljs");
const PDFDoc   = require("pdfkit");
const WatchHistory = require("../models/watchHistory");

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const fmtDuration = (mins) => {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";

/* ─────────────────────────────────────────────────────────────
   POST  /api/watch-history/track
   Body: { studentId, studentName, studentEmail, course, module,
           videoId, videoTitle, videoDuration, watchedSeconds,
           completionPct, completed }
───────────────────────────────────────────────────────────── */
historyRouter.post("/track", async (req, res) => {
  try {
    const {
      studentId, studentName, studentEmail,
      course, module, videoId, videoTitle,
      videoDuration, watchedSeconds, completionPct, completed,
    } = req.body;

    if (!studentId || !videoId) {
      return res.status(400).json({ message: "studentId and videoId are required" });
    }

    // Upsert: update existing record or create new one
    const record = await WatchHistory.findOneAndUpdate(
      { studentId, videoId },
      {
        $set: {
          studentName, studentEmail,
          course, module, videoTitle,
          videoDuration, watchedSeconds,
          completionPct, completed,
          lastWatchedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, record });
  } catch (err) {
    console.error("Watch track error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


/* ─────────────────────────────────────────────────────────────
   GET  /api/watch-history
   Query: ?course=&studentId=&completed=true&page=1&limit=50
───────────────────────────────────────────────────────────── */
historyRouter.get("/", async (req, res) => {
  try {
    const { course, studentId, completed, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (course)    filter.course    = { $regex: course, $options: "i" };
    if (studentId) filter.student   = studentId;
    if (completed !== undefined) filter.completed = completed === "true";

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await WatchHistory.countDocuments(filter);
    const rows  = await WatchHistory.find(filter)
      .sort({ lastWatchedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ total, page: parseInt(page), rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET  /api/watch-history/stats
   Aggregated stats for dashboard
───────────────────────────────────────────────────────────── */
historyRouter.get("/stats", async (req, res) => {
  try {
    const { course } = req.query;
    const match = course ? { course: { $regex: course, $options: "i" } } : {};

    const [summary] = await WatchHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalWatches:     { $sum: "$watchCount" },
          uniqueStudents:   { $addToSet: "$student" },
          completedCount:   { $sum: { $cond: ["$completed", 1, 0] } },
          totalWatchMins:   { $sum: "$watchedSeconds" },
          avgCompletion:    { $avg: "$completionPct" },
        },
      },
      {
        $project: {
          _id: 0,
          totalWatches: 1,
          uniqueStudents: { $size: "$uniqueStudents" },
          completedCount: 1,
          totalWatchHours: { $round: [{ $divide: ["$totalWatchMins", 3600] }, 1] },
          avgCompletion:   { $round: ["$avgCompletion", 1] },
        },
      },
    ]);

    // Per-course breakdown
    const byCourse = await WatchHistory.aggregate([
      {
        $group: {
          _id: "$course",
          watches:   { $sum: "$watchCount" },
          students:  { $addToSet: "$student" },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
        },
      },
      { $project: { course: "$_id", _id: 0, watches: 1, students: { $size: "$students" }, completed: 1 } },
      { $sort: { watches: -1 } },
    ]);

    res.json({ summary: summary || {}, byCourse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET  /api/watch-history/export/excel
   Query: ?course=&studentId=&completed=
───────────────────────────────────────────────────────────── */
historyRouter.get("/export/excel", async (req, res) => {
  try {
    const { course, studentId, completed } = req.query;
    const filter = {};
    if (course)    filter.course  = { $regex: course, $options: "i" };
    if (studentId) filter.student = studentId;
    if (completed !== undefined) filter.completed = completed === "true";

    const rows = await WatchHistory.find(filter)
      .sort({ lastWatchedAt: -1 })
      .lean();

    const wb = new ExcelJS.Workbook();
    wb.creator  = "LayArt Academy";
    wb.created  = new Date();

    /* ── Sheet 1: All Records ── */
    const ws = wb.addWorksheet("Watch History", {
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    });

    // Header style
    const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E1251" } };
    const headerFont = { bold: true, color: { argb: "FFFCAF17" }, size: 11, name: "Calibri" };
    const headerAlign = { vertical: "middle", horizontal: "center", wrapText: true };
    const border = {
      top:    { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      left:   { style: "thin", color: { argb: "FFD1D5DB" } },
      right:  { style: "thin", color: { argb: "FFD1D5DB" } },
    };

    ws.columns = [
      { header: "#",               key: "num",         width: 5  },
      { header: "Student Name",    key: "name",        width: 22 },
      { header: "Email",           key: "email",       width: 28 },
      { header: "Course",          key: "course",      width: 22 },
      { header: "Module",          key: "module",      width: 28 },
      { header: "Video Title",     key: "title",       width: 36 },
      { header: "Duration (mins)", key: "duration",    width: 16 },
      { header: "Watched (sec)",   key: "watched",     width: 14 },
      { header: "Completion %",    key: "completion",  width: 14 },
      { header: "Status",          key: "status",      width: 14 },
      { header: "Watch Count",     key: "watchCount",  width: 13 },
      { header: "First Watched",   key: "firstWatch",  width: 22 },
      { header: "Last Watched",    key: "lastWatch",   width: 22 },
    ];

    // Style header row
    ws.getRow(1).eachCell((cell) => {
      cell.fill      = headerFill;
      cell.font      = headerFont;
      cell.alignment = headerAlign;
      cell.border    = border;
    });
    ws.getRow(1).height = 32;

    // Data rows
    rows.forEach((r, idx) => {
      const row = ws.addRow({
        num:        idx + 1,
        name:       r.studentName || "—",
        email:      r.studentEmail || "—",
        course:     r.course,
        module:     r.module,
        title:      r.videoTitle,
        duration:   r.videoDuration || 0,
        watched:    r.watchedSeconds || 0,
        completion: r.completionPct || 0,
        status:     r.completed ? "✅ Completed" : "🔄 In Progress",
        watchCount: r.watchCount || 1,
        firstWatch: fmtDate(r.watchedAt),
        lastWatch:  fmtDate(r.lastWatchedAt),
      });

      const isEven = idx % 2 === 0;
      row.eachCell((cell) => {
        cell.border    = border;
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.font      = { size: 10, name: "Calibri" };
        cell.fill      = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: isEven ? "FFF8F9FC" : "FFFFFFFF" },
        };
      });

      // Completion % cell: colour-coded
      const compCell = row.getCell("completion");
      const pct = r.completionPct || 0;
      compCell.fill = {
        type: "pattern", pattern: "solid",
        fgColor: { argb: pct >= 90 ? "FFD1FAE5" : pct >= 50 ? "FFFEF9C3" : "FFFEE2E2" },
      };
      compCell.font = {
        bold: true, size: 10, name: "Calibri",
        color: { argb: pct >= 90 ? "FF065F46" : pct >= 50 ? "FF78350F" : "FF991B1B" },
      };
      compCell.value = `${pct}%`;
    });

    // Auto-filter
    ws.autoFilter = { from: "A1", to: "M1" };

    // Freeze header
    ws.views = [{ state: "frozen", ySplit: 1 }];

    /* ── Sheet 2: Summary by Course ── */
    const ws2 = wb.addWorksheet("Course Summary");
    ws2.columns = [
      { header: "Course",          key: "course",    width: 26 },
      { header: "Total Views",     key: "views",     width: 14 },
      { header: "Unique Students", key: "students",  width: 16 },
      { header: "Completed",       key: "completed", width: 14 },
      { header: "Completion Rate", key: "rate",      width: 16 },
    ];
    ws2.getRow(1).eachCell((cell) => {
      cell.fill = headerFill; cell.font = headerFont;
      cell.alignment = headerAlign; cell.border = border;
    });
    ws2.getRow(1).height = 30;

    // Group by course
    const courseMap = {};
    rows.forEach((r) => {
      if (!courseMap[r.course]) courseMap[r.course] = { views: 0, students: new Set(), completed: 0 };
      courseMap[r.course].views++;
      courseMap[r.course].students.add(String(r.student));
      if (r.completed) courseMap[r.course].completed++;
    });

    Object.entries(courseMap).forEach(([course, d], idx) => {
      const rate = d.views > 0 ? Math.round((d.completed / d.views) * 100) : 0;
      const row  = ws2.addRow({
        course, views: d.views, students: d.students.size,
        completed: d.completed, rate: `${rate}%`,
      });
      row.eachCell((cell) => {
        cell.border = border;
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { size: 10, name: "Calibri" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFF8F9FC" : "FFFFFFFF" } };
      });
    });

    // Send file
    const filename = `LayArt_WatchHistory_${Date.now()}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET  /api/watch-history/export/pdf
   Query: ?course=&studentId=&completed=
───────────────────────────────────────────────────────────── */
historyRouter.get("/export/pdf", async (req, res) => {
  try {
    const { course, studentId, completed } = req.query;
    const filter = {};
    if (course)    filter.course  = { $regex: course, $options: "i" };
    if (studentId) filter.student = studentId;
    if (completed !== undefined) filter.completed = completed === "true";

    const rows = await WatchHistory.find(filter)
      .sort({ lastWatchedAt: -1 })
      .lean();

    const filename = `LayArt_WatchHistory_${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDoc({ margin: 36, size: "A4", layout: "landscape" });
    doc.pipe(res);

    // ── Page header ──────────────────────────────────────────
    const NAVY  = "#0E1251";
    const GOLD  = "#FCAF17";
    const WHITE = "#FFFFFF";
    const GRAY  = "#F3F4F6";
    const DKGRAY = "#374151";
    const GREEN = "#065F46";
    const GBG   = "#D1FAE5";

    const PW = doc.page.width  - 72; // printable width
    // Header band
    doc.rect(36, 20, PW, 52).fill(NAVY);
    doc.fontSize(18).font("Helvetica-Bold").fillColor(GOLD)
       .text("LayArt Academy", 48, 30, { continued: true })
       .fillColor(WHITE).font("Helvetica")
       .text("  —  Student Video Watch History", { continued: false });
    doc.fontSize(9).fillColor("rgba(255,255,255,0.6)").font("Helvetica")
       .text(
         `Generated: ${new Date().toLocaleString("en-IN")}  |  Total Records: ${rows.length}` +
         (course ? `  |  Course: ${course}` : ""),
         48, 52
       );

    doc.moveDown(3.2);

    // ── Summary strip ────────────────────────────────────────
    const completed_count = rows.filter((r) => r.completed).length;
    const avg_pct = rows.length
      ? Math.round(rows.reduce((s, r) => s + (r.completionPct || 0), 0) / rows.length)
      : 0;
    const unique_students = new Set(rows.map((r) => String(r.student))).size;

    const summaryY = doc.y;
    const statW    = PW / 4 - 6;

    [
      ["Total Records",    rows.length],
      ["Unique Students",  unique_students],
      ["Completed",        completed_count],
      ["Avg Completion",   `${avg_pct}%`],
    ].forEach(([label, val], i) => {
      const x = 36 + i * (statW + 8);
      doc.rect(x, summaryY, statW, 42).fill(GRAY);
      doc.rect(x, summaryY, 3, 42).fill(GOLD);
      doc.fontSize(8).font("Helvetica").fillColor("#6B7280")
         .text(label, x + 10, summaryY + 7, { width: statW - 14 });
      doc.fontSize(16).font("Helvetica-Bold").fillColor(NAVY)
         .text(String(val), x + 10, summaryY + 18, { width: statW - 14 });
    });

    doc.moveDown(3.8);

    // ── Table ────────────────────────────────────────────────
    const tableTop = doc.y;
    const cols = [
      { label: "#",         w: 28  },
      { label: "Student",   w: 105 },
      { label: "Course",    w: 88  },
      { label: "Module",    w: 95  },
      { label: "Video",     w: 135 },
      { label: "Duration",  w: 52  },
      { label: "Complete%", w: 54  },
      { label: "Status",    w: 62  },
      { label: "Last Watch",w: 95  },
    ];
    const ROW_H  = 20;
    const HEAD_H = 24;
    let cx = 36;

    // Header
    doc.rect(36, tableTop, PW, HEAD_H).fill(NAVY);
    cols.forEach((col) => {
      doc.fontSize(8).font("Helvetica-Bold").fillColor(GOLD)
         .text(col.label, cx + 4, tableTop + 7, { width: col.w - 6 });
      cx += col.w;
    });

    // Rows
    rows.forEach((r, idx) => {
      const y      = tableTop + HEAD_H + idx * ROW_H;
      const isEven = idx % 2 === 0;

      // Check page break
      if (y + ROW_H > doc.page.height - 50) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 36 });
      }

      doc.rect(36, y, PW, ROW_H).fill(isEven ? GRAY : WHITE);

      // Completion colour bar
      const pct    = r.completionPct || 0;
      const barClr = pct >= 90 ? "#22C55E" : pct >= 50 ? "#F59E0B" : "#EF4444";
      const barW   = Math.round((pct / 100) * 50);
      doc.rect(36 + 28 + 105 + 88 + 95 + 135 + 52 + 3, y + 6, barW, 8)
         .fill(barClr + "40");
      doc.rect(36 + 28 + 105 + 88 + 95 + 135 + 52 + 3, y + 6, barW, 8)
         .fill(barClr);

      const cells = [
        String(idx + 1),
        r.studentName || "—",
        r.course,
        r.module,
        r.videoTitle,
        fmtDuration(r.videoDuration),
        `${pct}%`,
        r.completed ? "✓ Done" : "In Progress",
        new Date(r.lastWatchedAt).toLocaleDateString("en-IN"),
      ];

      cx = 36;
      cells.forEach((val, ci) => {
        const textColor = ci === 6 ? (pct >= 90 ? GREEN : pct >= 50 ? "#78350F" : "#991B1B")
                        : ci === 7 ? (r.completed ? GREEN : DKGRAY)
                        : DKGRAY;
        doc.fontSize(7.5)
           .font(ci === 7 && r.completed ? "Helvetica-Bold" : "Helvetica")
           .fillColor(textColor)
           .text(val, cx + 4, y + 6, { width: cols[ci].w - 7, ellipsis: true });
        cx += cols[ci].w;
      });

      // Row divider
      doc.moveTo(36, y + ROW_H).lineTo(36 + PW, y + ROW_H)
         .strokeColor("#E5E7EB").lineWidth(0.4).stroke();
    });

    // ── Footer ───────────────────────────────────────────────
    const footY = doc.page.height - 28;
    doc.rect(36, footY - 4, PW, 20).fill(NAVY);
    doc.fontSize(7.5).font("Helvetica").fillColor(GOLD)
       .text("LayArt Academy  ·  layartacademy@gmail.com  ·  +91 9360695718  ·  Coimbatore, Tamil Nadu",
             40, footY + 2, { width: PW - 8, align: "center" });

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

module.exports = historyRouter;