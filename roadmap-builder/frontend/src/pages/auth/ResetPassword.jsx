import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoad } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import AppLogo from "../../components/layout/AppLogo.jsx";

async function readResponse(response) {
    const text = await response.text();
    if (!text) return {};
    return JSON.parse(text);
}

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    const emailFromState = location.state?.email || "";
    const codeFromState = location.state?.code || "";

    const emailFromStorage = sessionStorage.getItem("rb_reset_email") || "";
    const codeFromStorage = sessionStorage.getItem("rb_reset_code") || "";

    const [form, setForm] = useState({
        email: emailFromState || emailFromStorage,
        code: codeFromState || codeFromStorage,
        password: "",
        confirm: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");

        if (!form.email.trim()) {
            setError("Please enter the account email.");
            return;
        }

        if (!form.code.trim()) {
            setError("Please enter the reset code.");
            return;
        }

        if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (form.password !== form.confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: form.email.trim().toLowerCase(),
                    code: form.code.trim(),
                    password: form.password,
                }),
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || "Could not reset password.");
            }

            sessionStorage.removeItem("rb_reset_email");
            sessionStorage.removeItem("rb_reset_code");

            navigate("/login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-shell">
            <div className="orb1" />
            <div className="orb2" />

            <div className="auth-card">
                <div className="auth-logo">

                        <AppLogo>
                        </AppLogo>


                </div>

                <h1 className="auth-title">Set a new password</h1>

                <p className="auth-sub">
                    Enter your email, reset code, and new password.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            Account email
                        </label>

                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="code">
                            Reset code
                        </label>

                        <input
                            id="code"
                            className="form-input"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            New password
                        </label>

                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirm">
                            Confirm password
                        </label>

                        <input
                            id="confirm"
                            type="password"
                            className="form-input"
                            value={form.confirm}
                            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                            required
                        />
                    </div>

                    {error && <p className="form-error">{error}</p>}

                    <Button type="submit" block disabled={loading}>
                        {loading ? "Updating password..." : "Reset password"}
                    </Button>
                </form>

                <p className="auth-footer">
                    Need a new code? <Link to="/forgot-password">Start again</Link>
                </p>
            </div>
        </div>
    );
}