const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    type: String,
    source: String,
  },
  { _id: false }
);

const phaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["locked", "in-progress", "completed"], default: "locked" },
    lessonProgress: { type: [Boolean], default: [] },
    completedAt: Date,
    materials: {
      topics: [String],
      lessonDetails: [
        {
          title: String,
          overview: String,
          summary: String,
          estimatedMinutes: { type: Number, default: 60 },
          objectives: [String],
          practice: String,
          skills: [String],
          resources: [resourceSchema],
        },
      ],
      explanation: String,
      resources: [resourceSchema],
      difficulty: String,
      estimatedTime: String,
    },
  },
  { _id: true }
);

const notificationSchema = new mongoose.Schema(
  {
    title: String,
    message: String,
    type: { type: String, default: "info" },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goal: { type: String, required: true },
    // A goal can be approached from 3 different angles. This is independent
    // from skillLevel — e.g. "React" + "career-path" + "Intermediate" is a
    // different roadmap than "React" + "learn" + "Intermediate".
    category: {
      type: String,
      enum: ["learn", "career-path", "portfolio-projects"],
      default: "learn",
    },
    skillLevel: { type: String, default: "beginner" },
    // Short AI-generated blurb (per skill level) shown during onboarding so the
    // learner can judge whether they're qualified for this level before generating it.
    levelDescription: { type: String, default: "" },
    weeklyHours: { type: Number, default: 5 },
    phases: [phaseSchema],
    active: { type: Boolean, default: true },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStreakSavedAt: Date,
    notifications: [notificationSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
