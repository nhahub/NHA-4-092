import { api } from "./api";

function makeResource(title, type = "Video", platform = "YouTube", description = "") {
    const searchQuery = title;

    return {
        title,
        type,
        platform,
        description,
        url:
            type === "Video"
                ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
                : `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        searchQuery,
    };
}

function localMaterials(topic, skillLevel = "Beginner") {
    const topics = Array.from(
        { length: 10 },
        (_, i) => `${topic} practice step ${i + 1}`
    );

    return {
        topics,
        explanation: `This phase focuses on ${topic}. It is personalized for a ${skillLevel} learner and builds toward practical confidence.`,
        difficulty: skillLevel,
        estimatedTime: "5-8 hours",
        resources: [
            makeResource(
                `${topic} full course`,
                "Tutorial",
                "Web",
                "A complete free walkthrough of this topic."
            ),
            makeResource(
                `${topic} beginner guide`,
                "Article",
                "Web",
                "A beginner-friendly written guide."
            ),
        ],
        lessonDetails: topics.map((title, i) => ({
            title,
            overview: `In this lesson, you will study ${title} with examples connected to real tasks.`,
            summary: `A focused, practical step inside ${topic}, with one clear concept and one useful output.`,
            estimatedMinutes: i % 3 === 2 ? 180 : 120,
            objectives: [
                `Understand the main idea behind ${title}`,
                `Apply it in a small exercise`,
                `Recognize common mistakes and how to fix them`,
            ],
            practice: `Create a mini output that proves you can use ${title}.`,
            skills: [topic],
            resources: [
                makeResource(
                    `${title} tutorial`,
                    "Video",
                    "YouTube",
                    "A hands-on video walkthrough."
                ),
                makeResource(
                    `${title} examples`,
                    "Article",
                    "Web",
                    "Written examples to reinforce the concept."
                ),
            ],
        })),
    };
}

function localLevelDescriptions(goal) {
    return {
        beginner: `A starting point for learning ${goal} from scratch, no prior experience needed.`,
        intermediate: `For learners who already know the fundamentals of ${goal} and want to go deeper.`,
        advanced: `For learners already comfortable with ${goal} who want expert-level depth.`,
    };
}

export const aiService = {
    async getMaterials(topic, skillLevel) {
        try {
            return await api.post("/ai/materials", { topic, skillLevel });
        } catch (error) {
            return {
                topic,
                materials: localMaterials(topic, skillLevel),
            };
        }
    },

    // extra: { category, knownSkills } — category keeps this roadmap's AI output
    // distinct per onboarding category, knownSkills tells the AI what the learner
    // already picked up from another skill level of this same goal/category.
    async generateRoadmapPhases(goal, skillLevel, weeklyHours, extra = {}, timeoutMs = 75000) {
        // Backend may walk through several API keys x several models on
        // failover (each with its own retry/backoff), which can take well
        // over 30s. Keep this comfortably above that worst case.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await api.post(
                "/ai/roadmap-phases",
                {
                    goal,
                    skillLevel,
                    weeklyHours,
                    category: extra.category,
                    knownSkills: extra.knownSkills,
                },
                { signal: controller.signal }
            );
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error(
                    "This is taking longer than expected. The AI service may be under heavy load — please try again in a moment."
                );
            }

            throw new Error(
                error.message ||
                "AI is exhausted because there is high demand. Please come back later."
            );
        } finally {
            clearTimeout(timeout);
        }
    },

    // Small, separate AI call used during onboarding so the learner can see
    // per-level "am I qualified?" blurbs before generating a roadmap.
    async getLevelDescriptions(goal, category) {
        try {
            return await api.post("/ai/level-descriptions", { goal, category });
        } catch (error) {
            return localLevelDescriptions(goal);
        }
    },
};