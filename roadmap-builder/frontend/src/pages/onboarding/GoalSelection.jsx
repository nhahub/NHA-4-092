import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faArrowLeft,
    faArrowRight,
    faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import OnboardingSummary from "../../components/onboarding/OnboardingSummary";
import { TRACKS } from "../../data/catalog";
import { useAuth } from "../../services/AuthContext";
import { roadmapService } from "../../services/roadmapService";

const PAGE_SIZE = 6;

function cleanGoal(goal) {
    return String(goal || "").trim().toLowerCase();
}

export default function GoalSelection() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [existingGoals, setExistingGoals] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user?.id) return;

        roadmapService
            .getAllForUser(user.id)
            .then((roadmaps) => {
                const goals = (roadmaps || []).map((roadmap) =>
                    cleanGoal(roadmap.goal)
                );

                setExistingGoals(goals);
            })
            .catch(() => {});
    }, [user?.id]);

    const filteredTracks = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) return TRACKS;

        return TRACKS.filter((track) =>
            `${track.label} ${track.group}`.toLowerCase().includes(q)
        );
    }, [query]);

    const totalPages = Math.max(1, Math.ceil(filteredTracks.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);

    const visibleTracks = filteredTracks.slice(
        safePage * PAGE_SIZE,
        safePage * PAGE_SIZE + PAGE_SIZE
    );

    // A goal can now have several roadmaps (one per category x skill level
    // combination), so this is informational only — it no longer blocks
    // re-selecting a goal you've already started.
    function alreadyGenerated(goal) {
        return existingGoals.includes(cleanGoal(goal));
    }

    function handleSelect(goal) {
        setError("");
        sessionStorage.setItem("onboarding_goal", goal);
        navigate("/onboarding/goal-results");
    }

    function handleSearch(e) {
        e.preventDefault();

        const typedGoal = query.trim();

        if (!typedGoal) return;

        handleSelect(typedGoal);
    }

    return (
        <div className="auth-shell">
            <div className="orb1" />
            <div className="orb2" />

            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <OnboardingSummary step={0} />

                <div className="auth-card" style={{ maxWidth: 560 }}>
                    <h1 className="auth-title">What do you want to learn?</h1>

                    <p className="auth-sub">
                        Choose a track or search any goal. Tracks include technical and
                        non-technical paths.
                    </p>

                    <form onSubmit={handleSearch} className="form-group">
                        <div style={{ position: "relative" }}>
                            <input
                                className="form-input"
                                style={{ paddingLeft: 40 }}
                                placeholder="Search 60+ tracks or type your own goal..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(0);
                                    setError("");
                                }}
                            />

                            <FontAwesomeIcon
                                icon={faMagnifyingGlass}
                                style={{
                                    position: "absolute",
                                    left: 14,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text3)",
                                }}
                            />
                        </div>
                    </form>

                    {error && <p className="form-error">{error}</p>}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 20,
                        }}
                    >
                        <div className="material-section-title">Learning tracks</div>

                        <div style={{ fontSize: 11, color: "var(--text3)" }}>
                            Page {safePage + 1} of {totalPages}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                            marginTop: 12,
                        }}
                    >
                        {visibleTracks.map((track) => {
                            const started = alreadyGenerated(track.label);

                            return (
                                <Card
                                    key={track.label}
                                    onClick={() => handleSelect(track.label)}
                                    className="track-card"
                                    style={{ position: "relative" }}
                                >
                                    {started && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 8,
                                                right: 8,
                                                fontSize: 10,
                                                fontWeight: 800,
                                                color: "var(--success)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faCircleCheck} />
                                            In progress
                                        </div>
                                    )}

                                    <FontAwesomeIcon
                                        icon={track.icon}
                                        style={{
                                            color: "var(--primary)",
                                            fontSize: 17,
                                        }}
                                    />

                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                                            {track.label}
                                        </div>

                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: "var(--text3)",
                                                marginTop: 2,
                                            }}
                                        >
                                            {started
                                                ? "You already have a roadmap for this — add another category or level"
                                                : track.group}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            marginTop: 16,
                        }}
                    >
                        <Button
                            variant="secondary"
                            type="button"
                            disabled={safePage === 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            icon={<FontAwesomeIcon icon={faArrowLeft} />}
                        >
                            Previous
                        </Button>

                        <Button
                            variant="secondary"
                            type="button"
                            disabled={safePage >= totalPages - 1}
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        >
                            Next <FontAwesomeIcon icon={faArrowRight} />
                        </Button>
                    </div>

                    <Button block style={{ marginTop: 20 }} onClick={handleSearch}>
                        Continue with typed goal
                    </Button>
                </div>
            </div>
        </div>
    );
}