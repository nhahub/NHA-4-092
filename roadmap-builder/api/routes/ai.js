const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

function getApiKeys() {
    const keys = [];

    if (process.env.GEMINI_API_KEY) {
        keys.push(process.env.GEMINI_API_KEY);
    }

    if (process.env.GEMINI_API_KEYS) {
        keys.push(...process.env.GEMINI_API_KEYS.split(","));
    }

    return [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
}

function getModels() {
    const models = [];

    if (process.env.GEMINI_MODEL) {
        models.push(process.env.GEMINI_MODEL);
    }

    if (process.env.GEMINI_FALLBACK_MODELS) {
        models.push(...process.env.GEMINI_FALLBACK_MODELS.split(","));
    }

    models.push(
        "gemini-flash-latest",   // currently resolves to gemini-3.5-flash
        "gemini-2.5-flash-lite"  // lighter fallback — verify it's live on your keys
    );

    return [...new Set(models.map((model) => model.trim()).filter(Boolean))];
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHighDemandError(err) {
    const message = String(err?.message || err || "").toLowerCase();

    return (
        message.includes("503") ||
        message.includes("unavailable") ||
        message.includes("high demand") ||
        message.includes("overloaded") ||
        message.includes("temporarily") ||
        message.includes("rate limit") ||
        message.includes("too many requests") ||
        message.includes("quota")
    );
}

function isModelNotFoundError(err) {
    const message = String(err?.message || err || "").toLowerCase();

    return (
        message.includes("404") ||
        message.includes("not_found") ||
        message.includes("not found") ||
        message.includes("is not supported")
    );
}

function isZeroQuotaError(err) {
    const message = String(err?.message || err || "");

    // RESOURCE_EXHAUSTED with an explicit "limit: 0" means this key/project
    // has no allotment at all for this model — retrying will never help.
    return (
        message.includes("RESOURCE_EXHAUSTED") &&
        /limit["']?\s*:\s*0\b/i.test(message)
    );
}

function isAuthError(err) {
    const message = String(err?.message || err || "").toLowerCase();

    return (
        message.includes("api key not valid") ||
        message.includes("api_key_invalid") ||
        message.includes("permission") ||
        message.includes("unauthorized") ||
        message.includes("401") ||
        message.includes("403")
    );
}

async function generateContentWithFallback(prompt) {
    const apiKeys = getApiKeys();
    const models = getModels();

    if (!apiKeys.length) {
        throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
    }

    let lastError = null;
    let hadHighDemandError = false;

    keyLoop:
        for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
            const apiKey = apiKeys[keyIndex];
            const ai = new GoogleGenAI({ apiKey });

            for (const model of models) {
                const maxAttempts = 2;

                for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
                    try {
                        console.log(
                            `Key #${keyIndex + 1}/${apiKeys.length}: trying model ${model}, attempt ${attempt}`
                        );

                        const response = await ai.models.generateContent({
                            model,
                            contents: prompt,
                        });

                        console.log(`Key #${keyIndex + 1}: model ${model} worked`);

                        return response;
                    } catch (err) {
                        lastError = err;

                        console.error(
                            `Key #${keyIndex + 1}: model ${model} failed:`,
                            err.message
                        );

                        if (isModelNotFoundError(err)) {
                            break; // try next model, same key
                        }

                        if (isZeroQuotaError(err)) {
                            console.error(
                                `Key #${keyIndex + 1}: zero quota for ${model}, skipping`
                            );
                            break; // never going to succeed, don't waste time retrying
                        }

                        if (isAuthError(err)) {
                            console.error(
                                `Key #${keyIndex + 1}: auth error, skipping remaining models for this key`
                            );
                            continue keyLoop; // jump straight to next key
                        }

                        if (isHighDemandError(err)) {
                            hadHighDemandError = true;

                            if (attempt < maxAttempts) {
                                await wait(1000);
                                continue;
                            }

                            break; // one retry only, then move to next model
                        }

                        break; // unknown/permanent error, try next model
                    }
                }
            }
        }

    console.error(
        `All ${apiKeys.length} key(s) x ${models.length} model(s) exhausted. Last error:`,
        lastError?.message
    );

    if (hadHighDemandError) {
        const error = new Error(
            "AI is exhausted because there is high demand. Please come back later."
        );

        error.statusCode = 503;
        throw error;
    }

    throw lastError || new Error("AI generation failed.");
}

function buildPrompt(topic, skillLevel) {
    return `Curriculum topic: "${topic}"
Learner level: ${skillLevel || "beginner"}

Create 10 sequential, non-repetitive lessons for this topic.

Rules:
- Lesson titles must be short and specific.
- Lesson titles must NOT be generic.
- Do NOT use titles like "Introduction", "Overview", "Basics", "Lesson 1", or "Advanced Topics".
- Lesson titles must NOT repeat the topic or skill level in every title.
- Each lesson must have a practical objective and practice task.
- Resources must be relevant to the exact lesson concept.
- If you know a real URL, include it.
- If you do not know a real URL, omit "url" and include "searchQuery".
- For searchQuery, use ONLY the exact lesson title plus one useful word like tutorial, guide, examples, or practice.
- Do NOT include the roadmap goal, phase title, learner goal, portfolio project name, or full plan in searchQuery.

Return ONLY valid JSON.
No markdown.
No code fences.
No extra text.

The JSON shape must be exactly:

{
  "topics": [
    "specific lesson title 1",
    "specific lesson title 2",
    "specific lesson title 3",
    "specific lesson title 4",
    "specific lesson title 5",
    "specific lesson title 6",
    "specific lesson title 7",
    "specific lesson title 8",
    "specific lesson title 9",
    "specific lesson title 10"
  ],
  "lessonDetails": [
    {
      "title": "same lesson title",
      "overview": "unique 2-3 sentence lesson explanation",
      "objectives": ["objective 1", "objective 2", "objective 3"],
      "practice": "small realistic practice task",
      "skills": ["skill tag 1", "skill tag 2"],
      "resources": [
        {
          "title": "specific resource name",
          "type": "Article",
          "platform": "Web",
          "description": "one short sentence",
          "url": "real URL if known",
          "searchQuery": "exact lesson title guide"
        },
        {
          "title": "specific YouTube resource",
          "type": "Video",
          "platform": "YouTube",
          "description": "one short sentence",
          "searchQuery": "exact lesson title tutorial"
        }
      ]
    }
  ],
  "explanation": "A phase-specific overview, not a constant template.",
  "resources": [
    {
      "title": "specific resource name",
      "type": "Tutorial",
      "platform": "Web",
      "description": "one short sentence",
      "searchQuery": "exact topic full course"
    }
  ],
  "difficulty": "Beginner",
  "estimatedTime": "5-7 hours"
}`;
}

function categoryContext(goal, category) {
    if (category === "career-path") {
        return `This roadmap is the "Career Path" track: prioritize the skills, tools, and portfolio signals employers expect for a job in "${goal}".`;
    }

    if (category === "portfolio-projects") {
        return `This roadmap is the "Portfolio Projects" track: prioritize hands-on, shippable projects that demonstrate "${goal}" skills to others.`;
    }

    return `This roadmap is the "Learn" track: prioritize a clear, ground-up understanding of "${goal}".`;
}

function knownSkillsContext(knownSkills) {
    const clean = Array.isArray(knownSkills)
        ? [...new Set(knownSkills.map((s) => String(s || "").trim()).filter(Boolean))].slice(0, 40)
        : [];

    if (!clean.length) return "";

    return `\nThe learner already generated a different skill level of this same goal/track and already knows these skills. Do NOT re-teach them — build on top of them instead:\n${clean.join(", ")}\n`;
}

function buildRoadmapPrompt(goal, skillLevel, weeklyHours, category, knownSkills) {
    return `Goal: "${goal}"
Learner level: ${skillLevel || "beginner"}
Study time: ~${weeklyHours || 5} hours/week
${categoryContext(goal, category)}
${knownSkillsContext(knownSkills)}
Create a specific, practical learning roadmap for this goal.

Rules:
- Generate 8 to 10 sequential phases.
- Each phase must have exactly 10 specific lessons.
- Each phase must build on the previous phase.
- The roadmap must move from foundations to portfolio/project-ready work.
- Phase titles must be short, specific, and related to the goal.
- Do NOT use generic phase titles like:
  "Orientation & Goal Map"
  "Core Foundations"
  "Essential Tools"
  "Guided Practice"
  "Real-World Workflows"
  "Projects & Feedback"
  "Advanced Patterns"
  "Portfolio Build"
  "Review & Optimization"
  "Next-Level Growth"
- Do NOT use generic lesson titles like:
  "Introduction"
  "Overview"
  "Basics"
  "Lesson 1"
  "Practice"
  "Advanced Topics"

Good example for Full-Stack Development:
- Phase title: "React Components and State"
- Lesson: "Handling Form Inputs in React"
- Lesson: "Connecting React Forms to Express APIs"
- Lesson: "Saving User Data with Mongoose"

Return ONLY valid JSON.
No markdown.
No code fences.
No extra text.

The JSON shape must be exactly:

{
  "phases": [
    {
      "title": "specific phase title",
      "description": "one sentence describing what this phase covers",
      "lessons": [
        "specific lesson 1",
        "specific lesson 2",
        "specific lesson 3",
        "specific lesson 4",
        "specific lesson 5",
        "specific lesson 6",
        "specific lesson 7",
        "specific lesson 8",
        "specific lesson 9",
        "specific lesson 10"
      ]
    }
  ]
}`;
}

function buildLevelDescriptionsPrompt(goal, category) {
    return `Goal: "${goal}"
Track: ${category || "learn"}

Write a short "is this level for me?" description for each of 3 skill levels
(beginner, intermediate, advanced) for a roadmap about this exact goal.

Rules:
- Each description is 1-2 sentences.
- Each description must name 2-4 concrete skills/concepts the learner should
  already have (for intermediate/advanced) or will start from (for beginner),
  so the learner can judge whether they qualify for that level.
- Be specific to "${goal}". Do NOT use generic filler like "some basic knowledge".
- Intermediate must assume the beginner skills are already known.
- Advanced must assume the intermediate skills are already known.

Return ONLY valid JSON.
No markdown.
No code fences.
No extra text.

The JSON shape must be exactly:
{
  "beginner": "short description",
  "intermediate": "short description",
  "advanced": "short description"
}`;
}

function extractJSON(rawText) {
    const cleaned = String(rawText || "").replace(/```json|```/g, "").trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
        throw new Error("No JSON found in AI response.");
    }

    return JSON.parse(cleaned.slice(start, end + 1));
}

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

