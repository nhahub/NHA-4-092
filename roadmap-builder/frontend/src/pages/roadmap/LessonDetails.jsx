import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircleCheck, faLock, faFileLines, faVideo, faLink, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProgressBar from "../../components/ui/ProgressBar";
import LoadingState from "../../components/states/LoadingState";
import ErrorState from "../../components/states/ErrorState";
import { useAuth } from "../../services/AuthContext";
import { roadmapService } from "../../services/roadmapService";
import { recordLearnedMinutes } from "../../services/learningStats";

const resourceIcon = (resource) => (resource?.type === "Video" || resource?.platform?.toLowerCase().includes("youtube")) ? faVideo : resource?.url ? faLink : faFileLines;
const asResource = (r, topic) => {
  if (typeof r === "string") {
    return { title: r, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " " + r)}`, type: "Video", platform: "YouTube" };
  }
  // Older saved roadmaps used "source" instead of "platform" — support both.
  return { ...r, platform: r.platform || r.source };
};

export default function LessonDetails() {
  const { phaseId, lessonIndex } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    roadmapService.getForUser(user.id).then(setRoadmap).catch(() => {});
  }, [user.id]);

  if (!roadmap) return <AppShell><LoadingState title="Loading lesson..." /></AppShell>;

  const phase = roadmap.phases.find((p) => p._id === phaseId);
  if (!phase) return <AppShell><ErrorState text="This lesson could not be found." /></AppShell>;
  if (phase.status === "locked") return <AppShell><ErrorState title="Phase locked" text="Complete the previous phase before starting this one." /></AppShell>;

  const topics = phase?.materials?.topics || [];
  const index = Number(lessonIndex);
  const topic = topics[index];
  const detail = phase.materials?.lessonDetails?.[index] || {};
  const progress = phase.lessonProgress || [];
  const done = Boolean(progress[index]);
  const completedCount = progress.filter(Boolean).length;
  const isLast = index >= topics.length - 1;
  const phaseCompleteAfterThis = isLast && (done || completedCount + 1 >= topics.length);
  const phaseIndex = roadmap.phases.findIndex((p) => p._id === phaseId);
  const nextPhase = roadmap.phases[phaseIndex + 1];
  const resources = (detail.resources?.length ? detail.resources : phase.materials?.resources || []).map((r) => asResource(r, topic));

  const goToLesson = (i) => {
    if (i >= 0 && i < topics.length) navigate(`/roadmap/phase/${phaseId}/lesson/${i}`);
  };

  async function markComplete() {
    if (done || saving) return roadmap;
    setSaving(true);
    try {
      const updated = await roadmapService.completeLesson(roadmap._id, phaseId, index);
      recordLearnedMinutes(detail.estimatedMinutes || 60, user.id);
      setRoadmap(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    const latest = !done ? await markComplete() : roadmap;
    if (!isLast) return goToLesson(index + 1);
    const latestPhaseIndex = latest.phases.findIndex((p) => p._id === phaseId);
    const unlockedNext = latest.phases[latestPhaseIndex + 1];
    if (unlockedNext) navigate(`/roadmap/phase/${unlockedNext._id}`);
    else navigate("/roadmap/completed");
  }

  return (
    <AppShell>
      <Link to={`/roadmap/phase/${phaseId}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to phase
      </Link>

      <div className="page-header">
        <div className="breadcrumb"><span>{phase?.title}</span> &middot; Lesson {index + 1} of {topics.length}</div>
        <h1 className="page-title">{detail.title || topic || "Lesson"}</h1>
        <p className="page-sub">{detail.summary || detail.overview || `A focused lesson on ${topic}, tailored for ${roadmap.skillLevel} learners.`}</p>
      </div>

      <div className="lesson-layout">
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div className="material-section-title" style={{ marginBottom: 10 }}>About this lesson</div>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
              {detail.overview || phase?.materials?.explanation}
            </p>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text3)" }}>Estimated time: {Math.round((detail.estimatedMinutes || 60) / 60 * 10) / 10}h</div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div className="material-section-title" style={{ marginBottom: 10 }}>Lesson Summary</div>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
              {detail.summary || `This lesson gives you the main idea of ${topic}, why it matters, and what you should be able to do by the end.`}
            </p>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div className="material-section-title" style={{ marginBottom: 10 }}>Learning Objectives</div>
            <ul style={{ paddingLeft: 18, fontSize: 13, color: "var(--text2)", lineHeight: 1.9 }}>
              {(detail.objectives?.length ? detail.objectives : [`Understand ${topic}`, `Apply ${topic} in a small task`, `Avoid common mistakes in ${topic}`]).map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div className="material-section-title" style={{ marginBottom: 10 }}>Practice Task</div>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{detail.practice || `Create a short practice example for ${topic}.`}</p>
          </Card>

          <Card>
            <div className="material-section-title" style={{ marginBottom: 10 }}>Lesson Resources</div>
            {resources.map((r, i) => (
              <a className="resource-item resource-link" key={i} href={r.url} target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={resourceIcon(r)} />
                <span>
                  {r.title || r.url}
                  {r.description && <small style={{ display: "block", color: "var(--text3)", fontWeight: 400, marginTop: 2 }}>{r.description}</small>}
                </span>
                <span style={{ marginLeft: "auto", color: "var(--text3)", fontSize: 11 }}>{r.platform || "Web"}</span>
              </a>
            ))}
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
            <Button variant="secondary" onClick={() => goToLesson(index - 1)} disabled={index === 0}>Previous</Button>
            <Button variant={done ? "secondary" : "primary"} icon={<FontAwesomeIcon icon={faCircleCheck} />} onClick={markComplete} disabled={done || saving}>
              {done ? "Completed" : saving ? "Saving..." : "Mark complete"}
            </Button>
            <Button onClick={handleNext} icon={isLast ? <FontAwesomeIcon icon={faArrowRight} /> : undefined}>
              {isLast ? (nextPhase ? "Start next phase" : "Finish roadmap") : "Next"}
            </Button>
          </div>
          {phaseCompleteAfterThis && !done && <p style={{ fontSize: 12, color: "var(--success)", marginTop: 10 }}>Completing this lesson will complete the phase and unlock the next one.</p>}
        </div>

        <div>
          <Card>
            <div className="material-section-title" style={{ marginBottom: 10 }}>Lesson Queue</div>
            <div style={{ marginBottom: 12 }}>
              <ProgressBar percent={(completedCount / topics.length) * 100} />
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>{completedCount} of {topics.length} lessons done</div>
            </div>
            {topics.map((t, i) => {
              const isUnlocked = i === 0 || progress[i - 1] || progress[i] || phase.status === "completed";
              return (
                <div key={i} onClick={() => isUnlocked && goToLesson(i)} className={`lesson-queue-item ${i === index ? "active" : ""} ${!isUnlocked ? "locked" : ""}`}>
                  <FontAwesomeIcon icon={progress[i] ? faCircleCheck : isUnlocked ? faFileLines : faLock} style={{ color: progress[i] ? "var(--success)" : isUnlocked ? "var(--primary)" : "var(--text3)", fontSize: 12 }} />
                  <span>{t}<small style={{ display: "block", color: "var(--text3)", marginTop: 2 }}>{Math.round(((phase.materials?.lessonDetails?.[i]?.estimatedMinutes) || 60) / 60 * 10) / 10}h</small></span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
