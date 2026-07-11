import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClock,
    faFire,
    faBolt,
    faWandMagicSparkles,
    faTrophy,
    faCalendarCheck,
    faLayerGroup,
    faPercent,
    faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/states/LoadingState";
import { useAuth } from "../../services/AuthContext";
import { roadmapService, taskService } from "../../services/roadmapService";
import { getDailyHoursMap, getTotalHours } from "../../services/learningStats";


const STREAK_STORAGE_KEY = "rb_learning_streak";
let legacyStreakKeyCleared = false;

function scopedStreakKey(userId) {
    return `${STREAK_STORAGE_KEY}:${userId}`;
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function dateKeyFromDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function todayKey() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function addDaysToKey(dateKey, amount) {
    const date = dateFromKey(dateKey);
    date.setDate(date.getDate() + amount);

    return dateKeyFromDate(date);
}

function daysBetween(firstKey, secondKey) {
    const first = dateFromKey(firstKey);
    const second = dateFromKey(secondKey);
    const oneDay = 24 * 60 * 60 * 1000;

    return Math.round((second - first) / oneDay);
}

function getLast7Days() {
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date();

        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));

        return {
            key: dateKeyFromDate(date),
            label: date.toLocaleDateString(undefined, { weekday: "short" }),
        };
    });
}

function readSavedStreak(userId) {
    if (!legacyStreakKeyCleared) {
        legacyStreakKeyCleared = true;
        try {
            localStorage.removeItem(STREAK_STORAGE_KEY);
        } catch {
            // ignore
        }
    }

    const empty = {
        currentStreak: 0,
        longestStreak: 0,
        lastLearningDay: null,
    };

    if (!userId) return empty;

    try {
        const saved = localStorage.getItem(scopedStreakKey(userId));

        if (!saved) return empty;

        return JSON.parse(saved);
    } catch {
        return empty;
    }
}

function saveStreak(userId, streakInfo) {
    if (!userId) return;
    localStorage.setItem(scopedStreakKey(userId), JSON.stringify(streakInfo));
}

function getActiveLearningDays(dailyHoursMap) {
    return Object.keys(dailyHoursMap)
        .filter((day) => Number(dailyHoursMap[day] || 0) > 0)
        .sort();
}

function countCurrentStreak(activeDays) {
    if (activeDays.length === 0) return 0;

    const activeDaySet = new Set(activeDays);
    const lastLearningDay = activeDays[activeDays.length - 1];
    const today = todayKey();

    const daysSinceLastLearning = daysBetween(lastLearningDay, today);

    /*
      If the last learning day is older than yesterday,
      the current streak is lost.
    */
    if (daysSinceLastLearning > 1) return 0;

    let streak = 0;
    let dayToCheck = lastLearningDay;

    while (activeDaySet.has(dayToCheck)) {
        streak += 1;
        dayToCheck = addDaysToKey(dayToCheck, -1);
    }

    return streak;
}

function countLongestStreak(activeDays) {
    if (activeDays.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let index = 1; index < activeDays.length; index += 1) {
        const previousDay = activeDays[index - 1];
        const currentDay = activeDays[index];

        if (daysBetween(previousDay, currentDay) === 1) {
            current += 1;
        } else {
            current = 1;
        }

        longest = Math.max(longest, current);
    }

    return longest;
}

function calculateStreakInfo(dailyHoursMap, userId) {
    const activeDays = getActiveLearningDays(dailyHoursMap);
    const savedStreak = readSavedStreak(userId);

    const currentStreak = countCurrentStreak(activeDays);
    const calculatedLongestStreak = countLongestStreak(activeDays);

    /*
      Longest streak should never go down.
      We calculate it from the real learning history,
      then compare it with the saved longest streak.
    */
    const longestStreak = Math.max(
        Number(savedStreak.longestStreak || 0),
        calculatedLongestStreak,
        currentStreak
    );

    const streakInfo = {
        currentStreak,
        longestStreak,
        lastLearningDay: activeDays[activeDays.length - 1] || null,
    };

    saveStreak(userId, streakInfo);

    return streakInfo;
}

function getTrackName(roadmap) {
    return (
        roadmap?.goal ||
        roadmap?.title ||
        roadmap?.trackName ||
        roadmap?.name ||
        "Untitled Track"
    )
        .toString()
        .replace(/\s+/g, " ")
        .trim();
}

