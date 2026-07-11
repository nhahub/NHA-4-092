import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faClock, faFlag, faLock, faPlay, faPlus, faTree, faBell, faFire } from "@fortawesome/free-solid-svg-icons";
import ProgressBar from "../../components/ui/ProgressBar";
import MaterialCard from "../../components/roadmap/MaterialCard";
import LoadingState from "../../components/states/LoadingState";
import ErrorState from "../../components/states/ErrorState";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../services/AuthContext";
import { roadmapService } from "../../services/roadmapService";
import { aiService } from "../../services/aiService";
import NoRoadmapEmptyState from "./NoRoadmapEmptyState";

const statusLabel = { completed: "Completed", "in-progress": "In progress", locked: "Locked" };

// Roadmaps are now keyed by goal + category + skillLevel, so the same goal can
// have several roadmaps. Rebuild the readable category label for display.
function formatCategory(category, goal) {
  if (category === "career-path") return `${goal} Career Path`;
  if (category === "portfolio-projects") return `${goal} Portfolio Projects`;
  return `Learn ${goal}`;
}

export default function RoadmapTimeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [allRoadmaps, setAllRoadmaps] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [roadmapError, setRoadmapError] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState(null);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState(false);
  // Guards against React StrictMode double-invoking this effect and
  // firing off two identical "load the roadmap" requests on mount.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadRoadmap();
  }, []);

  async function loadRoadmap() {
    setLoadingRoadmap(true);
    setRoadmapError(false);
    try {
      const [data, list] = await Promise.all([roadmapService.getForUser(user.id), roadmapService.getAllForUser(user.id).catch(() => [])]);
      setRoadmap(data);
      setAllRoadmaps(list);
      const current = data.phases.find((p) => p.status === "in-progress") || data.phases[0];
      if (current) setActivePhaseId(current._id);
    } catch {
      setRoadmapError("not-found");
    } finally {
      setLoadingRoadmap(false);
    }
  }

  const activePhase = roadmap?.phases.find((p) => p._id === activePhaseId);
  const completedLessons = roadmap?.phases.reduce((sum, p) => sum + (p.lessonProgress || []).filter(Boolean).length, 0) || 0;
  const totalLessons = roadmap?.phases.reduce((sum, p) => sum + (p.materials?.topics?.length || p.lessonProgress?.length || 10), 0) || 0;

  async function switchRoadmap(id) {
    const data = await roadmapService.activate(id);
    setRoadmap(data);
    setActivePhaseId(data.phases.find((p) => p.status === "in-progress")?._id || data.phases[0]?._id);
    loadRoadmap();
  }

  async function handleSelectPhase(phaseId) {
    const phase = roadmap.phases.find((p) => p._id === phaseId);
    setActivePhaseId(phaseId);
    if (phase.status === "locked") return;
    // Already generated and saved for this phase: reuse it, don't call the AI again.
    if (phase.materials?.explanation && phase.materials?.topics?.length >= 10) return;
    // A generation request is already in flight (e.g. from a fast double-click): skip.
    if (materialsLoading) return;

    setMaterialsLoading(true);
    setMaterialsError(false);
    try {
      const { materials } = await aiService.getMaterials(phase.title, roadmap.skillLevel);
      const updated = await roadmapService.updatePhase(roadmap._id, phaseId, { materials });
      setRoadmap(updated);
    } catch {
      setMaterialsError(true);
    } finally {
      setMaterialsLoading(false);
    }
  }

  async function saveStreak() {
    const updated = await roadmapService.saveStreak(roadmap._id);
    setRoadmap(updated);
  }

  if (loadingRoadmap) return <AppShell><LoadingState title="Loading your roadmap..." text="Just a moment." /></AppShell>;
  if (roadmapError) return <NoRoadmapEmptyState />;

  const completedCount = roadmap.phases.filter((p) => p.status === "completed").length;
  const percent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : Math.round((completedCount / roadmap.phases.length) * 100);
  const remaining = roadmap.phases.length - completedCount;
  const unread = roadmap.notifications?.filter((n) => !n.read).length || 0;

  return (
    <AppShell>
      <div className="page-header">
        <div className="breadcrumb"><span>Roadmap</span></div>
        <h1 className="page-title">Your Learning Roadmap</h1>
        <p className="page-sub">{formatCategory(roadmap.category, roadmap.goal)} &middot; {roadmap.skillLevel} level &middot; {roadmap.weeklyHours} hrs/week</p>
      </div>

      <Card className="roadmap-switcher">
        <div>
          <div className="material-section-title">My roadmaps</div>
          <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Create and switch between multiple active learning plans.</p>
        </div>
        <select className="form-input" style={{ maxWidth: 260 }} value={roadmap._id} onChange={(e) => switchRoadmap(e.target.value)}>
          {allRoadmaps.map((r) => <option value={r._id} key={r._id}>{formatCategory(r.category, r.goal)} · {r.skillLevel} · {new Date(r.createdAt).toLocaleDateString()}</option>)}
        </select>
        <Link to="/onboarding/goal"><Button icon={<FontAwesomeIcon icon={faPlus} />}>New roadmap</Button></Link>
      </Card>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <Card><div className="stat-card-icon"><FontAwesomeIcon icon={faFlag} /></div><div className="stat-label">Overall Progress</div><div className="stat-value">{percent}%</div></Card>
        <Card><div className="stat-card-icon" style={{ color: "var(--success)", background: "rgba(34,197,94,0.12)" }}><FontAwesomeIcon icon={faCircleCheck} /></div><div className="stat-label">Lessons Completed</div><div className="stat-value">{completedLessons}/{totalLessons}</div></Card>
        <Card><div className="stat-card-icon" style={{ color: "var(--warning)", background: "rgba(245,158,11,0.12)" }}><FontAwesomeIcon icon={faClock} /></div><div className="stat-label">Remaining</div><div className="stat-value">{remaining} phase{remaining === 1 ? "" : "s"}</div></Card>
        <Card><div className="stat-card-icon" style={{ color: "var(--danger)", background: "rgba(239,68,68,0.12)" }}><FontAwesomeIcon icon={faBell} /></div><div className="stat-label">Notifications</div><div className="stat-value">{unread}</div></Card>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--text2)" }}><span>Roadmap progress</span><span style={{ fontWeight: 700 }}>{percent}%</span></div>
        <ProgressBar percent={percent} />
      </div>

      <div className="roadmap-grid">
        <Card className="roadmap-tree-card">
          <div className="material-section-title" style={{ marginBottom: 14 }}><FontAwesomeIcon icon={faTree} /> Visual roadmap</div>
          <div className="roadmap-tree">
            {roadmap.phases.map((p, i) => {
              const progress = p.lessonProgress || [];
              const lessonPercent = progress.length ? Math.round((progress.filter(Boolean).length / progress.length) * 100) : 0;
              return (
                <button key={p._id} className={`tree-node ${p.status} ${activePhaseId === p._id ? "active" : ""}`} onClick={() => handleSelectPhase(p._id)}>
                  <span className="tree-marker"><FontAwesomeIcon icon={p.status === "completed" ? faCircleCheck : p.status === "locked" ? faLock : faPlay} /></span>
                  <span className="tree-content"><strong>Phase {i + 1}: {p.title}</strong><small>{statusLabel[p.status]} · {lessonPercent}% lessons</small></span>
                </button>
              );
            })}
          </div>
        </Card>

        <div>
          {activePhase && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span className={`badge badge-${activePhase.status === "completed" ? "beginner" : activePhase.status === "in-progress" ? "intermediate" : "advanced"}`}>{statusLabel[activePhase.status]}</span>
            <Button variant="secondary" onClick={saveStreak} icon={<FontAwesomeIcon icon={faFire} />}>Save daily streak</Button>
          </div>}

          {activePhase?.status === "locked" && <ErrorState title="Locked phase" text="Finish all lessons in the previous phase to unlock this phase." />}
          {materialsLoading && <LoadingState />}
          {!materialsLoading && materialsError && <ErrorState text="We couldn't generate materials for this phase." onRetry={() => handleSelectPhase(activePhaseId)} />}
          {!materialsLoading && !materialsError && activePhase && activePhase.status !== "locked" && (
            <>
              {activePhase.materials?.explanation ? <MaterialCard materials={activePhase.materials} /> : <LoadingState title="Preparing suggestions" text="Select an unlocked phase to generate 10 lessons and resources." />}
              <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-secondary" onClick={() => navigate(`/roadmap/phase/${activePhase._id}`)}>View full phase details</button>
                <button className="btn btn-primary" onClick={() => navigate(`/roadmap/phase/${activePhase._id}/lesson/0`)} disabled={!activePhase.materials?.topics?.length}>{activePhase.lessonProgress?.some(Boolean) ? "Continue lessons" : "Start lessons"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
