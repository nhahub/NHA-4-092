import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLogo from "../../components/layout/AppLogo";
import { useAuth } from "../../services/AuthContext";
import Button from "../../components/ui/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/roadmap");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell ">
      <div className="orb1" />
      <div className="orb2" />
      <div className="auth-card">
        <div className="auth-logo">
          <AppLogo />
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Log in to keep building your learning roadmap.</p>

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <div className="form-hint">
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" block disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