function getTrackKey(roadmap) {
    return getTrackName(roadmap).toLowerCase();
}

function getPhaseCounts(roadmap) {
    const phases = safeArray(roadmap?.phases);

    const completed = phases.filter((phase) => phase.status === "completed").length;
    const total = phases.length;

    return { completed, total };
}

function getLessonCounts(roadmap) {
    const phases = safeArray(roadmap?.phases);

    return phases.reduce(
        (result, phase) => {
            const lessonProgress = safeArray(phase.lessonProgress);
            const topics = safeArray(phase.materials?.topics);

            const completedInPhase = lessonProgress.filter(Boolean).length;
            const totalInPhase = lessonProgress.length || topics.length;

            return {
                completed: result.completed + completedInPhase,
                total: result.total + totalInPhase,
            };
        },
        { completed: 0, total: 0 }
    );
}

function getProgressPercent(roadmap) {
    const lessonCounts = getLessonCounts(roadmap);

    if (lessonCounts.total > 0) {
        return Math.round((lessonCounts.completed / lessonCounts.total) * 100);
    }

    const phaseCounts = getPhaseCounts(roadmap);

    if (phaseCounts.total > 0) {
        return Math.round((phaseCounts.completed / phaseCounts.total) * 100);
    }

    return 0;
}

function roadmapScore(roadmap) {
    const phaseCounts = getPhaseCounts(roadmap);
    const lessonCounts = getLessonCounts(roadmap);

    return phaseCounts.completed + lessonCounts.completed;
}

function getUniqueRoadmaps(mainRoadmap, allRoadmaps) {
    const roadmaps = [...safeArray(allRoadmaps), mainRoadmap].filter(Boolean);
    const roadmapsByTrack = new Map();

    roadmaps.forEach((roadmap) => {
        const key = getTrackKey(roadmap);
        const existingRoadmap = roadmapsByTrack.get(key);

        /*
          This prevents Progress Per Track from showing the same track twice.
          If there are duplicate copies, we keep the one with more completed progress.
        */
        if (!existingRoadmap || roadmapScore(roadmap) > roadmapScore(existingRoadmap)) {
            roadmapsByTrack.set(key, roadmap);
        }
    });

    return Array.from(roadmapsByTrack.values());
}

function buildTrackProgress(roadmaps) {
    return roadmaps.map((roadmap) => {
        const phaseCounts = getPhaseCounts(roadmap);

        return {
            id: roadmap._id || roadmap.id || getTrackKey(roadmap),
            goal: getTrackName(roadmap),
            completed: phaseCounts.completed,
            total: phaseCounts.total,
            percent: getProgressPercent(roadmap),
        };
    });
}

function getRecentActivity(roadmaps) {
    const activities = roadmaps.flatMap((roadmap) => safeArray(roadmap?.notifications));

    const usefulActivities = activities.filter((activity) =>
        ["success", "achievement", "streak"].includes(activity.type)
    );

    const seen = new Set();

    return usefulActivities
        .filter((activity) => {
            const key = `${activity.title || ""}-${activity.message || ""}`;

            if (seen.has(key)) return false;

            seen.add(key);
            return true;
        })
        .slice(0, 5);
}

