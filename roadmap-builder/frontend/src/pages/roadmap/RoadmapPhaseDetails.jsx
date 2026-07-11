import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircleCheck, faLock, faPlay, faClock } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import MaterialCard from "../../components/roadmap/MaterialCard";
import LoadingState from "../../components/states/LoadingState";
import ErrorState from "../../components/states/ErrorState";
import Card from "../../components/ui/Card";
import { useAuth } from "../../services/AuthContext";
import { roadmapService } from "../../services/roadmapService";

export default function RoadmapPhaseDetails() {
  const { phaseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    roadmapService
      .getForUser(user.id)
      .then(setRoadmap)
      .catch(() => setError(true));
  }, [user.id]);

  if (error) return <AppShell><ErrorState text="Could not load this phase." /></AppShell>;
  if (!roadmap) return <AppShell><LoadingState title="Loading phase..." /></AppShell>;

  const phase = roadmap.phases.find((p) => p._id === phaseId);
  if (!phase) return <AppShell><ErrorState text="This phase could not be found." /></AppShell>;

  const topics = phase.materials?.topics || [];
  const estimatedHours = phase.materials?.estimatedTime || "Flexible";

  const lessonProgress = phase.lessonProgress || [];
  function lessonStatus(i) {
    if (lessonProgress[i]) return "completed";
    if (phase.status === "locked") return "locked";
    if (i === 0 || lessonProgress[i - 1]) return "in-progress";
    return "locked";
  }
  const completedLessons = lessonProgress.filter(Boolean).length;


  const statusIcon = { completed: faCircleCheck, "in-progress": faPlay, locked: faLock };

  return (
    <AppShell>
      <Link to="/roadmap" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to roadmap
      </Link>

      <div className="page-header">
        <div className="breadcrumb"><span>{roadmap.goal}</span></div>
        <h1 className="page-title">{phase.title}</h1>
        <p className="page-sub">Status: {phase.status.replace("-", " ")} &middot; {completedLessons}/{topics.length} lessons complete</p>
      </div>

      {phase.materials?.explanation ? (
        <>
          {phase.status === "locked" && <Card style={{ marginBottom: 20, borderColor: "rgba(245,158,11,0.35)" }}>Complete the previous phase first. Phases are sequential so you always build skills in the right order.</Card>}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <Card>
              <div className="stat-card-icon" style={{ color: "var(--warning)", background: "rgba(245,158,11,0.12)" }}><FontAwesomeIcon icon={faClock} /></div>
              <div className="stat-label">Estimated Hours</div>
              <div className="stat-value" style={{ fontSize: 18 }}>{estimatedHours}</div>
            </Card>
            <Card>
              <div className="stat-card-icon"><FontAwesomeIcon icon={faCircleCheck} /></div>
              <div className="stat-label">Lessons</div>
              <div className="stat-value" style={{ fontSize: 18 }}>{topics.length}</div>
            </Card>
          </div>

          <MaterialCard materials={phase.materials} />

          <div className="material-section-title" style={{ marginTop: 28, marginBottom: 10 }}>Learning Outcomes</div>
          <Card style={{ marginBottom: 28 }}>
            <ul style={{ paddingLeft: 18, fontSize: 13, color: "var(--text2)", lineHeight: 1.9 }}>
              {topics.map((t, i) => (
                <li key={i}>Understand and apply {t.toLowerCase()}</li>
              ))}
            </ul>
          </Card>

          <div className="material-section-title" style={{ marginBottom: 12 }}>Lessons in this phase</div>
          <div className="materials-grid">
            {topics.map((topic, i) => {
              const status = lessonStatus(i);
              return (
                <Card
                  key={i}
                  style={{ cursor: status !== "locked" ? "pointer" : "default", opacity: status === "locked" ? 0.6 : 1 }}
                  onClick={() => status !== "locked" && navigate(`/roadmap/phase/${phase._id}/lesson/${i}`)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span className={`phase-node phase-node--${status}`} style={{ width: 28, height: 28, fontSize: 11 }}>
                      <FontAwesomeIcon icon={statusIcon[status]} />
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase" }}>Lesson {i + 1}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{topic}</div>
                  <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5, marginTop: 8 }}>{phase.materials?.lessonDetails?.[i]?.summary || phase.materials?.lessonDetails?.[i]?.overview || "A focused lesson in this phase."}</p>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>Estimated: {Math.round(((phase.materials?.lessonDetails?.[i]?.estimatedMinutes) || 60) / 60 * 10) / 10}h</div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <ErrorState
          title="No materials yet"
          text="Go back to the roadmap and select this tab to generate materials for it."
        />
      )}
    </AppShell>
  );
}
