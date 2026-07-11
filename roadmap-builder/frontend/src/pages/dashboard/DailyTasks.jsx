import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faListCheck,
    faPlus,
    faFire,
    faClock,
    faCircleCheck,
    faBookOpen,
    faCheck,
    faCalendarWeek,
} from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/states/LoadingState";
import ErrorState from "../../components/states/ErrorState";
import EmptyState from "../../components/states/EmptyState";
import { useAuth } from "../../services/AuthContext";
import { roadmapService, taskService } from "../../services/roadmapService";

const categories = ["All", "Learning", "Development", "Design", "Meeting"];

const columns = [
    { id: "todo", label: "To Do" },
    { id: "in-progress", label: "In Progress" },
];

const WEEKLY_PLAN_KEY = "rb_weekly_lesson_plan";

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function getLocalDateKey(date = new Date()) {
    const localDate = new Date(date);

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getWeekStartDate(date = new Date()) {
    const localDate = new Date(date);

    localDate.setHours(12, 0, 0, 0);

    const day = localDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    localDate.setDate(localDate.getDate() + diffToMonday);

    return localDate;
}

function getWeekEndDate(date = new Date()) {
    const start = getWeekStartDate(date);
    const end = new Date(start);

    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return end;
}

function getWeekKey(date = new Date()) {
    return getLocalDateKey(getWeekStartDate(date));
}

function isInCurrentWeek(dateValue) {
    if (!dateValue) return false;

    const date = new Date(dateValue);
    const start = getWeekStartDate();
    const end = getWeekEndDate();

    return date >= start && date <= end;
}

function scopedWeeklyPlanKey(userId) {
    return `${WEEKLY_PLAN_KEY}:${userId}`;
}

function readWeeklyPlan(userId) {
    if (!userId) {
        return {
            generatedWeeks: {},
            lessonKeys: [],
        };
    }

    try {
        const saved = localStorage.getItem(scopedWeeklyPlanKey(userId));

        if (!saved) {
            return {
                generatedWeeks: {},
                lessonKeys: [],
            };
        }

        const parsed = JSON.parse(saved);

        return {
            generatedWeeks: parsed.generatedWeeks || {},
            lessonKeys: safeArray(parsed.lessonKeys),
        };
    } catch {
        return {
            generatedWeeks: {},
            lessonKeys: [],
        };
    }
}

function saveWeeklyPlan(userId, plan) {
    if (!userId) return;

    localStorage.setItem(
        scopedWeeklyPlanKey(userId),
        JSON.stringify({
            generatedWeeks: plan.generatedWeeks || {},
            lessonKeys: safeArray(plan.lessonKeys),
        })
    );
}

function getLessonKey(roadmapId, phaseId, lessonIndex) {
    return `${roadmapId}:${phaseId}:${lessonIndex}`;
}

function getLessonMinutes(detail) {
    return Number(detail?.estimatedMinutes || detail?.minutes || 120);
}

function resolveLessonTaskFromKey(key, roadmaps) {
    const [roadmapId, phaseId, rawLessonIndex] = String(key).split(":");
    const lessonIndex = Number(rawLessonIndex);

    if (!roadmapId || !phaseId || !Number.isInteger(lessonIndex)) {
        return null;
    }

    const roadmap = roadmaps.find((item) => {
        return String(item._id || item.id) === roadmapId;
    });

    if (!roadmap) return null;

    const phase = safeArray(roadmap.phases).find((item) => {
        return String(item._id || item.id) === phaseId;
    });

    if (!phase) return null;

    const topics = safeArray(phase.materials?.topics);
    const details = safeArray(phase.materials?.lessonDetails);
    const progress = safeArray(phase.lessonProgress);

    if (!topics[lessonIndex]) return null;

    if (progress[lessonIndex]) {
        return null;
    }

    const detail = details[lessonIndex] || {};
    const duration = getLessonMinutes(detail);

    return {
        _id: `weekly-lesson-${key}`,
        title: topics[lessonIndex],
        status: "todo",
        completed: false,
        category: "Learning",
        duration,
        priority: "high",
        phaseId: phase._id,
        lessonIndex,
        roadmapLesson: true,
        weeklyLesson: true,
        roadmapId: roadmap._id,
        roadmapName: roadmap.goal || "Roadmap",
        weeklyHours: Number(roadmap.weeklyHours || 5),
        summary:
            detail.summary ||
            detail.overview ||
            `Study ${topics[lessonIndex]} from ${roadmap.goal || "this roadmap"}.`,
    };
}

function chooseLessonsForRoadmap(roadmap, alreadyPlannedKeys) {
    const roadmapId = String(roadmap._id || roadmap.id);
    const weeklyHours = Number(roadmap.weeklyHours || 5);
    const targetMinutes = Math.max(30, Math.round(weeklyHours * 60));

    const selectedKeys = [];
    let selectedMinutes = 0;

    for (const phase of safeArray(roadmap.phases)) {
        if (phase.status === "locked" || phase.status === "completed") continue;

        const phaseId = String(phase._id || phase.id);
        const topics = safeArray(phase.materials?.topics);
        const details = safeArray(phase.materials?.lessonDetails);
        const progress = safeArray(phase.lessonProgress);

        for (let index = 0; index < topics.length; index += 1) {
            if (progress[index]) continue;

            const key = getLessonKey(roadmapId, phaseId, index);

            if (alreadyPlannedKeys.has(key)) continue;

            const minutes = getLessonMinutes(details[index]);

            /*
              Weekly rule:
              - If target is 3h and lessons are 2h + 2h, add both.
              - If first lesson is 3h and next is 2h, add only the first.
              Meaning: keep adding while the selected total is still below target.
            */
            if (selectedKeys.length === 0 || selectedMinutes < targetMinutes) {
                selectedKeys.push(key);
                alreadyPlannedKeys.add(key);
                selectedMinutes += minutes;
            }

            if (selectedMinutes >= targetMinutes) {
                return selectedKeys;
            }
        }
    }

    return selectedKeys;
}

function buildWeeklyLessonTasks(roadmaps, userId) {
    const weekKey = getWeekKey();
    const plan = readWeeklyPlan(userId);

    const activeExistingKeys = safeArray(plan.lessonKeys).filter((key) => {
        return resolveLessonTaskFromKey(key, roadmaps);
    });

    const alreadyPlannedKeys = new Set(activeExistingKeys);

    if (!plan.generatedWeeks[weekKey]) {
        for (const roadmap of roadmaps) {
            const newKeys = chooseLessonsForRoadmap(roadmap, alreadyPlannedKeys);
            activeExistingKeys.push(...newKeys);
        }

        plan.generatedWeeks[weekKey] = true;
    }

    plan.lessonKeys = [...new Set(activeExistingKeys)];

    saveWeeklyPlan(userId, plan);

    return plan.lessonKeys
        .map((key) => resolveLessonTaskFromKey(key, roadmaps))
        .filter(Boolean);
}

function getTrackMinutes(weeklyLessons) {
    return weeklyLessons.reduce((result, task) => {
        const name = task.roadmapName || "Roadmap";

        result[name] = Number(result[name] || 0) + Number(task.duration || 0);

        return result;
    }, {});
}

export default function DailyTasks() {
    const { user } = useAuth();

    const [tasks, setTasks] = useState(null);
    const [allRoadmaps, setAllRoadmaps] = useState([]);
    const [weeklyLessons, setWeeklyLessons] = useState([]);
    const [error, setError] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDuration, setNewDuration] = useState(25);
    const [activeCategory, setActiveCategory] = useState("All");

    useEffect(() => {
        load();
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    function load() {
        if (!user?.id) return;

        setError(false);

        const allRoadmapsRequest = roadmapService.getAllForUser
            ? roadmapService.getAllForUser(user.id)
            : Promise.resolve([]);

        Promise.allSettled([
            taskService.getForUser(user.id),
            allRoadmapsRequest,
            roadmapService.getForUser(user.id),
        ])
            .then(([tasksRes, allRoadmapsRes, activeRoadmapRes]) => {
                const manualTasks =
                    tasksRes.status === "fulfilled" ? safeArray(tasksRes.value) : [];

                const roadmapsFromAll =
                    allRoadmapsRes.status === "fulfilled"
                        ? safeArray(allRoadmapsRes.value)
                        : [];

                const activeRoadmap =
                    activeRoadmapRes.status === "fulfilled" ? activeRoadmapRes.value : null;

                const finalRoadmaps = roadmapsFromAll.length
                    ? roadmapsFromAll
                    : activeRoadmap
                        ? [activeRoadmap]
                        : [];

                const generatedWeeklyLessons = buildWeeklyLessonTasks(
                    finalRoadmaps,
                    user.id
                );

                setTasks(manualTasks);
                setAllRoadmaps(finalRoadmaps);
                setWeeklyLessons(generatedWeeklyLessons);
            })
            .catch(() => setError(true));
    }

    async function moveTask(task, status) {
        if (task.roadmapLesson) return;

        const payload = {
            status,
            completed: status === "done",
        };

        if (status === "done") {
            payload.completedAt = new Date().toISOString();
        }

        const updated = await taskService.update(task._id, payload);

        setTasks((prev) => {
            return safeArray(prev).map((item) => {
                return item._id === updated._id ? updated : item;
            });
        });
    }

    async function completeTask(task) {
        await moveTask(task, "done");
    }

    async function addTask(event) {
        event.preventDefault();

        if (!newTitle.trim()) return;

        const task = await taskService.create({
            userId: user.id,
            title: newTitle.trim(),
            category: activeCategory === "All" ? "Learning" : activeCategory,
            duration: Number(newDuration) || 25,
            status: "todo",
        });

        setTasks((prev) => [...safeArray(prev), task]);
        setNewTitle("");
        setNewDuration(25);
    }

    if (error) {
        return (
            <AppShell>
                <ErrorState onRetry={load} />
            </AppShell>
        );
    }

    if (!tasks) {
        return (
            <AppShell>
                <LoadingState title="Loading weekly tasks..." />
            </AppShell>
        );
    }

    const activeManualTasks = safeArray(tasks).filter((task) => {
        return (task.status || "todo") !== "done";
    });

    const completedManualTasks = safeArray(tasks).filter((task) => {
        return (
            (task.status || "todo") === "done" &&
            isInCurrentWeek(task.completedAt || task.updatedAt)
        );
    });

    const combined = [...weeklyLessons, ...activeManualTasks];

    const filtered = combined.filter((task) => {
        return activeCategory === "All" || task.category === activeCategory;
    });

    const filteredCompleted = completedManualTasks.filter((task) => {
        return activeCategory === "All" || task.category === activeCategory;
    });

    const plannedMinutes = weeklyLessons.reduce((sum, task) => {
        return sum + Number(task.duration || 0);
    }, 0);

    const remainingMinutes =
        weeklyLessons.reduce((sum, task) => {
            return sum + Number(task.duration || 0);
        }, 0) +
        activeManualTasks.reduce((sum, task) => {
            return sum + Number(task.duration || 25);
        }, 0);

    const completedMinutesThisWeek = completedManualTasks.reduce((sum, task) => {
        return sum + Number(task.duration || 25);
    }, 0);

    const trackMinutes = getTrackMinutes(weeklyLessons);
    const weekKey = getWeekKey();

    return (
        <AppShell>
            <div className="page-header">
                <div className="breadcrumb">
                    <span>Weekly Tasks</span>
                </div>

                <h1 className="page-title">This Week's Tasks</h1>

                <p className="page-sub">
                    Lessons are planned from all your roadmaps based on each track's
                    weekly hours. Unfinished weekly lessons stay, and a new weekly set is
                    added next week.
                </p>
            </div>

            <div className="stat-grid" style={{ marginBottom: 24 }}>
                <Card>
                    <div className="stat-card-icon">
                        <FontAwesomeIcon icon={faCalendarWeek} />
                    </div>
                    <div className="stat-label">Current Week</div>
                    <div className="stat-value" style={{ fontSize: 18 }}>
                        {weekKey}
                    </div>
                </Card>

                <Card>
                    <div className="stat-card-icon">
                        <FontAwesomeIcon icon={faCircleCheck} />
                    </div>
                    <div className="stat-label">Completed This Week</div>
                    <div className="stat-value">{completedManualTasks.length}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                        {(completedMinutesThisWeek / 60).toFixed(1)}h done
                    </div>
                </Card>

                <Card>
                    <div
                        className="stat-card-icon"
                        style={{
                            color: "var(--success)",
                            background: "rgba(34,197,94,0.12)",
                        }}
                    >
                        <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="stat-label">Planned Roadmap Lessons</div>
                    <div className="stat-value">{(plannedMinutes / 60).toFixed(1)}h</div>
                </Card>

                <Card>
                    <div
                        className="stat-card-icon"
                        style={{
                            color: "var(--warning)",
                            background: "rgba(245,158,11,0.12)",
                        }}
                    >
                        <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="stat-label">Remaining This Week</div>
                    <div className="stat-value">{(remainingMinutes / 60).toFixed(1)}h</div>
                </Card>
            </div>

            {Object.keys(trackMinutes).length > 0 && (
                <Card style={{ marginBottom: 24 }}>
                    <div className="material-section-title" style={{ marginBottom: 12 }}>
                        Weekly plan by track
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 10,
                        }}
                    >
                        {Object.entries(trackMinutes).map(([trackName, minutes]) => (
                            <div
                                key={trackName}
                                style={{
                                    padding: 12,
                                    border: "1px solid var(--border)",
                                    borderRadius: 14,
                                    background: "var(--surface)",
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{trackName}</div>
                                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                                    Planned lessons: {(minutes / 60).toFixed(1)}h
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <form onSubmit={addTask} className="task-add-form">
                <input
                    className="form-input"
                    placeholder="Add a task..."
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                />

                <input
                    className="form-input task-duration-input"
                    type="number"
                    min="5"
                    step="5"
                    value={newDuration}
                    onChange={(event) => setNewDuration(event.target.value)}
                    aria-label="Estimated minutes"
                />

                <span className="task-duration-label">minutes</span>

                <Button type="submit" icon={<FontAwesomeIcon icon={faPlus} />}>
                    Add
                </Button>
            </form>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 24,
                    flexWrap: "wrap",
                }}
            >
                {categories.map((category) => (
                    <button
                        key={category}
                        type="button"
                        className={`filter-chip${activeCategory === category ? " active" : ""}`}
                        onClick={() => setActiveCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={faListCheck}
                    title="No weekly tasks yet"
                    text="Generate a roadmap or add a manual task to get started."
                />
            ) : (
                <div className="kanban-board two-cols">
                    {columns.map((column) => (
                        <div key={column.id}>
                            <div className="kanban-col-title">
                                <span>{column.label}</span>
                                <span>
                  {
                      filtered.filter((task) => {
                          return (task.status || "todo") === column.id;
                      }).length
                  }
                </span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {filtered
                                    .filter((task) => {
                                        return (task.status || "todo") === column.id;
                                    })
                                    .map((task) => (
                                        <Card key={task._id}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "start",
                                                    marginBottom: 8,
                                                }}
                                            >
                        <span
                            className={`priority-dot priority-${
                                task.priority || "medium"
                            }`}
                        />

                                                <span style={{ fontSize: 11, color: "var(--text3)" }}>
                          {task.roadmapLesson
                              ? "Weekly roadmap lesson"
                              : task.category || "Learning"}
                        </span>
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    marginBottom: 6,
                                                }}
                                            >
                                                {task.title}
                                            </div>

                                            {task.summary && (
                                                <p
                                                    style={{
                                                        fontSize: 12,
                                                        color: "var(--text2)",
                                                        lineHeight: 1.5,
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    {task.summary}
                                                </p>
                                            )}

                                            {task.roadmapLesson && (
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "var(--text3)",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    Track: {task.roadmapName} · {task.weeklyHours}h/week
                                                </div>
                                            )}

                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                        <span style={{ fontSize: 11, color: "var(--text2)" }}>
                          Est. {((task.duration || 25) / 60).toFixed(1)}h
                        </span>

                                                {task.roadmapLesson ? (
                                                    <Link
                                                        to={`/roadmap/phase/${task.phaseId}/lesson/${task.lessonIndex}`}
                                                        style={{
                                                            fontSize: 11,
                                                            color: "var(--primary)",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faBookOpen} /> Start lesson
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/tasks/${task._id}`}
                                                        style={{
                                                            fontSize: 11,
                                                            color: "var(--primary)",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Details
                                                    </Link>
                                                )}
                                            </div>

                                            {!task.roadmapLesson && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 6,
                                                        marginTop: 10,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    {columns
                                                        .filter((item) => item.id !== (task.status || "todo"))
                                                        .map((item) => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => moveTask(task, item.id)}
                                                                className="btn btn-ghost"
                                                                style={{ fontSize: 10, padding: "4px 8px" }}
                                                            >
                                                                → {item.label}
                                                            </button>
                                                        ))}

                                                    <button
                                                        type="button"
                                                        onClick={() => completeTask(task)}
                                                        className="btn btn-primary"
                                                        style={{ fontSize: 10, padding: "4px 8px" }}
                                                    >
                                                        <FontAwesomeIcon icon={faCheck} /> Complete task
                                                    </button>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: 28 }}>
                <div className="kanban-col-title">
                    <span>Completed Manual Tasks This Week</span>
                    <span>{filteredCompleted.length}</span>
                </div>

                {filteredCompleted.length === 0 ? (
                    <Card>
                        <p style={{ color: "var(--text2)", fontSize: 13 }}>
                            No manual tasks completed this week yet.
                        </p>
                    </Card>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 10,
                        }}
                    >
                        {filteredCompleted.map((task) => (
                            <Card key={task._id} className="completed-task-card">
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        textDecoration: "line-through",
                                        color: "var(--text2)",
                                    }}
                                >
                                    {task.title}
                                </div>

                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "var(--text3)",
                                        marginTop: 6,
                                    }}
                                >
                                    Completed this week · Est.{" "}
                                    {((task.duration || 25) / 60).toFixed(1)}h
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}