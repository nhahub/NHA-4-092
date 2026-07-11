const express = require("express");
const Roadmap = require("../models/Roadmap");

const router = express.Router();

function pushNotification(roadmap, title, message, type = "info") {
    roadmap.notifications.unshift({ title, message, type });
    roadmap.notifications = roadmap.notifications.slice(0, 80);
}

function dayKey(date = new Date()) {
    return new Date(date).toISOString().slice(0, 10);
}

function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dayKey(d);
}

function resetStreakIfBroken(roadmap) {
    if (!roadmap.streak) return false;

    const last = roadmap.lastStreakSavedAt
        ? dayKey(roadmap.lastStreakSavedAt)
        : null;

    const today = dayKey();
    const yesterday = yesterdayKey();

    if (last === today || last === yesterday) return false;

    roadmap.streak = 0;
    return true;
}

function updateStudyStreak(roadmap) {
    const today = dayKey();
    const yesterday = yesterdayKey();

    const last = roadmap.lastStreakSavedAt
        ? dayKey(roadmap.lastStreakSavedAt)
        : null;

    if (last === today) return false;

    roadmap.streak = last === yesterday ? (roadmap.streak || 0) + 1 : 1;

    if (roadmap.streak > (roadmap.longestStreak || 0)) {
        roadmap.longestStreak = roadmap.streak;
    }

    roadmap.lastStreakSavedAt = new Date();

    pushNotification(
        roadmap,
        "Daily streak saved",
        `Your streak is now ${roadmap.streak} day${
            roadmap.streak === 1 ? "" : "s"
        }.`,
        "streak"
    );

    return true;
}

function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanGoalText(goal) {
    return String(goal || "").trim().replace(/\s+/g, " ");
}

const VALID_CATEGORIES = ["learn", "career-path", "portfolio-projects"];

function normalizeCategory(category) {
    const clean = String(category || "").trim().toLowerCase();
    return VALID_CATEGORIES.includes(clean) ? clean : "learn";
}

function categoryLabel(category, goal) {
    if (category === "career-path") return `${goal} Career Path`;
    if (category === "portfolio-projects") return `${goal} Portfolio Projects`;
    return `Learn ${goal}`;
}

function findMatchingRoadmap(userId, goal, category, skillLevel) {
    return Roadmap.findOne({
        user: userId,
        goal: { $regex: `^${escapeRegex(goal)}$`, $options: "i" },
        category,
        skillLevel: { $regex: `^${escapeRegex(String(skillLevel || ""))}$`, $options: "i" },
    });
}

const fallbackPhases = [
    "Orientation & Goal Map",
    "Core Foundations",
    "Essential Tools",
    "Guided Practice",
    "Real-World Workflows",
    "Projects & Feedback",
    "Advanced Patterns",
    "Portfolio Build",
    "Review & Optimization",
    "Next-Level Growth",
];

