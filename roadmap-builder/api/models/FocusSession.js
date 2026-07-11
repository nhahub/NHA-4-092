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

        completed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("FocusSession", focusSessionSchema);