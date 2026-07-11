import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import OnboardingSummary from "../../components/onboarding/OnboardingSummary";

const options = [3, 5, 7, 10, 15];

export default function WeeklySchedule() {
  const navigate = useNavigate();
  const [hours, setHours] = useState(5);

  const handleContinue = () => {
    sessionStorage.setItem("onboarding_hours", String(hours));
    navigate("/onboarding/generating");
  };

  return (
    <div className="auth-shell">
      <div className="orb1" />
      <div className="orb2" />
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <OnboardingSummary step={2} />
        <div className="auth-card" style={{ maxWidth: 440 }}>
        <h1 className="auth-title">How much time can you commit weekly?</h1>
        <p className="auth-sub">We'll pace your roadmap to fit your schedule.</p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", margin: "20px 0" }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => setHours(opt)}
              className="btn"
              style={{
                background: hours === opt ? "var(--gradient-brand)" : "var(--surface)",
                border: "1px solid var(--border2)",
                color: hours === opt ? "#fff" : "var(--text)",
              }}
            >
              {opt} hrs/week
            </button>
          ))}
        </div>

        <Button block onClick={handleContinue}>
          Build my roadmap
        </Button>
        </div>
      </div>
    </div>
  );
}
