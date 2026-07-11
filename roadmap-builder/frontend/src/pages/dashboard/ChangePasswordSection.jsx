import { useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

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

export default function ChangePasswordSection() {
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
            setError("Please fill in all password fields.");
            return;
        }

        if (form.newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }

        if (form.newPassword !== form.confirmNewPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                }),
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || "Could not update password.");
            }

            setSuccess("Password updated successfully.");

            setForm({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <h2 className="section-title">Update Password</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Current password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={form.currentPassword}
                        onChange={(e) =>
                            setForm({ ...form, currentPassword: e.target.value })
                        }
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">New password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={form.newPassword}
                        onChange={(e) =>
                            setForm({ ...form, newPassword: e.target.value })
                        }
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Confirm new password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={form.confirmNewPassword}
                        onChange={(e) =>
                            setForm({ ...form, confirmNewPassword: e.target.value })
                        }
                    />
                </div>

                {error && <p className="form-error">{error}</p>}
                {success && <p className="form-success">{success}</p>}

                <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update password"}
                </Button>
            </form>
        </Card>
    );
}