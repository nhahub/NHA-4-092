import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLogo from "../../components/layout/AppLogo";
import { useAuth } from "../../services/AuthContext";
import Button from "../../components/ui/Button";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState("prefer-not-to-say");
  const [birthdate, setBirthdate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      navigate("/verify-email");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell fade-page">
      <div className="orb1" />
      <div className="orb2" />
      <div className="auth-card">
        <div className="auth-logo">
          <AppLogo />
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start your personalized, AI-guided learning roadmap.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              className="form-input"
              placeholder="Jane Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
            <div className="form-group">
                <label className="form-label">Gender</label>

                <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    required
                    className="form-input"
                >
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Birthdate</label>
                <input
                    className="form-input"
                    type="date"
                    value={birthdate}
                    max="2021-12-31"
                    onChange={(event) => setBirthdate(event.target.value)}
                    required
                />
            </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" block disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