function cleanSearchQuery(text, topic) {
    let query = String(text || "").trim();
    const lessonTopic = String(topic || "").trim();

    query = query
        .replace(/^YouTube search:\s*/i, "")
        .replace(/^Google search:\s*/i, "")
        .replace(/^Web search:\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();

    const topicIndex = query.toLowerCase().indexOf(lessonTopic.toLowerCase());

    if (lessonTopic && topicIndex > 0) {
        query = query.slice(topicIndex).trim();
    }

    return query || lessonTopic;
}

function makeSearchResource(query, source = "YouTube", topic = "") {
    const cleanQuery = cleanSearchQuery(query, topic);

    return {
        title: source === "YouTube" ? "YouTube tutorial" : "Web guide",
        url:
            source === "YouTube"
                ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
                    cleanQuery
                )}`
                : `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`,
        type: source === "YouTube" ? "video" : "reading",
        source,
        searchQuery: cleanQuery,
    };
}

function normalizeLessonDetails(topics, phaseTitle, goal, provided = []) {
    return topics.map((topic, i) => {
        const d = provided[i] || {};

        const estimatedMinutes = Number(
            d.estimatedMinutes ||
            d.minutes ||
            d.duration ||
            (i % 3 === 2 ? 180 : 120)
        );

        return {
            title: d.title || topic,

            overview:
                d.overview ||
                `Learn ${topic} as part of ${phaseTitle}. This lesson connects directly to ${goal} and includes a clear practice step so your progress is practical.`,

            summary:
                d.summary ||
                `A focused summary of ${topic}: what it means, why it matters, and how to use it in your ${goal} roadmap.`,

            estimatedMinutes,

            objectives:
                Array.isArray(d.objectives) && d.objectives.length
                    ? d.objectives.slice(0, 4)
                    : [
                        `Understand the main idea behind ${topic}`,
                        `Use ${topic} in a realistic mini task`,
                        `Recognize common mistakes related to ${topic}`,
                    ],

            practice:
                d.practice ||
                `Create a small proof-of-learning output for ${topic}, such as notes, a checklist, a mini exercise, or a project piece.`,

            skills:
                Array.isArray(d.skills) && d.skills.length
                    ? d.skills.slice(0, 5)
                    : [topic, phaseTitle],

            resources:
                Array.isArray(d.resources) && d.resources.length
                    ? d.resources.map((r) => {
                        if (typeof r === "string") {
                            const source = r.toLowerCase().includes("youtube")
                                ? "YouTube"
                                : "Web";

                            const word = source === "YouTube" ? "tutorial" : "guide";

                            return makeSearchResource(`${topic} ${word}`, source, topic);
                        }

                        if (r.url) {
                            return r;
                        }

                        const source =
                            r.source ||
                            r.platform ||
                            (String(r.type || "").toLowerCase().includes("video")
                                ? "YouTube"
                                : "Web");

                        const finalSource = source === "YouTube" ? "YouTube" : "Web";
                        const word = finalSource === "YouTube" ? "tutorial" : "guide";

                        return makeSearchResource(
                            r.searchQuery || `${topic} ${word}`,
                            finalSource,
                            topic
                        );
                    })
                    : [
                        makeSearchResource(`${topic} tutorial`, "YouTube", topic),
                        makeSearchResource(`${topic} guide`, "Web", topic),
                    ],
        };
    });
}

function materialFromPhase(p, goal, skillLevel) {
    if (
        p.materials &&
        Array.isArray(p.materials.topics) &&
        p.materials.topics.length
    ) {
        const topics = p.materials.topics.slice(0, 10);

        while (topics.length < 10) {
            topics.push(`${p.title || "Phase"} lesson ${topics.length + 1}`);
        }

        return {
            ...p.materials,
            topics,
            lessonDetails: normalizeLessonDetails(
                topics,
                p.title || "Phase",
                goal,
                p.materials.lessonDetails || []
            ),
            resources: p.materials.resources?.length
                ? p.materials.resources
                : [
                    makeSearchResource(
                        `${p.title || "learning"} full course`,
                        "YouTube",
                        p.title || "learning"
                    ),
                ],
            estimatedTime:
                p.materials.estimatedTime ||
                `${Math.ceil(
                    topics.reduce((sum, _, i) => {
                        return sum + (i % 3 === 2 ? 180 : 120);
                    }, 0) / 60
                )} hours`,
            difficulty: p.materials.difficulty || skillLevel,
        };
    }

    const topics =
        Array.isArray(p.lessons) && p.lessons.length ? p.lessons.slice(0, 10) : [];

    while (topics.length < 10) {
        topics.push(`${p.title || "Phase"} lesson ${topics.length + 1}`);
    }

    return {
        topics,
        lessonDetails: normalizeLessonDetails(topics, p.title || "Phase", goal),
        explanation:
            p.description ||
            `This phase builds ${goal} through ${
                p.title || "focused learning"
            }. Each lesson is sequential and unlocks the next practical step.`,
        resources: [
            makeSearchResource(
                `${p.title || "learning"} full course`,
                "YouTube",
                p.title || "learning"
            ),
            makeSearchResource(
                `${p.title || "learning"} resources`,
                "Web",
                p.title || "learning"
            ),
        ],
        difficulty: skillLevel,
        estimatedTime: `${Math.ceil(
            topics.reduce((sum, _, i) => {
                return sum + (i % 3 === 2 ? 180 : 120);
            }, 0) / 60
        )} hours`,
    };
}

router.post("/", async (req, res) => {
    try {
        const {
            userId,
            goal,
            category,
            skillLevel,
            weeklyHours,
            phaseTitles,
            phases: phaseObjects,
            levelDescription,
        } = req.body;

        if (!userId || !goal) {
            return res.status(400).json({
                error: "userId and goal are required.",
            });
        }

        const cleanGoal = cleanGoalText(goal);
        const cleanCategory = normalizeCategory(category);
        const cleanSkillLevel = String(skillLevel || "Beginner").trim();

        // A roadmap is uniquely identified by goal + category + skill level, so
        // the same goal can have separate "Learn", "Career Path", and "Portfolio
        // Projects" roadmaps, and each of those can have its own Beginner /
        // Intermediate / Advanced version. Only an exact match on all three is
        // blocked — regenerating a *different* level or category is allowed.
        const existingRoadmap = await findMatchingRoadmap(
            userId,
            cleanGoal,
            cleanCategory,
            cleanSkillLevel
        );

        if (existingRoadmap) {
            return res.status(409).json({
                error: `You already generated the ${cleanSkillLevel} roadmap for "${categoryLabel(
                    cleanCategory,
                    cleanGoal
                )}".`,
                roadmap: existingRoadmap,
            });
        }

        const source =
            Array.isArray(phaseObjects) && phaseObjects.length
                ? phaseObjects
                : Array.isArray(phaseTitles) && phaseTitles.length
                    ? phaseTitles.map((title) => ({ title }))
                    : fallbackPhases.map((title) => ({ title }));

        const phases = source.slice(0, 12).map((p, i) => {
            const materials = materialFromPhase(
                p,
                cleanGoal,
                cleanSkillLevel
            );

            const total = materials.topics?.length || 10;

            return {
                title: p.title || String(p),
                description:
                    p.description ||
                    materials.explanation ||
                    "A focused step in your learning path.",
                order: i,
                status: i === 0 ? "in-progress" : "locked",
                lessonProgress: new Array(total).fill(false),
                materials,
            };
        });

        await Roadmap.updateMany({ user: userId }, { active: false });

        const roadmap = await Roadmap.create({
            user: userId,
            goal: cleanGoal,
            category: cleanCategory,
            skillLevel: cleanSkillLevel,
            levelDescription: levelDescription || "",
            weeklyHours,
            phases,
            active: true,
            notifications: [
                {
                    title: "Roadmap generated",
                    message: `Your ${categoryLabel(
                        cleanCategory,
                        cleanGoal
                    )} (${cleanSkillLevel}) roadmap is saved with ${phases.length} phases and ready to start.`,
                    type: "success",
                },
            ],
        });

        res.status(201).json(roadmap);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Could not create roadmap. Please try again.",
        });
    }
});

