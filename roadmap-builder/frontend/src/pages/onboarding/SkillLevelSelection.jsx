import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSeedling, faFire, faMountain, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import OnboardingSummary from "../../components/onboarding/OnboardingSummary";
import { useAuth } from "../../services/AuthContext";
import { roadmapService } from "../../services/roadmapService";
import { aiService } from "../../services/aiService";

const levels = [
  { id: "Beginner", key: "beginner", icon: faSeedling, fallback: "New to this topic, starting from scratch." },
  { id: "Intermediate", key: "intermediate", icon: faFire, fallback: "I know the basics and want to go deeper." },
  { id: "Advanced", key: "advanced", icon: faMountain, fallback: "I'm comfortable and want expert-level content." },
];

function cleanGoal(goal) {
  return String(goal || "").trim().toLowerCase();
}

export default function SkillLevelSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goal = sessionStorage.getItem("onboarding_goal") || "Web Development";
  const category = sessionStorage.getItem("onboarding_category") || "learn";
  const categoryLabel = sessionStorage.getItem("onboarding_category_label") || goal;

  const [selected, setSelected] = useState("Beginner");
  // AI-generated "is this level for me?" blurbs, keyed by level (beginner/intermediate/advanced).
  const [descriptions, setDescriptions] = useState({});
  const [descriptionsLoading, setDescriptionsLoading] = useState(true);
  // Skill levels already generated for this exact goal + category combo.
  const [generatedLevels, setGeneratedLevels] = useState([]);

  useEffect(() => {
    let cancelled = false;

    aiService
      .getLevelDescriptions(goal, categoryLabel)
      .then((data) => {
        if (!cancelled) setDescriptions(data || {});
      })
      .finally(() => {
        if (!cancelled) setDescriptionsLoading(false);
      });

    if (user?.id) {
      roadmapService
        .getAllForUser(user.id)
        .then((roadmaps) => {
          if (cancelled) return;

          const matches = (roadmaps || [])
            .filter(
              (r) =>
                cleanGoal(r.goal) === cleanGoal(goal) &&
                (r.category || "learn") === category
            )
            .map((r) => String(r.skillLevel || "").toLowerCase());

          setGeneratedLevels(matches);

          const firstOpenLevel = levels.find((l) => !matches.includes(l.key));
          if (firstOpenLevel) setSelected(firstOpenLevel.id);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAlreadyGenerated = generatedLevels.includes(selected.toLowerCase());

  const handleContinue = () => {
    if (selectedAlreadyGenerated) return;
    sessionStorage.setItem("onboarding_skill", selected);
    navigate("/onboarding/schedule");
  };

  return (
    <div className="auth-shell">
      <div className="orb1" />
      <div className="orb2" />
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <OnboardingSummary step={1} />
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <h1 className="auth-title">What's your current skill level?</h1>
          <p className="auth-sub">
            This helps the AI pitch materials at the right level for "{categoryLabel}".
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {levels.map((level) => {
              const done = generatedLevels.includes(level.key);
              const description = descriptionsLoading
                ? "Checking what this level covers..."
                : descriptions[level.key] || level.fallback;

              return (
                <Card
                  key={level.id}
                  onClick={() => {
                    if (!done) setSelected(level.id);
                  }}
                  style={{
                    cursor: done ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    opacity: done ? 0.5 : 1,
                    borderColor: selected === level.id ? "var(--primary)" : undefined,
                  }}
                >
                  <div className="navbar-logo-icon">
                    <FontAwesomeIcon icon={level.icon} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                      {level.id}
                      {done && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "var(--success)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <FontAwesomeIcon icon={faCircleCheck} />
                          Already generated
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>{description}</div>
                  </div>
                </Card>
              );
            })}
          </div>

          {selectedAlreadyGenerated && (
            <p className="form-error">
              You already generated the {selected} roadmap for "{categoryLabel}". Pick a different level.
            </p>
          )}

          <Button
            block
            style={{ marginTop: 20 }}
            disabled={selectedAlreadyGenerated}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
