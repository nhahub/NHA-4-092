const express = require("express");
const jwt = require("jsonwebtoken");
const FocusSession = require("../models/FocusSession");

const router = express.Router();

const FULL_SESSION_SECONDS = 25 * 60;

function getUserIdFromRequest(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
        return decoded.id;
    } catch {
        return null;
    }
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

router.post("/session", async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                error: "You must be logged in.",
            });
        }

        const seconds = Number(req.body.seconds);

        // Duration is now selectable on the frontend (25/30/45/50 min presets),
        // so the client tells us what the session was set to run for.
        // Falls back to the classic 25-minute session for older clients.
        const duration = Number(req.body.duration) || FULL_SESSION_SECONDS;

        if (!seconds || seconds <= 0) {
            return res.status(400).json({
                error: "Focus seconds are required.",
            });
        }

        const completed = seconds >= duration;

        await FocusSession.create({
            userId,
            seconds,
            duration,
            completed,
        });

        res.status(201).json({
            message: completed
                ? "Completed focus session saved."
                : "Partial focus time saved.",
            completed,
        });
    } catch (error) {
        console.error("SAVE FOCUS SESSION ERROR:", error);

        res.status(500).json({
            error: "Could not save focus session.",
        });
    }
});

router.get("/stats", async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                error: "You must be logged in.",
            });
        }

        const sessions = await FocusSession.find({ userId }).sort({ createdAt: 1 });

        const stats = {
            startedSessions: 0,
            completedSessions: 0,

            // keep these names for your existing frontend
            sessions: 0,
            seconds: 0,

            daily: {},
            dailySessions: {},
            dailyCompletedSessions: {},

            maxSessionSeconds: 0,
        };

        sessions.forEach((session) => {
            const key = getDateKey(session.createdAt);
            const seconds = Number(session.seconds || 0);

            const isCompleted =
                session.completed === true ||
                seconds >= (session.duration || FULL_SESSION_SECONDS);

            stats.startedSessions += 1;
            stats.seconds += seconds;

            stats.daily[key] = Number(stats.daily[key] || 0) + seconds;

            if (seconds > stats.maxSessionSeconds) {
                stats.maxSessionSeconds = seconds;
            }

            if (isCompleted) {
                stats.completedSessions += 1;

                stats.dailyCompletedSessions[key] =
                    Number(stats.dailyCompletedSessions[key] || 0) + 1;

                /*
                    IMPORTANT:
                    These are now completed sessions only.
                    So old UI using stats.sessions or stats.dailySessions
                    will no longer count unfinished sessions.
                */
                stats.sessions += 1;
                stats.dailySessions[key] = Number(stats.dailySessions[key] || 0) + 1;
            }
        });

        res.json(stats);
    } catch (error) {
        console.error("GET FOCUS STATS ERROR:", error);

        res.status(500).json({
            error: "Could not load focus stats.",
        });
    }
});

module.exports = router;