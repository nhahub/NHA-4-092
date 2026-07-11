import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faBolt, faFire, faCode } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/states/LoadingState";
import { useAuth } from "../../services/AuthContext";
import { roadmapService } from "../../services/roadmapService";

const badges = [
  { label: "Speed Learner", icon: faBolt },
  { label: "Roadmap Champion", icon: faTrophy },
  { label: "Streak Legend", icon: faFire },
  { label: "React Architect", icon: faCode },
];

export default function CompletedRoadmap() {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    roadmapService.getForUser(user.id).then(setRoadmap).catch(() => {});
  }, [user.id]);

  if (!roadmap) return <AppShell><LoadingState title="Loading your certificate..." /></AppShell>;

  const completionDate = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const totalLessons = roadmap.phases.reduce((sum, p) => sum + (p.materials?.topics?.length || 0), 0);
  const totalHours = roadmap.weeklyHours * roadmap.phases.length;

  return (
    <AppShell>
      <div className="state-block" style={{ paddingTop: 20, paddingBottom: 10 }}>
        <div className="state-icon" style={{ width: 72, height: 72, fontSize: 30, color: "var(--warning)", background: "rgba(245,158,11,0.12)" }}>
          <FontAwesomeIcon icon={faTrophy} />
        </div>
        <h1 className="page-title" style={{ marginTop: 8 }}>Roadmap complete!</h1>
        <p className="state-text">You've finished every phase. That's real, consistent progress.</p>
      </div>

      <Card style={{ maxWidth: 560, margin: "0 auto 24px", textAlign: "center", padding: 40, border: "1px solid var(--border2)" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--text3)", marginBottom: 16 }}>
          Certificate of Completion
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)" }}>This certificate verifies that</div>
        <div className="text-gradient" style={{ fontSize: 26, fontWeight: 800, margin: "10px 0" }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: "var(--text2)" }}>has successfully completed the</div>
        <div style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 16px" }}>{roadmap.goal} Roadmap</div>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>Completion Date: {completionDate}</div>
      </Card>

      <div className="stat-grid" style={{ maxWidth: 560, margin: "0 auto 24px" }}>
        <Card>
          <div className="stat-label">Total Hours Learned</div>
          <div className="stat-value">{totalHours}h</div>
        </Card>
        <Card>
          <div className="stat-label">Lessons Completed</div>
          <div className="stat-value">{totalLessons}</div>
        </Card>
        <Card>
          <div className="stat-label">Achievement Score</div>
          <div className="stat-value">98</div>
        </Card>
      </div>

      <div className="material-section-title" style={{ textAlign: "center", marginBottom: 14 }}>Earned Badges</div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 30 }}>
        {badges.map((b) => (
          <Card key={b.label} style={{ width: 130, textAlign: "center", padding: 20 }}>
            <div className="navbar-logo-icon" style={{ margin: "0 auto 10px", width: 44, height: 44 }}>
              <FontAwesomeIcon icon={b.icon} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{b.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Link to="/achievements"><Button variant="secondary">View achievements</Button></Link>
        <Link to="/onboarding/goal"><Button>Start a new roadmap</Button></Link>
      </div>

    </AppShell>
  );
}
