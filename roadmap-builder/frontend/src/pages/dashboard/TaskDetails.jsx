import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlay, faTrash, faBookOpen, faCheck } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProgressBar from "../../components/ui/ProgressBar";
import LoadingState from "../../components/states/LoadingState";
import { useAuth } from "../../services/AuthContext";
import { taskService } from "../../services/roadmapService";

const priorityLabel = { low: "Low Priority", medium: "Medium Priority", high: "High Priority" };

export default function TaskDetails() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([
    { label: "Plan the approach", done: true },
    { label: "Build the first draft", done: true },
    { label: "Review and refine", done: false },
    { label: "Mark task complete", done: false },
  ]);

  useEffect(() => {
    taskService.getForUser(user.id).then((tasks) => {
      setTask(tasks.find((t) => t._id === taskId));
    });
  }, [user.id, taskId]);

  if (!task) return <AppShell><LoadingState title="Loading task..." /></AppShell>;

  async function handleDelete() {
    await taskService.remove(taskId);
    navigate("/tasks");
  }

  async function handleComplete() {
    await taskService.update(taskId, { status: "done", completed: true, completedAt: new Date().toISOString() });
    navigate("/tasks");
  }

  function toggleSubtask(i) {
    setSubtasks((prev) => prev.map((s, idx) => (idx === i ? { ...s, done: !s.done } : s)));
  }

  const doneCount = subtasks.filter((s) => s.done).length;
  const percent = Math.round((doneCount / subtasks.length) * 100);

  return (
    <AppShell>
      <Link to="/tasks" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to tasks
      </Link>

      <div className="page-header">
        <h1 className="page-title">{task.title}</h1>
        <p className="page-sub">
          <span className={`priority-dot priority-${task.priority || "medium"}`} style={{ marginRight: 4 }} />
          {priorityLabel[task.priority || "medium"]} &middot; {task.category || "Learning"} &middot; {((task.duration || 25) / 60).toFixed(1)}h estimated
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div className="material-section-title" style={{ marginBottom: 12 }}>Overall Completion</div>
            <ProgressBar percent={percent} />
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>{doneCount} of {subtasks.length} steps complete</div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div className="material-section-title" style={{ marginBottom: 12 }}>Subtasks</div>
            {subtasks.map((s, i) => (
              <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < subtasks.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
                <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(i)} />
                <span style={{ fontSize: 13, textDecoration: s.done ? "line-through" : "none", color: s.done ? "var(--text3)" : "var(--text)" }}>
                  {s.label}
                </span>
              </label>
            ))}
          </Card>

          <Card>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
              {task.description || "No additional description for this task."}
            </p>
          </Card>
        </div>

        <div>
          <Card style={{ marginBottom: 16 }}>
            <div className="material-section-title" style={{ marginBottom: 12 }}>Learning Resources</div>
            {["Official documentation for this topic", "Community examples and walkthroughs"].map((r, i) => (
              <div className="resource-item" key={i}>
                <FontAwesomeIcon icon={faBookOpen} />
                {r}
              </div>
            ))}
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {task.status !== "done" && (
              <Button icon={<FontAwesomeIcon icon={faCheck} />} onClick={handleComplete}>
                Complete task
              </Button>
            )}
            <Button icon={<FontAwesomeIcon icon={faPlay} />} onClick={() => navigate("/focus")}>
              Start focus session
            </Button>
            <Button variant="danger" icon={<FontAwesomeIcon icon={faTrash} />} onClick={handleDelete}>
              Delete task
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