// Cheap existence check the frontend calls BEFORE spending an AI call.
// GET /api/roadmap/:userId/exists?goal=...&category=...&skillLevel=...
router.get("/:userId/exists", async (req, res) => {
    try {
        const { goal, category, skillLevel } = req.query;

        if (!goal || !skillLevel) {
            return res.status(400).json({
                error: "goal and skillLevel are required.",
            });
        }

        const cleanGoal = cleanGoalText(goal);
        const cleanCategory = normalizeCategory(category);

        const roadmap = await findMatchingRoadmap(
            req.params.userId,
            cleanGoal,
            cleanCategory,
            skillLevel
        );

        res.json({ exists: Boolean(roadmap), roadmap: roadmap || null });
    } catch {
        res.status(500).json({
            error: "Could not check for an existing roadmap.",
        });
    }
});

router.get("/:userId", async (req, res) => {
    try {
        let roadmap = await Roadmap.findOne({
            user: req.params.userId,
            active: true,
        }).sort({ createdAt: -1 });

        if (!roadmap) {
            roadmap = await Roadmap.findOne({
                user: req.params.userId,
            }).sort({ createdAt: -1 });

            if (roadmap) {
                roadmap.active = true;
                await roadmap.save();
            }
        }

        if (!roadmap) {
            return res.status(404).json({
                error: "No roadmap found for this user yet.",
            });
        }

        if (resetStreakIfBroken(roadmap)) {
            await roadmap.save();
        }

        res.json(roadmap);
    } catch {
        res.status(500).json({
            error: "Could not load the roadmap.",
        });
    }
});

router.get("/:userId/all", async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({
            user: req.params.userId,
        }).sort({ createdAt: -1 });

        await Promise.all(
            roadmaps.map((roadmap) => {
                return resetStreakIfBroken(roadmap) ? roadmap.save() : null;
            })
        );

        res.json(roadmaps);
    } catch {
        res.status(500).json({
            error: "Could not load roadmaps.",
        });
    }
});

router.patch("/:roadmapId/activate", async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                error: "Roadmap not found.",
            });
        }

        await Roadmap.updateMany({ user: roadmap.user }, { active: false });

        roadmap.active = true;

        await roadmap.save();

        res.json(roadmap);
    } catch {
        res.status(500).json({
            error: "Could not switch roadmap.",
        });
    }
});

