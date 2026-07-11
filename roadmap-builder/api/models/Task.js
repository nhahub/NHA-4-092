const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        roadmap: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Roadmap",
        },

        phaseId: {
            type: mongoose.Schema.Types.ObjectId,
        },

        lessonIndex: {
            type: Number,
        },

        sourceLessonKey: {
            type: String,
            index: true,
        },

        weekKey: {
            type: String,
            index: true,
        },

        taskType: {
            type: String,
            enum: ["manual", "weekly-lesson"],
            default: "manual",
        },

        title: {
            type: String,
            required: true,
        },

        description: String,

        duration: {
            type: Number,
            default: 25,
        },

        completed: {
            type: Boolean,
            default: false,
        },

        completedAt: Date,

        status: {
            type: String,
            enum: ["todo", "in-progress", "done"],
            default: "todo",
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        category: {
            type: String,
            default: "Learning",
        },

        dueDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

taskSchema.index({
    user: 1,
    sourceLessonKey: 1,
    completed: 1,
});

taskSchema.index({
    user: 1,
    weekKey: 1,
    taskType: 1,
});

module.exports = mongoose.model("Task", taskSchema);