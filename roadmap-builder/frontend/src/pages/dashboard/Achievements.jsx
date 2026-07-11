import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import { ACHIEVEMENTS } from "../../data/catalog";
import { roadmapService } from "../../services/roadmapService";
import { achievementService } from "../../services/achievementService";
import { focusService } from "../../services/focusService";
import { useAuth } from "../../services/AuthContext";

const categories = [
    "All",
    "Learning",
    "Focus",
    "Productivity",
    "Milestone",
    "Profile",
    "Mindset",
    "Multitasking",
];

const emptyFocusStats = {
    sessions: 0,
    startedSessions: 0,
    completedSessions: 0,
    seconds: 0,
    maxSessionSeconds: 0,
    daily: {},
    dailySessions: {},
    dailyCompletedSessions: {},
};

function oneWeekAgo() {
    return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

function todayKey() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getAchievementId(achievement, index) {
    if (achievement.id) return achievement.id;

    if (achievement.title) {
        return achievement.title.toLowerCase().replace(/\s+/g, "-");
    }

    return `achievement-${index}`;
}

function getCompletedPhases(roadmap) {
    const phases = roadmap?.phases || [];

    return phases.filter((phase) => phase.status === "completed").length;
}

function getCompletedLessons(roadmap) {
    const phases = roadmap?.phases || [];

    return phases.reduce((total, phase) => {
        const lessonProgress = phase.lessonProgress || [];
        const completedLessons = lessonProgress.filter(Boolean).length;

        return total + completedLessons;
    }, 0);
}

function getSkillCount(roadmaps) {
    const skillSet = new Set();

    for (const roadmap of roadmaps) {
        for (const phase of roadmap.phases || []) {
            for (const detail of phase.materials?.lessonDetails || []) {
                if (Array.isArray(detail.skills)) {
                    detail.skills.forEach((skill) => {
                        const cleanSkill = String(skill || "").trim().toLowerCase();

                        if (cleanSkill) {
                            skillSet.add(cleanSkill);
                        }
                    });
                }
            }
        }
    }

    return skillSet.size;
}

export default function Achievements() {
    const { user } = useAuth();

    const [activeCategory, setActiveCategory] = useState("All");
    const [roadmap, setRoadmap] = useState(null);
    const [allRoadmaps, setAllRoadmaps] = useState([]);
    const [focusStats, setFocusStats] = useState(emptyFocusStats);
    const [databaseUnlockedIds, setDatabaseUnlockedIds] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        async function loadPageData() {
            setLoaded(false);

            try {
                const results = await Promise.allSettled([
                    roadmapService.getForUser(user.id),
                    roadmapService.getAllForUser(user.id),
                    achievementService.getUnlockedIds(),
                    focusService.getStats(),
                ]);

                const mainRoadmap =
                    results[0].status === "fulfilled" ? results[0].value : null;

                const roadmaps =
                    results[1].status === "fulfilled" && Array.isArray(results[1].value)
                        ? results[1].value
                        : [];

                const unlockedIds =
                    results[2].status === "fulfilled" && Array.isArray(results[2].value)
                        ? results[2].value
                        : [];

                const databaseFocusStats =
                    results[3].status === "fulfilled" && results[3].value
                        ? results[3].value
                        : emptyFocusStats;

                setRoadmap(mainRoadmap);
                setAllRoadmaps(roadmaps);
                setDatabaseUnlockedIds(unlockedIds);
                setFocusStats({
                    ...emptyFocusStats,
                    ...databaseFocusStats,
                    daily: databaseFocusStats.daily || {},
                    dailySessions: databaseFocusStats.dailySessions || {},
                    dailyCompletedSessions: databaseFocusStats.dailyCompletedSessions || {},
                });
            } catch (error) {
                console.error("Could not load achievements:", error);
            } finally {
                setLoaded(true);
            }
        }

        loadPageData();
    }, [user?.id]);

    const metrics = useMemo(() => {
        const roadmaps = allRoadmaps.length ? allRoadmaps : roadmap ? [roadmap] : [];

        const completedPhases = roadmaps.reduce((total, item) => {
            return total + getCompletedPhases(item);
        }, 0);

        const lessons = roadmaps.reduce((total, item) => {
            return total + getCompletedLessons(item);
        }, 0);

        const tracks = roadmaps.map((item) => ({
            completedPhases: getCompletedPhases(item),
            updatedAt: item.updatedAt ? new Date(item.updatedAt).getTime() : 0,
        }));

        function tracksWithAtLeast(number) {
            return tracks.filter((track) => track.completedPhases >= number).length;
        }

        const totalPhasesAcrossTracks = tracks.reduce((sum, track) => {
            return sum + track.completedPhases;
        }, 0);

        const tracksActiveThisWeek = tracks.filter((track) => {
            return track.completedPhases > 0 && track.updatedAt >= oneWeekAgo();
        }).length;

        const roadmapsCreated = roadmaps.length;
        const streak = roadmap?.streak || 0;

        /*
            Focus stats:
            - startedFocusSessions = only for badges that explicitly say "start".
            - completedFocusSessions = for all normal focus badges.
            - completedFocusSessionsToday = for "sessions today" badges.
        */
        const startedFocusSessions = Number(focusStats.startedSessions || 0);
        const completedFocusSessions = Number(focusStats.completedSessions || 0);

        const completedFocusSessionsToday = Number(
            focusStats.dailyCompletedSessions?.[todayKey()] || 0
        );

        const maxFocusSeconds = Number(focusStats.maxSessionSeconds || 0);

        const skills = getSkillCount(roadmaps);

        const xp =
            lessons * 50 +
            completedPhases * 200 +
            completedFocusSessions * 50;

        const level = Math.max(1, Math.floor(xp / 500) + 1);

        return {
            completedPhases,
            lessons,
            roadmapsCreated,
            streak,
            startedFocusSessions,
            completedFocusSessions,
            completedFocusSessionsToday,
            maxFocusSeconds,
            skills,
            xp,
            level,
            tracksWithAtLeast,
            totalPhasesAcrossTracks,
            tracksActiveThisWeek,
        };
    }, [roadmap, allRoadmaps, focusStats]);

    function meetsCondition(achievement, index) {
        const text = String(achievement.text || "").toLowerCase();

        if (index === 0) return metrics.lessons >= 1;

        if (text.includes("first phase")) return metrics.completedPhases >= 1;

        if (text.includes("phase two")) {
            return metrics.completedPhases >= 2 || metrics.lessons >= 10;
        }

        if (text.includes("streak")) {
            if (text.includes("seven")) return metrics.streak >= 7;
            if (text.includes("three")) return metrics.streak >= 3;
            return metrics.streak >= 1;
        }

        if (text.includes("two roadmaps")) return metrics.roadmapsCreated >= 2;
        if (text.includes("three roadmaps")) return metrics.roadmapsCreated >= 3;

        /*
            Correct focus achievement behavior:
            - "start three focus" counts started sessions.
            - "sessions today" counts completed full sessions today.
            - "one focus", "five focus", "100 focus" count completed full sessions.
            - "50-minute session" requires a full/max session of at least 50 minutes.
        */
        if (text.includes("start three focus")) {
            return metrics.startedFocusSessions >= 3;
        }

        if (text.includes("sessions today") || text.includes("focus sessions today")) {
            if (text.includes("three") || text.includes("3")) {
                return metrics.completedFocusSessionsToday >= 3;
            }

            if (text.includes("two") || text.includes("2")) {
                return metrics.completedFocusSessionsToday >= 2;
            }

            return metrics.completedFocusSessionsToday >= 1;
        }

        if (text.includes("50-minute session")) {
            return metrics.maxFocusSeconds >= 50 * 60;
        }

        if (text.includes("100 focus")) {
            return metrics.completedFocusSessions >= 100;
        }

        if (text.includes("five focus")) {
            return metrics.completedFocusSessions >= 5;
        }

        if (text.includes("one focus")) {
            return metrics.completedFocusSessions >= 1;
        }

        if (text.includes("five skills")) return metrics.skills >= 5;

        if (text.includes("2 different tracks")) {
            return (
                metrics.tracksWithAtLeast(1) >= 2 &&
                metrics.totalPhasesAcrossTracks >= 5
            );
        }

        if (text.includes("3 different tracks")) {
            return (
                metrics.tracksWithAtLeast(1) >= 3 &&
                metrics.totalPhasesAcrossTracks >= 5
            );
        }

        if (text.includes("10 phases across 2 tracks")) {
            return (
                metrics.tracksWithAtLeast(1) >= 2 &&
                metrics.totalPhasesAcrossTracks >= 10
            );
        }

        if (text.includes("10 phases across 3 tracks")) {
            return (
                metrics.tracksWithAtLeast(1) >= 3 &&
                metrics.totalPhasesAcrossTracks >= 10
            );
        }

        if (text.includes("15 phases across")) {
            return metrics.totalPhasesAcrossTracks >= 15;
        }

        if (text.includes("at least 1 phase in 3 tracks")) {
            return metrics.tracksWithAtLeast(1) >= 3;
        }

        if (text.includes("at least 2 phases in 3 tracks")) {
            return metrics.tracksWithAtLeast(2) >= 3;
        }

        if (text.includes("at least 3 phases in 4 tracks")) {
            return metrics.tracksWithAtLeast(3) >= 4;
        }

        if (text.includes("2 tracks during the same week")) {
            return metrics.tracksActiveThisWeek >= 2;
        }

        if (text.includes("3 tracks during the same week")) {
            return metrics.tracksActiveThisWeek >= 3;
        }

        if (text.includes("250 xp")) return metrics.xp >= 250;
        if (text.includes("5000 xp")) return metrics.xp >= 5000;
        if (text.includes("level 2")) return metrics.level >= 2;
        if (text.includes("level 5")) return metrics.level >= 5;
        if (text.includes("level 10")) return metrics.level >= 10;

        const lessonMatch = text.match(/(five|ten|25|50|100|first) lessons?/i);

        if (lessonMatch) {
            const numberMap = {
                first: 1,
                five: 5,
                ten: 10,
            };

            const neededLessons =
                numberMap[lessonMatch[1]] || Number(lessonMatch[1]);

            return metrics.lessons >= neededLessons;
        }

        return false;
    }

    const earnedIds = useMemo(() => {
        return ACHIEVEMENTS.map((achievement, index) => {
            const id = getAchievementId(achievement, index);
            const earned = meetsCondition(achievement, index);

            return earned ? id : null;
        }).filter(Boolean);
    }, [metrics]);

    const unlockedIds = useMemo(() => {
        return [...new Set([...databaseUnlockedIds, ...earnedIds])];
    }, [databaseUnlockedIds, earnedIds]);

    useEffect(() => {
        if (!loaded) return;

        const savedIds = new Set(databaseUnlockedIds);

        const newIds = earnedIds.filter((id) => {
            return !savedIds.has(id);
        });

        if (newIds.length === 0) return;

        async function saveUnlockedAchievements() {
            try {
                const updatedIds = await achievementService.unlockAchievements(newIds);
                setDatabaseUnlockedIds(updatedIds);
            } catch (error) {
                console.error("Could not save new achievements:", error);
            }
        }

        saveUnlockedAchievements();
    }, [loaded, earnedIds, databaseUnlockedIds]);

    const achievements = useMemo(() => {
        const unlockedSet = new Set(unlockedIds);

        return ACHIEVEMENTS.map((achievement, index) => {
            const id = getAchievementId(achievement, index);

            return {
                ...achievement,
                id,
                unlocked: unlockedSet.has(id),
            };
        });
    }, [unlockedIds]);

    const filteredAchievements = achievements.filter((achievement) => {
        return activeCategory === "All" || achievement.category === activeCategory;
    });

    const unlockedCount = achievements.filter((achievement) => {
        return achievement.unlocked;
    }).length;

    const totalXP = unlockedCount * 150;

    const completionRate =
        achievements.length > 0
            ? Math.round((unlockedCount / achievements.length) * 100)
            : 0;

    if (!loaded) {
        return (
            <AppShell>
                <div className="page-header">
                    <div className="breadcrumb">
                        <span>Achievements</span>
                    </div>
                    <h1 className="page-title">Achievements</h1>
                    <p className="page-sub">Loading your achievements...</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="page-header">
                <div className="breadcrumb">
                    <span>Achievements</span>
                </div>

                <h1 className="page-title">Achievements</h1>

                <p className="page-sub">
                    A bigger badge system with {ACHIEVEMENTS.length} milestones to keep
                    learning fun.
                </p>
            </div>

            <div className="stat-grid" style={{ marginBottom: 24 }}>
                <Card>
                    <div className="stat-label">Achievements Earned</div>
                    <div className="stat-value">
                        {unlockedCount}/{achievements.length}
                    </div>
                </Card>

                <Card>
                    <div className="stat-label">Total XP Earned</div>
                    <div className="stat-value">{totalXP}</div>
                </Card>

                <Card>
                    <div className="stat-label">Completion Rate</div>
                    <div className="stat-value">{completionRate}%</div>
                </Card>
            </div>

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
                        className={`filter-chip${
                            activeCategory === category ? " active" : ""
                        }`}
                        onClick={() => setActiveCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 14,
                }}
            >
                {filteredAchievements.map((achievement) => (
                    <Card
                        key={achievement.id}
                        style={{
                            opacity: achievement.unlocked ? 1 : 0.55,
                            textAlign: "center",
                            padding: 24,
                            position: "relative",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                top: 14,
                                right: 14,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: "var(--text3)",
                                letterSpacing: 0.5,
                            }}
                        >
                            {achievement.rarity}
                        </span>

                        <div
                            className="navbar-logo-icon"
                            style={{
                                margin: "0 auto 14px",
                                width: 48,
                                height: 48,
                                fontSize: 20,
                                background: achievement.unlocked
                                    ? "var(--gradient-brand)"
                                    : "var(--surface)",
                            }}
                        >
                            <FontAwesomeIcon
                                icon={achievement.unlocked ? achievement.icon : faLock}
                            />
                        </div>

                        <div
                            style={{
                                fontWeight: 700,
                                fontSize: 14,
                                marginBottom: 4,
                            }}
                        >
                            {achievement.title}
                        </div>

                        <div
                            style={{
                                fontSize: 12,
                                color: "var(--text2)",
                            }}
                        >
                            {achievement.text}
                        </div>
                    </Card>
                ))}
            </div>
        </AppShell>
    );
}