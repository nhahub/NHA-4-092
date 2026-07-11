import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faKey, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../services/AuthContext";
import DeleteAccountSection from "./DeleteAccountSection";


function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("rb_theme", theme);
}

export default function AccountSettings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("rb_theme") || "dark");
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

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

    async function handlePasswordSubmit(e) {
        e.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        if (
            !passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            !passwordForm.confirmNewPassword
        ) {
            setPasswordError("Please fill in all password fields.");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setPasswordError("New password and confirm password do not match.");
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await readResponse(response);

            if (!response.ok) {
                throw new Error(data.error || "Could not update password.");
            }

            setPasswordSuccess("Password updated successfully.");

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
            });
        } catch (err) {
            setPasswordError(err.message);
        } finally {
            setPasswordLoading(false);
        }
    }

  useEffect(() => { applyTheme(theme); }, [theme]);

  function handlePassword(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function handleDelete() {
    logout();
    navigate("/login");
  }

  return (
    <AppShell>
      <div className="page-header">
        <div className="breadcrumb"><span>Settings</span></div>
        <h1 className="page-title">Website Settings</h1>
        <p className="page-sub">Manage password, light or dark mode, and account deletion.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
        <Card>
          <div className="material-section-title" style={{ marginBottom: 12 }}><FontAwesomeIcon icon={faKey} /> Change Password</div>
            <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                    <label className="form-label">Current password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                            setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                            })
                        }
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">New password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                            setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                            })
                        }
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Confirm new password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={passwordForm.confirmNewPassword}
                        onChange={(e) =>
                            setPasswordForm({
                                ...passwordForm,
                                confirmNewPassword: e.target.value,
                            })
                        }
                    />
                </div>

                {passwordError && <p className="form-error">{passwordError}</p>}
                {passwordSuccess && <p className="form-success">{passwordSuccess}</p>}

                <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? "Updating..." : "Update password"}
                </Button>
            </form>
        </Card>

        <Card>
          <div className="material-section-title" style={{ marginBottom: 14 }}>Theme</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setTheme("light")} className={`theme-choice${theme === "light" ? " active" : ""}`}>
              <FontAwesomeIcon icon={faSun} />
              <span>Light Mode</span>
            </button>
            <button type="button" onClick={() => setTheme("dark")} className={`theme-choice${theme === "dark" ? " active" : ""}`}>
              <FontAwesomeIcon icon={faMoon} />
              <span>Dark Mode</span>
            </button>
          </div>
        </Card>


      </div>


        <DeleteAccountSection />
    </AppShell>
  );
}