router.patch("/:roadmapId/streak", async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                error: "Roadmap not found.",
            });
        }

        updateStudyStreak(roadmap);

        await roadmap.save();

        res.json(roadmap);
    } catch {
        res.status(500).json({
            error: "Could not save streak.",
        });
    }
});

router.patch("/:roadmapId/phase/:phaseId", async (req, res) => {
    try {
        const { roadmapId, phaseId } = req.params;
        const { materials, status, lessonIndex, lessonDone } = req.body;

        const roadmap = await Roadmap.findById(roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                error: "Roadmap not found.",
            });
        }

        const phase = roadmap.phases.id(phaseId);

        if (!phase) {
            return res.status(404).json({
                error: "Phase not found.",
            });
        }

        if (materials) {
            const normalized = materialFromPhase(
                {
                    title: phase.title,
                    description: phase.description,
                    materials,
                },
                roadmap.goal,
                roadmap.skillLevel
            );

            phase.materials = normalized;

            const total = normalized.topics?.length || 10;

            if (!phase.lessonProgress || phase.lessonProgress.length !== total) {
                phase.lessonProgress = new Array(total).fill(false);
            }
        }

        if (Number.isInteger(lessonIndex)) {
            const total =
                phase.materials?.topics?.length || phase.lessonProgress.length || 10;

            if (lessonIndex < 0 || lessonIndex >= total) {
                return res.status(400).json({
                    error: "Lesson index is out of range.",
                });
            }

            const progress = Array.from({ length: total }, (_, i) => {
                return Boolean(phase.lessonProgress?.[i]);
            });

            const wasDone = progress[lessonIndex];

            progress[lessonIndex] = lessonDone !== false;

            phase.lessonProgress = progress;

            if (!wasDone && progress[lessonIndex]) {
                pushNotification(
                    roadmap,
                    "Lesson complete",
                    `You finished “${
                        phase.materials?.topics?.[lessonIndex] || "a lesson"
                    }”.`,
                    "success"
                );

                updateStudyStreak(roadmap);
            }

            if (progress.every(Boolean) && phase.status !== "completed") {
                phase.status = "completed";
                phase.completedAt = new Date();

                pushNotification(
                    roadmap,
                    "Phase complete",
                    `You completed “${phase.title}”. The next phase is unlocked.`,
                    "achievement"
                );

                const index = roadmap.phases.findIndex((p) => {
                    return String(p._id) === String(phaseId);
                });

                const next = roadmap.phases[index + 1];

                if (next && next.status === "locked") {
                    next.status = "in-progress";
                }
            }
        }

        if (status) {
            phase.status = status;

            if (status === "completed") {
                const total =
                    phase.materials?.topics?.length || phase.lessonProgress.length || 10;

                phase.lessonProgress = new Array(total).fill(true);
                phase.completedAt = new Date();
            }
        }

        await roadmap.save();

        res.json(roadmap);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Could not update this phase.",
        });
    }
});

router.patch("/:roadmapId/notifications/read-all", async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                error: "Roadmap not found.",
            });
        }

        roadmap.notifications.forEach((note) => {
            note.read = true;
        });

        await roadmap.save();

        res.json(roadmap);
    } catch {
        res.status(500).json({
            error: "Could not update notifications.",
        });
    }
});

router.patch("/:roadmapId/notifications/:notificationId", async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                error: "Roadmap not found.",
            });
        }

        const note = roadmap.notifications.id(req.params.notificationId);

        if (note) {
            note.read = true;
        }

        await roadmap.save();

        res.json(roadmap);
    } catch {
        res.status(500).json({
            error: "Could not update notification.",
        });
    }
});
router.delete("/:roadmapId", async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.roadmapId);

        if (!roadmap) {
            return res.status(404).json({
                error: "Roadmap not found.",
            });
        }

        const userId = roadmap.user;
        const wasActive = roadmap.active;

        await Roadmap.findByIdAndDelete(req.params.roadmapId);

        if (wasActive) {
            const latestRoadmap = await Roadmap.findOne({
                user: userId,
            }).sort({ createdAt: -1 });

            if (latestRoadmap) {
                latestRoadmap.active = true;
                await latestRoadmap.save();
            }
        }

        res.json({
            success: true,
            message: "Roadmap deleted successfully.",
        });
    } catch (err) {
        console.error("DELETE ROADMAP ERROR:", err);

        res.status(500).json({
            error: "Could not delete roadmap.",
        });
    }
});
module.exports = router;