export default function ProgressDashboard() {
    const { user } = useAuth();

    const [roadmap, setRoadmap] = useState(null);
    const [allRoadmaps, setAllRoadmaps] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [dailyHoursMap, setDailyHoursMap] = useState({});
    const [totalHours, setTotalHours] = useState(0);
    const [streakInfo, setStreakInfo] = useState({
        currentStreak: 0,
        longestStreak: 0,
        lastLearningDay: null,
    });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        async function loadProgressData() {
            setLoaded(false);

            const [roadmapResult, allRoadmapsResult, tasksResult] = await Promise.allSettled([
                roadmapService.getForUser(user.id),
                roadmapService.getAllForUser(user.id),
                taskService.getForUser(user.id),
            ]);

            if (roadmapResult.status === "fulfilled") {
                setRoadmap(roadmapResult.value);
            }

            if (allRoadmapsResult.status === "fulfilled") {
                setAllRoadmaps(safeArray(allRoadmapsResult.value));
            }

            if (tasksResult.status === "fulfilled") {
                setTasks(safeArray(tasksResult.value));
            }

            const hoursMap = getDailyHoursMap(user.id);
            const totalLearningHours = getTotalHours(user.id);
            const newStreakInfo = calculateStreakInfo(hoursMap, user.id);

            setDailyHoursMap(hoursMap);
            setTotalHours(Number(totalLearningHours || 0));
            setStreakInfo(newStreakInfo);
            setLoaded(true);
        }

        loadProgressData();
    }, [user?.id]);

    if (!loaded) {
        return (
            <AppShell>
                <LoadingState title="Loading your progress..." />
            </AppShell>
        );
    }

    const uniqueRoadmaps = getUniqueRoadmaps(roadmap, allRoadmaps);
    const tracks = buildTrackProgress(uniqueRoadmaps);

    const allPhaseCounts = uniqueRoadmaps.reduce(
        (total, item) => {
            const counts = getPhaseCounts(item);

            return {
                completed: total.completed + counts.completed,
                total: total.total + counts.total,
            };
        },
        { completed: 0, total: 0 }
    );

    const allLessonCounts = uniqueRoadmaps.reduce(
        (total, item) => {
            const counts = getLessonCounts(item);

            return {
                completed: total.completed + counts.completed,
                total: total.total + counts.total,
            };
        },
        { completed: 0, total: 0 }
    );

    const completedTasks = safeArray(tasks).filter((task) => task.completed).length;

    const dashboardPercent =
        allLessonCounts.total > 0
            ? Math.round((allLessonCounts.completed / allLessonCounts.total) * 100)
            : allPhaseCounts.total > 0
                ? Math.round((allPhaseCounts.completed / allPhaseCounts.total) * 100)
                : 0;

    const days = getLast7Days();
    const weekData = days.map((day) => Number(dailyHoursMap[day.key] || 0));
    const maxWeekHours = Math.max(...weekData, 1);
    const weekTotalHours = weekData.reduce((sum, hours) => sum + hours, 0);
    const activeDaysThisWeek = weekData.filter((hours) => hours > 0).length;
    const consistencyPercent = Math.round((activeDaysThisWeek / 7) * 100);

    const mostActiveIndex = weekData.indexOf(Math.max(...weekData));
    const mostActiveDay =
        weekData[mostActiveIndex] > 0
            ? days[mostActiveIndex].label
            : "Not enough data yet";

    const activeLearningDays = getActiveLearningDays(dailyHoursMap);
    const avgHoursPerDay =
        activeLearningDays.length > 0 ? totalHours / activeLearningDays.length : 0;

    const totalXP =
        allLessonCounts.completed * 50 +
        completedTasks * 25 +
        allPhaseCounts.completed * 200;

    const level = Math.max(1, Math.floor(totalXP / 500) + 1);
    const xpIntoLevel = totalXP % 500;

    const currentStreak = streakInfo.currentStreak || 0;
    const longestStreak = streakInfo.longestStreak || 0;

    const recentActivity = getRecentActivity(uniqueRoadmaps);

    const stats = [
        {
            label: "Total Learning Hours",
            value: totalHours.toFixed(1),
            icon: faClock,
        },
        {
            label: "Avg Hours / Active Day",
            value: avgHoursPerDay.toFixed(1),
            icon: faBolt,
        },
        {
            label: "Current Streak",
            value: `${currentStreak}d`,
            icon: faFire,
        },
        {
            label: "Longest Streak",
            value: `${longestStreak}d`,
            icon: faTrophy,
        },
        {
            label: "Completed Phases",
            value: allPhaseCounts.completed,
            icon: faLayerGroup,
        },
        {
            label: "Consistency",
            value: `${consistencyPercent}%`,
            icon: faPercent,
        },
    ];

    return (
        <AppShell>
            <div className="page-header">
                <div className="breadcrumb">
                    <span>Analytics</span>
                </div>
                <h1 className="page-title">Progress Dashboard</h1>
                <p className="page-sub">A snapshot of how your learning is going.</p>
            </div>

            <Card
                style={{
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    flexWrap: "wrap",
                }}
            >
                <div className="level-badge">Lv {level}</div>

                <div style={{ flex: 1, minWidth: 200 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                        }}
                    >
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              Level Progress
            </span>
                        <span style={{ fontSize: 12, color: "var(--text2)" }}>
              {xpIntoLevel} / 500 XP
            </span>
                    </div>

                    <ProgressBar percent={(xpIntoLevel / 500) * 100} />
                </div>

                <Link to="/achievements">
                    <Button variant="secondary">Open Achievements</Button>
                </Link>
            </Card>

            <div className="stat-grid" style={{ marginBottom: 20 }}>
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <div className="stat-card-icon">
                            <FontAwesomeIcon icon={stat.icon} />
                        </div>
                        <div className="stat-label">{stat.label}</div>
                        <div className="stat-value">{stat.value}</div>
                    </Card>
                ))}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr",
                    gap: 20,
                    marginBottom: 20,
                }}
            >
                <Card>
                    <div className="material-section-title">
                        Weekly Consistency &middot; Last 7 Days
                    </div>

                    <div className="bar-chart">
                        {weekData.map((hours, index) => (
                            <div className="bar-chart-col" key={days[index].key}>
                                <div
                                    className="bar-chart-bar"
                                    style={{
                                        height: `${(hours / maxWeekHours) * 100}%`,
                                    }}
                                    title={`${hours.toFixed(1)}h`}
                                />
                                <div className="bar-chart-label">{days[index].label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
                        {weekTotalHours.toFixed(1)}h learned this week &middot; most active
                        day: {mostActiveDay}
                    </div>
                </Card>

                <Card>
                    <div className="material-section-title">Streak Tracker</div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            marginTop: 10,
                        }}
                    >
                        <div
                            className="stat-card-icon"
                            style={{
                                color: "var(--warning)",
                                background: "rgba(245,158,11,0.12)",
                            }}
                        >
                            <FontAwesomeIcon icon={faFire} />
                        </div>

                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>
                                {currentStreak} day{currentStreak === 1 ? "" : "s"}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text2)" }}>
                                Current streak
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 12 }}>
                        Longest streak so far: {longestStreak} day
                        {longestStreak === 1 ? "" : "s"}. Learn today or tomorrow to keep
                        your streak alive.
                    </div>
                </Card>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                    marginBottom: 20,
                }}
            >
                <Card>
                    <div className="material-section-title" style={{ marginBottom: 12 }}>
                        Progress Per Track
                    </div>

                    {tracks.length === 0 ? (
                        <p style={{ fontSize: 12, color: "var(--text2)" }}>
                            No tracks yet. Generate a roadmap to get started.
                        </p>
                    ) : (
                        tracks.map((track) => (
                            <div key={track.id} style={{ marginBottom: 14 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: 12,
                                        marginBottom: 6,
                                        gap: 12,
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>{track.goal}</span>
                                    <span style={{ color: "var(--text2)", whiteSpace: "nowrap" }}>
                    {track.completed}/{track.total} phases
                  </span>
                                </div>

                                <ProgressBar percent={track.percent} />
                            </div>
                        ))
                    )}
                </Card>

                <Card>
                    <div className="material-section-title" style={{ marginBottom: 12 }}>
                        <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: 6 }} />
                        Recently Completed
                    </div>

                    {recentActivity.length === 0 ? (
                        <p style={{ fontSize: 12, color: "var(--text2)" }}>
                            Complete a lesson or phase to see it here.
                        </p>
                    ) : (
                        recentActivity.map((activity) => (
                            <div
                                key={`${activity.title}-${activity.message}`}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 10,
                                    marginBottom: 12,
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faCircleCheck}
                                    style={{
                                        color: "var(--success)",
                                        marginTop: 3,
                                        fontSize: 12,
                                    }}
                                />

                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                                        {activity.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                                        {activity.message}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </Card>
            </div>

            <Card style={{ marginBottom: 20, borderColor: "rgba(217,70,239,0.3)" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                    }}
                >
                    <FontAwesomeIcon
                        icon={faWandMagicSparkles}
                        style={{ color: "var(--primary)" }}
                    />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
            Learning Insight
          </span>
                </div>

                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
                    Your consistency chart is based on completed learning time, not sample
                    data. You studied {activeDaysThisWeek} of the last 7 days (
                    {consistencyPercent}% consistency), and your strongest day was{" "}
                    {mostActiveDay}.
                </p>
            </Card>

            <Card>
                <div className="material-section-title">Overall Completion</div>

                <div style={{ marginTop: 10, marginBottom: 6 }}>
                    <ProgressBar percent={dashboardPercent} />
                </div>

                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                    {allLessonCounts.completed} of {allLessonCounts.total} lessons
                    completed · {allPhaseCounts.completed} of {allPhaseCounts.total}{" "}
                    phases completed
                </div>
            </Card>
        </AppShell>
    );
}