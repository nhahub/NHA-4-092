import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AppLogo from "../../components/layout/AppLogo";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";

export default function VerificationSuccess() {
  return (
    <div className="auth-shell">
      <div className="orb1" />
      <div className="orb2" />
      <div className="auth-card">
        <div className="auth-logo">
          <AppLogo />
        </div>

        <div className="state-block" style={{ padding: "12px 0 24px" }}>
          <div className="state-icon" style={{ color: "var(--success)", background: "rgba(34,197,94,0.12)" }}>
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>
          <h1 className="auth-title" style={{ marginBottom: 0 }}>Email verified</h1>
          <p className="state-text">Your account is ready. Let's build your first roadmap.</p>
        </div>

        <Link to="/onboarding/goal">
          <Button block>Get started</Button>
        </Link>
      </div>
    </div>
  );
}
