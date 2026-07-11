import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTrash,
    faTriangleExclamation,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Card from "../../components/ui/Card";

function getToken() {
    return localStorage.getItem("rb_token") || localStorage.getItem("token");
}

function clearProjectStorage() {
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
        if (key.startsWith("rb_") || key === "token" || key === "user") {
            localStorage.removeItem(key);
        }
    });

    sessionStorage.clear();
}

export default function DeleteAccountSection() {
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function deleteAccount() {
        setMessage("");

        if (!password) {
            setMessage("Please enter your password.");
            return;
        }

        if (confirmText !== "DELETE") {
            setMessage("Type DELETE to confirm account deletion.");
            return;
        }

        const token = getToken();

        if (!token) {
            setMessage("No login token found. Please log in again.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/delete-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    password,
                }),
            });

            const text = await response.text();

            let data = {};

            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(
                    "Backend route not found. Check /api/auth/delete-account and Vite proxy."
                );
            }

            if (!response.ok) {
                throw new Error(data.error || "Could not delete account.");
            }

            clearProjectStorage();
            window.location.replace("/signup");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    function closeModal() {
        setShowModal(false);
        setPassword("");
        setConfirmText("");
        setMessage("");
    }

    return (
        <>
            <Card
                style={{
                    marginTop: "2rem",
                    maxWidth: 640,
                    width: "100%",
                    border: "1px solid rgba(239, 68, 68, 0.28)",

                    background: "rgba(0, 0, 0, 0)",
                    boxShadow: "none",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 18,
                    }}
                >
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 2,
                        }}
                    >
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                    </div>

                    <div>
                        <div
                            className="material-section-title"
                            style={{
                                marginBottom: 8,
                                color: "#9f1239",
                            }}
                        >
                            Danger zone
                        </div>

                        <p
                            style={{
                                fontSize: 14,
                                color: "var(--text2)",
                                lineHeight: 1.6,
                                marginBottom: 22,
                                maxWidth: 650,
                            }}
                        >
                            Deleting your account permanently removes your profile from the database.
                            This action cannot be undone.
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 9,
                                padding: "12px 18px",
                                borderRadius: 13,
                                border: "1px solid rgba(239, 68, 68, 0.28)",
                                background: "rgba(0, 0, 0, 0)",
                                color: "#ef4444",
                                fontWeight: 800,
                                cursor: "pointer",
                            }}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                            Delete account
                        </button>
                    </div>
                </div>
            </Card>

            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(15, 15, 25, 0.56)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 560,
                            background: "var(--bg2)",
                            border: "1px solid var(--border)",
                            borderRadius: 24,
                            padding: 28,
                            boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 14,
                                alignItems: "flex-start",
                                marginBottom: 18,
                            }}
                        >
                            <div>
                                <h2
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 800,
                                        margin: "0 0 8px",
                                        color: "var(--text)",
                                    }}
                                >
                                    Delete your account?
                                </h2>

                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        color: "var(--text2)",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Enter your password and type DELETE to confirm.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 12,
                                    border: "1px solid var(--border)",
                                    background: "var(--surface)",
                                    color: "var(--text2)",
                                    cursor: "pointer",
                                }}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Current password</label>

                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Type DELETE to confirm</label>

                            <input
                                className="form-input"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="DELETE"
                            />
                        </div>

                        {message && <p className="form-error">{message}</p>}

                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                justifyContent: "flex-end",
                                marginTop: 22,
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="button"
                                onClick={closeModal}
                                style={{
                                    padding: "11px 18px",
                                    borderRadius: 12,
                                    border: "1px solid var(--border)",
                                    background: "var(--surface)",
                                    color: "var(--text)",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteAccount}
                                disabled={loading}
                                style={{
                                    padding: "11px 18px",
                                    borderRadius: 12,
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                    background: "#ef4444",
                                    color: "white",
                                    fontWeight: 800,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading ? "Deleting..." : "Delete permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}