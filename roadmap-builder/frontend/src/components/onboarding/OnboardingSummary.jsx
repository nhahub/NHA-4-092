import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faGauge, faCalendarDays, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import Card from "../ui/Card";

export default function OnboardingSummary({ step }) {
  const goal = sessionStorage.getItem("onboarding_goal");
  const categoryLabel = sessionStorage.getItem("onboarding_category_label");
  const skill = sessionStorage.getItem("onboarding_skill");
  const hours = sessionStorage.getItem("onboarding_hours");

  const rows = [
    { label: "Goal", value: categoryLabel || goal, icon: faBullseye, filled: step > 0 },
    { label: "Experience", value: skill, icon: faGauge, filled: step > 1 },
    { label: "Schedule", value: hours ? `${hours} hrs/week` : null, icon: faCalendarDays, filled: step > 2 },
  ];

  return (
    <Card style={{ width: 220, flexShrink: 0 }}>
      <div className="material-section-title" style={{ marginBottom: 14 }}>Your Selections</div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <FontAwesomeIcon icon={r.icon} style={{ color: r.value ? "var(--primary)" : "var(--text3)", marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase" }}>{r.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: r.value ? "var(--text)" : "var(--text3)" }}>
              {r.value || `No ${r.label.toLowerCase()} selected yet`}
            </div>
          </div>
        </div>
      ))}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: "var(--primary)", fontSize: 12 }} />
        <span style={{ fontSize: 11, color: "var(--text2)" }}>Your personalized roadmap will be crafted from these</span>
      </div>
    </Card>
  );
}
