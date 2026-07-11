import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

// Categories are separate from skill level: each one is its own angle on the
// same goal, and each can later be generated at any of the 3 skill levels.
const categoryOptions = (goal) => [
  { key: "learn", label: `Learn ${goal}` },
  { key: "career-path", label: `${goal} Career Path` },
  { key: "portfolio-projects", label: `${goal} Portfolio Projects` },
];

export default function GoalSearchResults() {
  const navigate = useNavigate();
  const goal = sessionStorage.getItem("onboarding_goal") || "Web Development";

  const handlePick = (category) => {
    // Keep the goal clean (e.g. "Web Development") and store the category
    // separately, instead of baking the category text into the goal itself.
    sessionStorage.setItem("onboarding_goal", goal);
    sessionStorage.setItem("onboarding_category", category.key);
    sessionStorage.setItem("onboarding_category_label", category.label);
    navigate("/onboarding/skill-level");
  };

  return (
    <div className="auth-shell">
      <div className="orb1" />
      <div className="orb2" />
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h1 className="auth-title">Results for "{goal}"</h1>
        <p className="auth-sub">Pick the closest match so we can tailor your roadmap.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {categoryOptions(goal).map((option) => (
            <Card
              key={option.key}
              onClick={() => handlePick(option)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{option.label}</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ color: "var(--text3)" }} />
            </Card>
          ))}
        </div>

        <Button
          block
          variant="secondary"
          style={{ marginTop: 20 }}
          onClick={() => handlePick({ key: "learn", label: goal })}
        >
          None of these — use "{goal}" as is
        </Button>
      </div>
    </div>
  );
}
