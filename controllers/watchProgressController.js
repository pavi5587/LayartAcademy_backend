const WatchProgress = require("../models/WatchProgress");

function formatSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return h > 0
    ? `${h}h ${m}m`
    : `${m}m ${sec}s`;
}

/* GET ALL PROGRESS */
exports.getProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const records = await WatchProgress.find(
      { userId, courseId },
      {
        lessonId: 1,
        watchedSeconds: 1,
        totalSeconds: 1,
        completed: 1,
        lastWatchedAt: 1,
      }
    ).lean();

    const progressMap = {};

    records.forEach((r) => {
      progressMap[r.lessonId] = {
        watchedSeconds: r.watchedSeconds,
        totalSeconds: r.totalSeconds,
        completed: r.completed,
        lastWatchedAt: r.lastWatchedAt,
      };
    });

    res.json({
      success: true,
      progress: progressMap,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/* SAVE PROGRESS */
exports.saveProgress = async (req, res) => {
  try {
    const {
      userId,
      courseId,
      lessonId,
      watchedSeconds,
      totalSeconds,
    } = req.body;

    if (!userId || !courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const existing = await WatchProgress.findOne({
      userId,
      courseId,
      lessonId,
    });

    if (existing) {
      if (!existing.completed) {
        existing.watchedSeconds = Math.max(
          existing.watchedSeconds,
          watchedSeconds || 0
        );

        existing.totalSeconds =
          totalSeconds || existing.totalSeconds;

        existing.lastWatchedAt = new Date();

        await existing.save();
      }

      return res.json({
        success: true,
        progress: existing,
      });
    }

    const record = await WatchProgress.create({
      userId,
      courseId,
      lessonId,
      watchedSeconds: watchedSeconds || 0,
      totalSeconds: totalSeconds || 0,
      lastWatchedAt: new Date(),
    });

    res.json({
      success: true,
      progress: record,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ success: true });
    }

    console.error(err);

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/* COMPLETE LESSON */
exports.completeLesson = async (req, res) => {
  try {
    const {
      userId,
      courseId,
      lessonId,
      totalSeconds,
    } = req.body;

    if (!userId || !courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const record =
      await WatchProgress.findOneAndUpdate(
        {
          userId,
          courseId,
          lessonId,
        },
        {
          $set: {
            completed: true,
            completedAt: new Date(),
            lastWatchedAt: new Date(),
            watchedSeconds: totalSeconds || 0,
            totalSeconds: totalSeconds || 0,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

    res.json({
      success: true,
      progress: record,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/* RESUME */
exports.resumeProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const lessonIds = req.query.lessonIds
      ? req.query.lessonIds.split(",")
      : [];

    const records = await WatchProgress.find({
      userId,
      courseId,
    }).lean();

    const progressMap = {};

    records.forEach((r) => {
      progressMap[r.lessonId] = r;
    });

    let resumeLessonId = null;
    let resumeSeconds = 0;

    if (lessonIds.length > 0) {
      for (const id of lessonIds) {
        const p = progressMap[id];

        if (!p || !p.completed) {
          resumeLessonId = id;
          resumeSeconds =
            p?.watchedSeconds || 0;
          break;
        }
      }
    } else {
      const incomplete = records
        .filter((r) => !r.completed)
        .sort(
          (a, b) =>
            new Date(b.lastWatchedAt) -
            new Date(a.lastWatchedAt)
        );

      if (incomplete.length > 0) {
        resumeLessonId =
          incomplete[0].lessonId;

        resumeSeconds =
          incomplete[0].watchedSeconds || 0;
      }
    }

    res.json({
      success: true,
      resumeLessonId,
      resumeSeconds,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/* STATS */
exports.getStats = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const records = await WatchProgress.find({
      userId,
      courseId,
    });

    const completed = records.filter(
      (r) => r.completed
    ).length;

    const totalWatchedSeconds =
      records.reduce(
        (sum, r) =>
          sum + (r.watchedSeconds || 0),
        0
      );

    res.json({
      success: true,
      stats: {
        totalLessonsTracked: records.length,
        completedLessons: completed,
        totalWatchedSeconds,
        totalWatchedFormatted:
          formatSeconds(totalWatchedSeconds),
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};