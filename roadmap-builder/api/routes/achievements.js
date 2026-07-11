const express = require("express");
const jwt = require("jsonwebtoken");
const UserAchievement = require("../models/UserAchievement");

const router = express.Router();

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

// GET /api/achievements
router.get("/", async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                error: "You must be logged in.",
            });
        }

        const achievements = await UserAchievement.find({ userId });

        const unlockedIds = achievements.map((item) => item.achievementId);

        res.json({
            unlockedIds,
        });
    } catch (error) {
        console.error("GET ACHIEVEMENTS ERROR:", error);

        res.status(500).json({
            error: "Could not load achievements.",
        });
    }
});

// POST /api/achievements/unlock
router.post("/unlock", async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                error: "You must be logged in.",
            });
        }

        const achievementIds = req.body.achievementIds || [];

        if (!Array.isArray(achievementIds)) {
            return res.status(400).json({
                error: "achievementIds must be an array.",
            });
        }

        for (const achievementId of achievementIds) {
            await UserAchievement.updateOne(
                { userId, achievementId },
                {
                    $setOnInsert: {
                        userId,
                        achievementId,
                        unlockedAt: new Date(),
                    },
                },
                { upsert: true }
            );
        }

        const achievements = await UserAchievement.find({ userId });

        res.json({
            unlockedIds: achievements.map((item) => item.achievementId),
        });
    } catch (error) {
        console.error("UNLOCK ACHIEVEMENTS ERROR:", error);

        res.status(500).json({
            error: "Could not unlock achievements.",
        });
    }
});

module.exports = router;