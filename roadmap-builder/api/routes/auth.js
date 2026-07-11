const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function signToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "dev-secret",
        { expiresIn: "7d" }
    );
}

function makeCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

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

function safeUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
    };
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, gender, birthdate } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Name, email and password are required.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters.",
            });
        }

        const cleanEmail = email.toLowerCase();

        const existing = await User.findOne({ email: cleanEmail });

        if (existing) {
            return res.status(409).json({
                error: "An account with this email already exists.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationCode = makeCode();

        const user = await User.create({
            name,
            email: cleanEmail,
            passwordHash,
            gender: gender || "prefer-not-to-say",
            birthdate: birthdate ? new Date(birthdate) : null,
            isVerified: false,
            verificationCode,
            verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
        });

        console.log("Verification code for", cleanEmail, "is:", verificationCode);

        const token = signToken(user);

        res.status(201).json({
            token,
            user: safeUser(user),

            // Beginner/dev mode only.
            // Since you do not want email APIs, we return the code here.
            verificationCode,
        });
    } catch (err) {
        console.error("SIGNUP ERROR:", err);

        res.status(500).json({
            error: "Could not create account. Please try again.",
        });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            email: (email || "").toLowerCase(),
        });

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password.",
            });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
            return res.status(401).json({
                error: "Invalid email or password.",
            });
        }

        const token = signToken(user);

        res.json({
            token,
            user: safeUser(user),
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);

        res.status(500).json({
            error: "Could not log in. Please try again.",
        });
    }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                error: "You must be logged in.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: "User not found.",
            });
        }

        if (user.isVerified) {
            return res.json({
                message: "Your email is already verified.",
                alreadyVerified: true,
            });
        }

        const verificationCode = makeCode();

        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

        await user.save();

        console.log("Verification code for", user.email, "is:", verificationCode);

        res.json({
            message: "Verification code created.",
            verificationCode,
        });
    } catch (err) {
        console.error("RESEND VERIFICATION ERROR:", err);

        res.status(500).json({
            error: "Could not create verification code.",
        });
    }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { code } = req.body;

        if (!userId) {
            return res.status(401).json({
                error: "You must be logged in.",
            });
        }

        if (!code) {
            return res.status(400).json({
                error: "Verification code is required.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: "User not found.",
            });
        }

        if (user.isVerified) {
            return res.json({
                message: "Email already verified.",
                user: safeUser(user),
            });
        }

        const codeExpired =
            !user.verificationCodeExpires ||
            user.verificationCodeExpires < new Date();

        if (
            codeExpired ||
            user.verificationCode !== code.trim()
        ) {
            return res.status(400).json({
                error: "Invalid or expired verification code.",
            });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;

        await user.save();

        res.json({
            message: "Email verified successfully.",
            user: safeUser(user),
        });
    } catch (err) {
        console.error("VERIFY EMAIL ERROR:", err);

        res.status(500).json({
            error: "Could not verify email.",
        });
    }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: "Email is required.",
            });
        }

        const cleanEmail = email.toLowerCase();

        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(404).json({
                error: "No account found with this email.",
            });
        }

        const resetCode = makeCode();

        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

        await user.save();

        console.log("Password reset code for", cleanEmail, "is:", resetCode);

        res.json({
            message: "Password reset code created.",
            resetCode,
        });
    } catch (err) {
        console.error("FORGOT PASSWORD ERROR:", err);

        res.status(500).json({
            error: "Could not start password reset.",
        });
    }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
    try {
        const { email, code, password } = req.body;

        if (!email || !code || !password) {
            return res.status(400).json({
                error: "Email, code and new password are required.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters.",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
        });

        if (!user) {
            return res.status(404).json({
                error: "No account found with this email.",
            });
        }

        const codeExpired =
            !user.resetPasswordExpires ||
            user.resetPasswordExpires < new Date();

        if (
            codeExpired ||
            user.resetPasswordCode !== code.trim()
        ) {
            return res.status(400).json({
                error: "Invalid or expired reset code.",
            });
        }

        user.passwordHash = await bcrypt.hash(password, 10);
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({
            message: "Password updated successfully.",
        });
    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err);

        res.status(500).json({
            error: "Could not reset password.",
        });
    }
});

// POST /api/auth/change-password
router.post("/change-password", async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { currentPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(401).json({
                error: "You must be logged in.",
            });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "Current password and new password are required.",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: "New password must be at least 8 characters.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: "User not found.",
            });
        }

        const currentPasswordIsCorrect = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!currentPasswordIsCorrect) {
            return res.status(400).json({
                error: "Current password is incorrect.",
            });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);

        await user.save();

        res.json({
            message: "Password changed successfully.",
        });
    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);

        res.status(500).json({
            error: "Could not change password.",
        });
    }
});

// POST /api/auth/delete-account
router.post("/delete-account", async (req, res) => {
    try {
        console.log("DELETE ACCOUNT ROUTE HIT");

        const userId = getUserIdFromRequest(req);
        const { password } = req.body;

        if (!userId) {
            return res.status(401).json({
                error: "You must be logged in.",
            });
        }

        if (!password) {
            return res.status(400).json({
                error: "Please enter your password.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: "User not found.",
            });
        }

        const passwordIsCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordIsCorrect) {
            return res.status(400).json({
                error: "Password is incorrect.",
            });
        }

        await User.deleteOne({ _id: user._id });

        console.log("DELETED USER:", user.email);

        res.json({
            message: "Account deleted successfully.",
        });
    } catch (err) {
        console.error("DELETE ACCOUNT ERROR:", err);

        res.status(500).json({
            error: "Could not delete account.",
        });
    }
});

module.exports = router;