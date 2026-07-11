import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../../components/states/LoadingState";
import ErrorState from "../../components/states/ErrorState";
import { roadmapService } from "../../services/roadmapService";
import { aiService } from "../../services/aiService";
import { useAuth } from "../../services/AuthContext";

function cleanGoal(goal) {
  return String(goal || "").trim().toLowerCase();
}

// Pulls the skill tags/topics out of any roadmap(s) the learner already
// generated for this same goal + category, at a different skill level, so
// the AI can build on top of them instead of re-teaching the same ground.
function collectKnownSkills(roadmaps, goal, category) {
  const skills = new Set();

  (roadmaps || [])
    .filter(
      (r) =>
        cleanGoal(r.goal) === cleanGoal(goal) &&
        (r.category || "learn") === category
    )
    .forEach((r) => {
      (r.phases || []).forEach((phase) => {
        (phase.materials?.lessonDetails || []).forEach((lesson) => {
          (lesson.skills || []).forEach((skill) => skills.add(skill));
        });
        (phase.materials?.topics || []).forEach((topic) => skills.add(topic));
      });
    });

  return Array.from(skills);
}

export default function AIGeneration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [duplicate, setDuplicate] = useState(false);
  // Guards against React StrictMode (and any other double-mount) firing
  // this effect twice, which would otherwise call the AI twice and create
  // two roadmaps for a single "Build my roadmap" click.
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setError(null);
    setDuplicate(false);

    const goal = sessionStorage.getItem("onboarding_goal") || "Web Development";
    const skillLevel = sessionStorage.getItem("onboarding_skill") || "Beginner";
    const category = sessionStorage.getItem("onboarding_category") || "learn";
    const weeklyHours = Number(sessionStorage.getItem("onboarding_hours")) || 5;

    try {
      // Step 1: check first. A cheap DB lookup beats spending an AI call
      // generating a roadmap (same goal + category + skill level) that
      // already exists.
      const check = await roadmapService.checkExists(user?.id, {
        goal,
        category,
        skillLevel,
      });

      if (check?.exists) {
        hasStartedRef.current = false;
        setDuplicate(true);
        setError(
          `You already generated the ${skillLevel} roadmap for this goal. Pick a different skill level to continue.`
        );
        return;
      }

      // Step 2: gather skills already learned from any other skill level of
      // this same goal + category, so the AI builds on top instead of
      // repeating what's already known.
      const priorRoadmaps = await roadmapService.getAllForUser(user?.id).catch(() => []);
      const knownSkills = collectKnownSkills(priorRoadmaps, goal, category);

      // Step 3: try to generate — design the roadmap phases for this goal.
      const { phases } = await aiService.generateRoadmapPhases(goal, skillLevel, weeklyHours, {
        category,
        knownSkills,
      });

      // Step 4: save the roadmap (with AI-designed phases) to MongoDB.
      // Multiple roadmaps are allowed; the newly created one becomes active.
      const roadmap = await roadmapService.create({
        userId: user?.id,
        goal,
        category,
        skillLevel,
        weeklyHours,
        phases,
      });

      localStorage.setItem("rb_roadmap_id", roadmap._id);
      localStorage.setItem("rb_generated_count", String(Number(localStorage.getItem("rb_generated_count") || 0) + 1));
      navigate("/roadmap");
    } catch (err) {
      // Allow a manual retry (via the "Try again" button) to run again.
      hasStartedRef.current = false;
      setError(err.message || "Something went wrong while generating your roadmap.");
    }
  }

  return (
    <div className="auth-shell">
      <div className="orb1" />
      <div className="orb2" />
      <div className="auth-card" style={{ maxWidth: 480 }}>
        {error ? (
          <ErrorState
            title={duplicate ? "Already generated" : "We couldn't build your roadmap"}
            text={error}
            retryLabel={duplicate ? "Choose a different level" : "Try again"}
            onRetry={duplicate ? () => navigate("/onboarding/skill-level") : generate}
          />
        ) : (
          <LoadingState
            title="Building your roadmap..."
            text="Mapping your next learning adventure, based on your goal."
          />
        )}
      </div>
    </div>
  );
}
