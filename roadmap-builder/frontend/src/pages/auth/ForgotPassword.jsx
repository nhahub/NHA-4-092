import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoad, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import AppLogo from "../../components/layout/AppLogo.jsx";

async function readResponse(response) {
    const text = await response.text();
    if (!text) return {};
    return JSON.parse(text);
}

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [sent, setSent] = useState(false);
    const [cleanEmail, setCleanEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const finalEmail = email.trim().toLowerCase();

            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: finalEmail }),
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || "Could not create reset code.");
            }

            const code = data.resetCode || "";

            setCleanEmail(finalEmail);
            setResetCode(code);
            setSent(true);

            sessionStorage.setItem("rb_reset_email", finalEmail);
            sessionStorage.setItem("rb_reset_code", code);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function goToResetPassword() {
        navigate("/reset-password", {
            state: {
                email: cleanEmail,
                code: resetCode,
            },
        });
    }

    return (
        <div className="auth-shell">
            <div className="orb1" />
            <div className="orb2" />

            <div className="auth-card">
                <div className="auth-logo">
                    <AppLogo></AppLogo>
                </div>

                {!sent ? (
                    <>
                        <h1 className="auth-title">Reset your password</h1>

                        <p className="auth-sub">
                            Enter your email and we will create a reset code.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">
                                    Email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {error && <p className="form-error">{error}</p>}

                            <Button
                                type="submit"
                                block
                                disabled={loading}
                                icon={<FontAwesomeIcon icon={faPaperPlane} />}
                            >
                                {loading ? "Creating code..." : "Create reset code"}
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="auth-title">Reset code created</h1>

                        <p className="auth-sub">
                            Use this code to reset the password for{" "}
                            <strong>{cleanEmail}</strong>.
                        </p>

                        <div className="state-block" style={{ padding: "12px 0 20px" }}>
                            <div
                                className="stat-value"
                                style={{ fontSize: 32, letterSpacing: 4 }}
                            >
                                {resetCode}
                            </div>

                            <p className="state-text">This code expires in 15 minutes.</p>
                        </div>

                        <Button block onClick={goToResetPassword}>
                            Continue to reset password
                        </Button>
                    </>
                )}

                <p className="auth-footer">
                    Remembered your password? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}