function linkifyResource(resource, topic) {
    if (typeof resource !== "object" || resource === null) {
        resource = {
            title: "YouTube tutorial",
            type: "Video",
            platform: "YouTube",
            searchQuery: `${topic} tutorial`,
        };
    }

    const type =
        resource.type || (resource.source === "YouTube" ? "Video" : "Article");

    const platform =
        resource.platform ||
        resource.source ||
        (type === "Video" ? "YouTube" : "Web");

    const description = resource.description || "";

    const title =
        resource.title && !String(resource.title).toLowerCase().includes("search:")
            ? resource.title
            : platform === "YouTube"
                ? "YouTube tutorial"
                : "Web guide";

    if (resource.url) {
        return {
            title,
            type,
            platform,
            description,
            url: resource.url,
        };
    }

    const fallbackQuery =
        platform === "YouTube" || type === "Video"
            ? `${topic} tutorial`
            : `${topic} guide`;

    const query = cleanSearchQuery(resource.searchQuery || fallbackQuery, topic);

    const url =
        platform === "YouTube" || type === "Video"
            ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
            : `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    return {
        title,
        type,
        platform,
        description,
        url,
        searchQuery: query,
    };
}

function normalizeMaterials(materials, topic) {
    const topics = Array.isArray(materials.topics)
        ? materials.topics.slice(0, 10)
        : [];

    while (topics.length < 10) {
        topics.push(`${topic} practice step ${topics.length + 1}`);
    }

    const details = Array.isArray(materials.lessonDetails)
        ? materials.lessonDetails
        : [];

    materials.lessonDetails = topics.map((title, i) => {
        const d = details[i] || {};
        const cleanTitle = d.title || title;

        return {
            title: cleanTitle,
            overview:
                d.overview ||
                `This lesson focuses on ${cleanTitle}, with practical examples and a clear reason for why it matters.`,
            objectives:
                Array.isArray(d.objectives) && d.objectives.length
                    ? d.objectives.slice(0, 4)
                    : [
                        `Explain the main idea of ${cleanTitle}`,
                        `Apply ${cleanTitle} in a realistic exercise`,
                        `Identify common mistakes related to ${cleanTitle}`,
                    ],
            practice:
                d.practice ||
                `Create a small example or checklist that proves you can use ${cleanTitle}.`,
            skills: Array.isArray(d.skills) ? d.skills.slice(0, 4) : [cleanTitle],
            resources: (
                Array.isArray(d.resources) && d.resources.length
                    ? d.resources
                    : [
                        {
                            title: `${cleanTitle} tutorial`,
                            type: "Video",
                            platform: "YouTube",
                            searchQuery: `${cleanTitle} tutorial`,
                        },
                        {
                            title: `${cleanTitle} guide`,
                            type: "Article",
                            platform: "Web",
                            searchQuery: `${cleanTitle} guide`,
                        },
                    ]
            ).map((resource) => linkifyResource(resource, cleanTitle)),
        };
    });

    materials.topics = topics.map((topicTitle, i) => {
        return details[i]?.title || topicTitle;
    });

    materials.resources = (
        Array.isArray(materials.resources) && materials.resources.length
            ? materials.resources
            : [
                {
                    title: `${topic} full course`,
                    type: "Tutorial",
                    platform: "Web",
                    searchQuery: `${topic} full course`,
                },
                {
                    title: `${topic} beginner roadmap`,
                    type: "Article",
                    platform: "Web",
                    searchQuery: `${topic} beginner roadmap`,
                },
            ]
    ).map((resource) => linkifyResource(resource, topic));

    return materials;
}

function normalizeRoadmapPhases(parsed, goal) {
    const phases = Array.isArray(parsed.phases) ? parsed.phases : [];

    if (!phases.length) {
        throw new Error("AI did not return any phases.");
    }

    return phases.slice(0, 10).map((phase, index) => {
        const lessons = Array.isArray(phase.lessons)
            ? phase.lessons.slice(0, 10)
            : [];

        while (lessons.length < 10) {
            lessons.push(
                `${phase.title || goal} practical lesson ${lessons.length + 1}`
            );
        }

        return {
            title: phase.title || `${goal} Phase ${index + 1}`,
            description:
                phase.description || `A focused stage for learning ${goal}.`,
            lessons,
        };
    });
}

router.post("/materials", async (req, res) => {
    try {
        const { topic, skillLevel } = req.body;

        if (!topic) {
            return res.status(400).json({
                error: "A 'topic' is required to generate materials.",
            });
        }

        const prompt = buildPrompt(topic, skillLevel);

        const response = await generateContentWithFallback(prompt);
        const rawText = response.text;

        if (!rawText) {
            return res.status(502).json({
                error: "The AI returned an empty response. Please try again.",
            });
        }

        let materials;

        try {
            materials = extractJSON(rawText);
        } catch (parseErr) {
            console.error("Could not parse Gemini response:", rawText);

            return res.status(502).json({
                error: "The AI response could not be understood. Please try again.",
            });
        }

        res.json({
            topic,
            materials: normalizeMaterials(materials, topic),
        });
    } catch (err) {
        console.error("Gemini AI error:", err.message);

        if (
            err.message?.includes("API key not valid") ||
            err.message?.includes("API_KEY_INVALID")
        ) {
            return res.status(401).json({
                error:
                    "Your Gemini API key looks invalid. Check GEMINI_API_KEY in your .env file.",
            });
        }

        if (err.message?.includes("GEMINI_API_KEY is not set")) {
            return res.status(500).json({
                error: err.message,
            });
        }

        if (err.statusCode === 503 || isHighDemandError(err)) {
            return res.status(503).json({
                error:
                    "AI is exhausted because there is high demand. Please come back later.",
            });
        }

        res.status(500).json({
            error: "AI generation failed right now. Please try again in a moment.",
        });
    }
});

router.post("/roadmap-phases", async (req, res) => {
    try {
        const { goal, skillLevel, weeklyHours, category, knownSkills } = req.body;

        if (!goal) {
            return res.status(400).json({
                error: "A 'goal' is required to generate a roadmap.",
            });
        }

        const prompt = buildRoadmapPrompt(
            goal,
            skillLevel,
            weeklyHours,
            category,
            knownSkills
        );

        const response = await generateContentWithFallback(prompt);
        const rawText = response.text;

        if (!rawText) {
            return res.status(502).json({
                error: "The AI returned an empty response. Please try again.",
            });
        }

        let parsed;

        try {
            parsed = extractJSON(rawText);
        } catch (parseErr) {
            console.error("Could not parse Gemini roadmap response:", rawText);

            return res.status(502).json({
                error: "The AI response could not be understood. Please try again.",
            });
        }

        if (!Array.isArray(parsed.phases) || parsed.phases.length === 0) {
            return res.status(502).json({
                error: "The AI didn't return any phases. Please try again.",
            });
        }

        res.json({
            phases: normalizeRoadmapPhases(parsed, goal),
        });
    } catch (err) {
        console.error("Gemini roadmap generation error:", err.message);

        if (
            err.message?.includes("API key not valid") ||
            err.message?.includes("API_KEY_INVALID")
        ) {
            return res.status(401).json({
                error:
                    "Your Gemini API key looks invalid. Check GEMINI_API_KEY in your .env file.",
            });
        }

        if (err.statusCode === 503 || isHighDemandError(err)) {
            return res.status(503).json({
                error:
                    "AI is exhausted because there is high demand. Please come back later.",
            });
        }

        res.status(500).json({
            error: "AI roadmap generation failed. Please try again in a moment.",
        });
    }
});

// Small, separate AI call used only during onboarding so the learner can see,
// per skill level, whether they're actually qualified before generating it.
router.post("/level-descriptions", async (req, res) => {
    try {
        const { goal, category } = req.body;

        if (!goal) {
            return res.status(400).json({
                error: "A 'goal' is required to generate level descriptions.",
            });
        }

        const prompt = buildLevelDescriptionsPrompt(goal, category);

        const response = await generateContentWithFallback(prompt);
        const rawText = response.text;

        if (!rawText) {
            return res.status(502).json({
                error: "The AI returned an empty response. Please try again.",
            });
        }

        let parsed;

        try {
            parsed = extractJSON(rawText);
        } catch (parseErr) {
            console.error("Could not parse Gemini level-description response:", rawText);

            return res.status(502).json({
                error: "The AI response could not be understood. Please try again.",
            });
        }

        res.json({
            beginner:
                parsed.beginner ||
                `A starting point for learning ${goal} from scratch, no prior experience needed.`,
            intermediate:
                parsed.intermediate ||
                `For learners who already know the fundamentals of ${goal} and want to go deeper.`,
            advanced:
                parsed.advanced ||
                `For learners already comfortable with ${goal} who want expert-level depth.`,
        });
    } catch (err) {
        console.error("Gemini level-description error:", err.message);

        if (err.statusCode === 503 || isHighDemandError(err)) {
            return res.status(503).json({
                error:
                    "AI is exhausted because there is high demand. Please come back later.",
            });
        }

        res.status(500).json({
            error: "Could not generate level descriptions right now.",
        });
    }
});

module.exports = router;