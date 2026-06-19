/**
 * controllers/studentHistoryController.js
 *
 * Module model REMOVED — module name/order comes directly from videoDoc.module
 * (the string stored on each Video document).
 *
 * Routes to mount:
 * GET /api/admin/student-history            → getStudentHistory
 * GET /api/admin/student-history/courses    → getCourseList
 * GET /api/admin/student-history/export     → exportStudentHistory
 * GET /api/admin/student-history/:userId    → getStudentDetail
 */

const mongoose = require("mongoose");
const WatchProgress = require("../models/watchProgress");

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatSeconds(s = 0) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
}

function safeCompletionPct(watched, total, isCompleted) {
  if (isCompleted) return 100; // Force 100% if marked completed
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((watched / total) * 100));
}

// ─── SHARED ENRICHMENT PIPELINE ───────────────────────────────────────────────

function buildEnrichmentPipeline(search = "") {
  return [
    // ── 1. Convert lessonId string → ObjectId ─────────────────────────────
    {
      $addFields: {
        lessonObjId: {
          $cond: [
            {
              $and: [
                { $eq: [{ $type: "$lessonId" }, "string"] },
                { $eq: [{ $strLenBytes: "$lessonId" }, 24] },
              ],
            },
            { $toObjectId: "$lessonId" },
            "$lessonId",
          ],
        },
      },
    },

    // ── 2. Video lookup: lessonId → videos._id ────────────────────────────
    {
      $lookup: {
        from: "videos",
        localField: "lessonObjId",
        foreignField: "_id",
        as: "videoDoc",
      },
    },
    { $unwind: { path: "$videoDoc", preserveNullAndEmptyArrays: true } },

    // ── 3. Student lookup: userId → users._id ─────────────────────────────
    {
      $lookup: {
        from: "users",
        let: { uid: "$userId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$_id", "$$uid"] },
                  { $eq: [{ $toString: "$_id" }, "$$uid"] },
                  { $eq: ["$userId", "$$uid"] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "studentDoc",
      },
    },
    { $unwind: { path: "$studentDoc", preserveNullAndEmptyArrays: true } },

    // ── 4. Compute display fields ──────────────────────────────────────────
    {
      $addFields: {
        // Student
        studentName: { $ifNull: ["$studentDoc.name", "$userId"] },
        studentEmail: { $ifNull: ["$studentDoc.email", ""] },

        // Course
        courseName: "$courseId",

        // Video
        videoTitle: { $ifNull: ["$videoDoc.title", "$lessonId"] },
        videoDuration: { $ifNull: ["$videoDoc.duration", null] },

        // Module
        moduleName: {
          $ifNull: [
            "$videoDoc.module",
            "—",
          ],
        },

        // Completion - Forces 100% if completed is true, resolving the 0m 0s bug
        completionPct: {
          $cond: [
            {
              $or: [
                "$completed",
                { $eq: ["$status", "completed"] },
                {
                  $and: [
                    { $gt: ["$totalSeconds", 0] },
                    { $gte: ["$watchedSeconds", "$totalSeconds"] },
                  ],
                },
              ],
            },
            100,
            {
              $cond: [
                { $gt: ["$totalSeconds", 0] },
                {
                  $min: [
                    100,
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ["$watchedSeconds", "$totalSeconds"] },
                            100,
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
                0,
              ],
            },
          ],
        },

        // Status
        statusLabel: {
          $cond: [
            {
              $or: [
                "$completed",
                { $eq: ["$status", "completed"] },
                {
                  $and: [
                    { $gt: ["$totalSeconds", 0] },
                    { $gte: ["$watchedSeconds", "$totalSeconds"] },
                  ],
                },
              ],
            },
            "completed",
            {
              $cond: [
                { $gt: ["$watchedSeconds", 0] },
                "in-progress",
                "not-started",
              ],
            },
          ],
        },
      },
    },

    // ── 5. Free-text search ────────────────────────────────────────────────
    ...(search
      ? [
          {
            $match: {
              $or: [
                { studentName: { $regex: search, $options: "i" } },
                { studentEmail: { $regex: search, $options: "i" } },
                { videoTitle: { $regex: search, $options: "i" } },
                { courseName: { $regex: search, $options: "i" } },
                { moduleName: { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : []),

    // ── 6. Final projection ────────────────────────────────────────────────
    {
      $project: {
        _id: 1,
        userId: 1,
        courseId: 1,
        lessonId: 1,
        studentName: 1,
        studentEmail: 1,
        courseName: 1,
        moduleName: 1,
        videoTitle: 1,
        videoDuration: 1,
        watchedSeconds: 1,
        totalSeconds: 1,
        completionPct: 1,
        completed: 1,
        statusLabel: 1,
        lastWatchedAt: 1,
        createdAt: 1,
      },
    },
  ];
}

// ─── GET ALL STUDENT HISTORY ──────────────────────────────────────────────────

exports.getStudentHistory = async (req, res) => {
  try {
    const {
      search = "",
      courseId = "",
      status = "",
      page = 1,
      limit = 20,
      sortBy = "lastWatchedAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const order = sortOrder === "asc" ? 1 : -1;

    const matchStage = {};
    if (courseId) matchStage.courseId = courseId;
    if (status === "completed") matchStage.completed = true;
    if (status === "not-started") matchStage.watchedSeconds = 0;
    if (status === "in-progress") {
      matchStage.completed = false;
      matchStage.watchedSeconds = { $gt: 0 };
    }

    const pipeline = [
      { $match: matchStage },
      ...buildEnrichmentPipeline(search),
      {
        $facet: {
          data: [
            { $sort: { [sortBy]: order } },
            { $skip: skip },
            { $limit: limitNum },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await WatchProgress.aggregate(pipeline);
    const records = result?.data ?? [];
    const total = result?.totalCount?.[0]?.count ?? 0;

    const [statsRaw] = await WatchProgress.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          uniqueStudents: { $addToSet: "$userId" },
          completedCount: { $sum: { $cond: ["$completed", 1, 0] } },
          totalWatchedSeconds: { $sum: "$watchedSeconds" },
          totalPossibleSeconds: { $sum: "$totalSeconds" },
        },
      },
      {
        $project: {
          totalViews: 1,
          uniqueStudents: { $size: "$uniqueStudents" },
          completedCount: 1,
          totalWatchedSeconds: 1,
          avgCompletion: {
            $cond: [
              { $gt: ["$totalPossibleSeconds", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$totalWatchedSeconds",
                          "$totalPossibleSeconds",
                        ],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    const stats = statsRaw
      ? {
          totalViews: statsRaw.totalViews,
          students: statsRaw.uniqueStudents,
          completed: statsRaw.completedCount,
          avgCompletion: statsRaw.avgCompletion,
          watchHours: formatSeconds(statsRaw.totalWatchedSeconds),
          watchSeconds: statsRaw.totalWatchedSeconds,
        }
      : {
          totalViews: 0,
          students: 0,
          completed: 0,
          avgCompletion: 0,
          watchHours: "0h",
          watchSeconds: 0,
        };

    const rows = records.map((r, idx) => ({
      no: skip + idx + 1,
      id: r._id,
      student: r.studentName,
      email: r.studentEmail,
      course: r.courseName,
      module: r.moduleName,
      video: r.videoTitle,
      videoDuration: r.videoDuration,
      duration: formatSeconds(r.totalSeconds || 0),
      watchedTime: formatSeconds(r.watchedSeconds || 0),
      // Safety net applied here just in case pipeline evaluates unexpectedly
      completionPct: r.completed || r.statusLabel === "completed" ? 100 : r.completionPct,
      status: r.completed ? "completed" : r.statusLabel,
      lastWatched: r.lastWatchedAt,
    }));

    return res.json({
      success: true,
      stats,
      rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("[getStudentHistory]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─── SINGLE STUDENT DETAIL ────────────────────────────────────────────────────

exports.getStudentDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const records = await WatchProgress.aggregate([
      { $match: { userId } },
      ...buildEnrichmentPipeline(),
      { $sort: { moduleName: 1, lastWatchedAt: -1 } },
    ]);

    const totalWatched = records.reduce(
      (s, r) => s + (r.watchedSeconds || 0),
      0
    );
    const totalPossible = records.reduce(
      (s, r) => s + (r.totalSeconds || 0),
      0
    );
    const completedCount = records.filter((r) => r.completed || r.statusLabel === "completed").length;

    const moduleMap = {};
    for (const r of records) {
      const key = r.moduleName || "Unassigned";
      if (!moduleMap[key]) {
        moduleMap[key] = {
          moduleName: key,
          completedLessons: 0,
          totalLessons: 0,
          totalWatchedSeconds: 0,
          lessons: [],
        };
      }
      const mod = moduleMap[key];
      mod.totalLessons++;
      mod.totalWatchedSeconds += r.watchedSeconds || 0;
      
      const isCompleted = r.completed || r.statusLabel === "completed";
      if (isCompleted) mod.completedLessons++;
      
      mod.lessons.push({
        lessonId: r.lessonId,
        videoWatched: r.videoTitle,
        videoDuration: r.videoDuration,
        course: r.courseName,
        duration: formatSeconds(r.totalSeconds || 0),
        watchedTime: formatSeconds(r.watchedSeconds || 0),
        completionPct: safeCompletionPct(r.watchedSeconds, r.totalSeconds, isCompleted),
        status: isCompleted ? "completed" : r.statusLabel,
        completed: isCompleted,
        completedAt: r.completedAt,
        lastWatched: r.lastWatchedAt,
      });
    }

    const modules = Object.values(moduleMap);

    return res.json({
      success: true,
      userId,
      summary: {
        totalLessons: records.length,
        completedLessons: completedCount,
        totalModules: modules.length,
        totalWatchedFormatted: formatSeconds(totalWatched),
        avgCompletion: safeCompletionPct(totalWatched, totalPossible, false),
      },
      modules,
    });
  } catch (err) {
    console.error("[getStudentDetail]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─── COURSE DROPDOWN ──────────────────────────────────────────────────────────

exports.getCourseList = async (req, res) => {
  try {
    const courses = await WatchProgress.distinct("courseId");
    return res.json({ success: true, courses });
  } catch (err) {
    console.error("[getCourseList]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

exports.exportStudentHistory = async (req, res) => {
  try {
    const { search = "", courseId = "", status = "" } = req.query;

    const matchStage = {};
    if (courseId) matchStage.courseId = courseId;
    if (status === "completed") matchStage.completed = true;
    if (status === "not-started") matchStage.watchedSeconds = 0;
    if (status === "in-progress") {
      matchStage.completed = false;
      matchStage.watchedSeconds = { $gt: 0 };
    }

    const pipeline = [
      { $match: matchStage },
      ...buildEnrichmentPipeline(search),
      { $sort: { moduleName: 1, lastWatchedAt: -1 } },
      { $limit: 10000 },
    ];

    const records = await WatchProgress.aggregate(pipeline);

    const rows = records.map((r) => {
      const isCompleted = r.completed || r.statusLabel === "completed";
      return {
        Student: r.studentName,
        Email: r.studentEmail,
        Course: r.courseName,
        Module: r.moduleName,
        "Video Watched": r.videoTitle,
        Duration: formatSeconds(r.totalSeconds || 0),
        Watched: formatSeconds(r.watchedSeconds || 0),
        "Completion%": isCompleted ? 100 : r.completionPct,
        Status: isCompleted ? "completed" : r.statusLabel,
        "Last Watched": r.lastWatchedAt
          ? new Date(r.lastWatchedAt).toISOString()
          : "",
      };
    });

    return res.json({ success: true, total: rows.length, rows });
  } catch (err) {
    console.error("[exportStudentHistory]", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};