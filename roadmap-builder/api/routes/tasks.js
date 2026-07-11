const express = require("express");
const Task = require("../models/Task");
const Roadmap = require("../models/Roadmap");

const router = express.Router();

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function getLocalDateKey(date = new Date()) {
    const localDate = new Date(date);

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getWeekStartDate(date = new Date()) {
    const localDate = new Date(date);

    localDate.setHours(12, 0, 0, 0);

    const day = localDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    localDate.setDate(localDate.getDate() + diffToMonday);

    return localDate;
}

function getWeekKey(date = new Date()) {
    return getLocalDateKey(getWeekStartDate(date));
}

function getWeekEndDate(date = new Date()) {
    const start = getWeekStartDate(date);
    const end = new Date(start);

    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return end;
}

function getLessonMinutes(detail) {
    return Number(detail?.estimatedMinutes || detail?.minutes || 120);
}

function getSourceLessonKey(roadmapId, phaseId, lessonIndex) {
    return `${roadmapId}:${phaseId}:${lessonIndex}`;
}

async function syncCompletedWeeklyTasks(userId) {
    const openWeeklyTasks = await Task.find({
        user: userId,
        taskType: "weekly-lesson",
        completed: false,
    });

    if (!openWeeklyTasks.length) return;

    const roadmapIds = [
        ...new Set(
            openWeeklyTasks
                .map((task) => String(task.roadmap || ""))
                .filter(Boolean)
        ),
    ];

    const roadmaps = await Roadmap.find({
        _id: { $in: roadmapIds },
        user: userId,
    });

    const roadmapMap = new Map();

    roadmaps.forEach((roadmap) => {
        roadmapMap.set(String(roadmap._id), roadmap);
    });

    await Promise.all(
        openWeeklyTasks.map(async (task) => {
            const roadmap = roadmapMap.get(String(task.roadmap));

            if (!roadmap) return;

            const phase = safeArray(roadmap.phases).find((item) => {
                return String(item._id) === String(task.phaseId);
            });

            if (!phase) return;

            const isLessonCompleted = Boolean(
                phase.lessonProgress?.[Number(task.lessonIndex)]
            );

            if (!isLessonCompleted) return;

            task.completed = true;
            task.status = "done";
            task.completedAt = new Date();

            await task.save();
        })
    );
}

function buildLessonPlanForRoadmap(roadmap, alreadyPlannedLessonKeys) {
    const weeklyHours = Number(roadmap.weeklyHours || 5);
    const targetMinutes = Math.max(30, Math.round(weeklyHours * 60));
    const selectedLessons = [];

    let selectedMinutes = 0;

    for (const phase of safeArray(roadmap.phases)) {
        if (phase.status === "locked" || phase.status === "completed") continue;

        const topics = safeArray(phase.materials?.topics);
        const details = safeArray(phase.materials?.lessonDetails);
        const progress = safeArray(phase.lessonProgress);

        for (let lessonIndex = 0; lessonIndex < topics.length; lessonIndex += 1) {
            if (progress[lessonIndex]) continue;

            const sourceLessonKey = getSourceLessonKey(
                roadmap._id,
                phase._id,
                lessonIndex
            );

            if (alreadyPlannedLessonKeys.has(sourceLessonKey)) continue;

            const title = topics[lessonIndex];
            const detail = details[lessonIndex] || {};
            const duration = getLessonMinutes(detail);

            /*
                Rule:
                - If the target is 3 hours and lessons are 2h + 2h,
                  include both because the second lesson starts while total is still below target.
                - If the first lesson is 3h and the next is 2h,
                  include only the first because the target is already reached.
            */
            if (selectedLessons.length === 0 || selectedMinutes < targetMinutes) {
                selectedLessons.push({
                    roadmap,
                    phase,
                    lessonIndex,
                    title,
                    duration,
                    sourceLessonKey,
                    summary:
                        detail.summary ||
                        detail.overview ||
                        `Study ${title} from ${roadmap.goal}.`,
                });

                selectedMinutes += duration;
            }

            if (selectedMinutes >= targetMinutes) {
                return selectedLessons;
            }
        }
    }

    return selectedLessons;
}

async function generateWeeklyTasksForUser(userId) {
    const weekKey = getWeekKey();
    const dueDate = getWeekEndDate();

    const roadmaps = await Roadmap.find({
        user: userId,
    }).sort({ createdAt: 1 });

    const openLessonTasks = await Task.find({
        user: userId,
        taskType: "weekly-lesson",
        completed: false,
    });

    const alreadyPlannedLessonKeys = new Set(
        openLessonTasks
            .map((task) => task.sourceLessonKey)
            .filter(Boolean)
    );

    const createdTasks = [];

    for (const roadmap of roadmaps) {
        const alreadyGeneratedThisWeek = await Task.exists({
            user: userId,
            roadmap: roadmap._id,
            weekKey,
            taskType: "weekly-lesson",
        });

        if (alreadyGeneratedThisWeek) continue;

        const lessons = buildLessonPlanForRoadmap(
            roadmap,
            alreadyPlannedLessonKeys
        );

        for (const lesson of lessons) {
            alreadyPlannedLessonKeys.add(lesson.sourceLessonKey);

            const task = await Task.create({
                user: userId,
                roadmap: roadmap._id,
                phaseId: lesson.phase._id,
                lessonIndex: lesson.lessonIndex,
                sourceLessonKey: lesson.sourceLessonKey,
                weekKey,
                taskType: "weekly-lesson",
                title: lesson.title,
                description: lesson.summary,
                duration: lesson.duration,
                completed: false,
                status: "todo",
                priority: "high",
                category: "Learning",
                dueDate,
            });

            createdTasks.push(task);
        }
    }

    return createdTasks;
}

// GET /api/tasks/:userId/weekly
router.get("/:userId/weekly", async (req, res) => {
    try {
        const userId = req.params.userId;
        const weekKey = getWeekKey();

        await syncCompletedWeeklyTasks(userId);
        await generateWeeklyTasksForUser(userId);

        const tasks = await Task.find({
            user: userId,
            $or: [
                { completed: false },
                { weekKey },
            ],
        })
            .populate("roadmap", "goal skillLevel weeklyHours roadmapType")
            .sort({
                completed: 1,
                dueDate: 1,
                createdAt: 1,
            });

        res.json({
            weekKey,
            tasks,
        });
    } catch (err) {
        console.error("GET WEEKLY TASKS ERROR:", err);

        res.status(500).json({
            error: "Could not load weekly tasks.",
        });
    }
});

// GET /api/tasks/:userId
router.get("/:userId", async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.params.userId }).sort({
            dueDate: 1,
        });

        res.json(tasks);
    } catch (err) {
        res.status(500).json({
            error: "Could not load tasks.",
        });
    }
});

// POST /api/tasks
router.post("/", async (req, res) => {
    try {
        const {
            userId,
            roadmapId,
            title,
            description,
            duration,
            dueDate,
            category,
            priority,
        } = req.body;

        if (!userId || !title) {
            return res.status(400).json({
                error: "userId and title are required.",
            });
        }

        const task = await Task.create({
            user: userId,
            roadmap: roadmapId,
            title,
            description,
            duration,
            dueDate,
            category,
            priority,
            taskType: "manual",
        });

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({
            error: "Could not create task.",
        });
    }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });

        if (!task) {
            return res.status(404).json({
                error: "Task not found.",
            });
        }

        res.json(task);
    } catch (err) {
        res.status(500).json({
            error: "Could not update task.",
        });
    }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
        });
    } catch (err) {
        res.status(500).json({
            error: "Could not delete task.",
        });
    }
});

module.exports = router;