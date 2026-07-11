import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoad, faEnvelopeOpenText } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import { useAuth } from "../../services/AuthContext";

function getToken() {
    return localStorage.getItem("rb_token") || localStorage.getItem("token");
}

async function readResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    return JSON.parse(text);
}

export default function VerifyEmail() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [code, setCode] = useState("");
    const [devCode, setDevCode] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        createVerificationCode();
    }, []);

    async function createVerificationCode() {
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || "Could not create verification code.");
            }

            if (data.alreadyVerified) {
                navigate("/verification-success");
                return;
            }

            setDevCode(data.verificationCode || "");
            setMessage("Verification code created.");
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleVerify(e) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ code }),
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || "Could not verify email.");
            }

            const savedUser = localStorage.getItem("rb_user") || localStorage.getItem("user");

            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                parsedUser.isVerified = true;

                if (localStorage.getItem("rb_user")) {
                    localStorage.setItem("rb_user", JSON.stringify(parsedUser));
                }

                if (localStorage.getItem("user")) {
                    localStorage.setItem("user", JSON.stringify(parsedUser));
                }
            }

            navigate("/verification-success");
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
                    <div className="navbar-logo-icon">
                        <FontAwesomeIcon icon={faRoad} />
                    </div>

                    <span className="navbar-logo-text">RoadMap Builder</span>
                </div>

                <div className="state-block" style={{ padding: "12px 0 24px" }}>
                    <div className="state-icon">
                        <FontAwesomeIcon icon={faEnvelopeOpenText} />
                    </div>

                    <h1 className="auth-title" style={{ marginBottom: 0 }}>
                        Verify your email
                    </h1>

                    <p className="state-text">
                        Enter the verification code for{" "}
                        <strong>{user?.email || "your email"}</strong>.
                    </p>
                </div>

                {devCode && (
                    <div className="state-block" style={{ padding: "0 0 18px" }}>
                        <p className="state-text">Development verification code:</p>

                        <div
                            className="stat-value"
                            style={{ fontSize: 32, letterSpacing: 4 }}
                        >
                            {devCode}
                        </div>
                    </div>
                )}

                <form onSubmit={handleVerify}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="code">
                            Verification code
                        </label>

                        <input
                            id="code"
                            className="form-input"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>

                    {message && <p className="form-hint">{message}</p>}
                    {error && <p className="form-error">{error}</p>}

                    <Button type="submit" block disabled={loading}>
                        {loading ? "Verifying..." : "Verify email"}
                    </Button>
                </form>

                <p className="auth-footer">
                    Didn't get a code?{" "}
                    <button
                        type="button"
                        className="link-button"
                        onClick={createVerificationCode}
                        style={{
                            border: "none",
                            background: "none",
                            color: "var(--primary)",
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        Create new code
                    </button>
                </p>
            </div>
        </div>
    );
}