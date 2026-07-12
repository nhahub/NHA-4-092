const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        seconds: {
            type: Number,
            required: true,
            min: 1,
        },

        // How long the session was set to run for (25/30/45/50 min presets, in seconds).
        // Defaults to the classic 25-minute session for records saved before this existed.
        duration: {
            type: Number,
            default: 25 * 60,
            min: 1,
        },

        completed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("FocusSession", focusSessionSchema);