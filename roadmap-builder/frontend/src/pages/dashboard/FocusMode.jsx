import { useEffect, useRef, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { focusService } from "../../services/focusService";
import "./FocusMode.css";

const SESSION_SECONDS = 25 * 60;

const emptyStats = {
    sessions: 0,
    seconds: 0,
    daily: {},
    dailySessions: {},
};

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
}

function todayKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getSoundPath(filePath) {
    if (!filePath) return "";

    if (filePath.startsWith("/") || filePath.startsWith("http")) {
        return filePath;
    }

    if (filePath.includes("/")) {
        return `/${filePath}`;
    }

    return `/sounds/${filePath}`;
}

function prepareSound(sound) {
    return {
        name: sound.name || "Untitled Sound",
        sound: getSoundPath(sound.sound || sound.file || sound.attachment),
    };
}

export default function FocusMode() {
    const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
    const [running, setRunning] = useState(false);
    const [started, setStarted] = useState(false);
    const [sounds, setSounds] = useState([]);
    const [soundName, setSoundName] = useState("None");
    const [stats, setStats] = useState(emptyStats);
    const [savedSeconds, setSavedSeconds] = useState(0);
    const [message, setMessage] = useState("");

    const intervalRef = useRef(null);
    const audioRef = useRef(null);
    const secondsLeftRef = useRef(SESSION_SECONDS);
    const endingRef = useRef(false);

    useEffect(() => {
        secondsLeftRef.current = secondsLeft;
    }, [secondsLeft]);

    useEffect(() => {
        loadSounds();
        loadStats();

        return () => {
            clearInterval(intervalRef.current);
            stopSound();
        };
    }, []);

    useEffect(() => {
        if (!running) return;

        intervalRef.current = setInterval(() => {
            setSecondsLeft((oldSeconds) => Math.max(oldSeconds - 1, 0));
        }, 1000);

        return () => {
            clearInterval(intervalRef.current);
        };
    }, [running]);

    useEffect(() => {
        if (started && running && secondsLeft === 0) {
            endSession();
        }
    }, [secondsLeft, started, running]);

    async function loadSounds() {
        try {
            const response = await fetch("/data/focusSounds.json");
            const data = await response.json();

            const loadedSounds = Array.isArray(data) ? data.map(prepareSound) : [];
            const hasNone = loadedSounds.some((sound) => sound.name === "None");

            if (hasNone) {
                setSounds(loadedSounds);
            } else {
                setSounds([{ name: "None", sound: "" }, ...loadedSounds]);
            }
        } catch {
            setSounds([{ name: "None", sound: "" }]);
        }
    }

    async function loadStats() {
        try {
            const databaseStats = await focusService.getStats();
            setStats(databaseStats);
        } catch (error) {
            console.error("Could not load focus stats:", error);
            setStats(emptyStats);
        }
    }

    function getSelectedSound(name = soundName) {
        return sounds.find((sound) => sound.name === name);
    }

    function startSound(name = soundName) {
        const selectedSound = getSelectedSound(name);

        stopSound();

        if (!selectedSound || selectedSound.name === "None" || !selectedSound.sound) {
            return;
        }

        const audio = new Audio(selectedSound.sound);
        audio.loop = true;
        audio.volume = 0.4;

        audioRef.current = audio;

        audio.play().catch(() => {});
    }

    function pauseSound() {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    }

    function resumeSound() {
        if (audioRef.current) {
            audioRef.current.play().catch(() => {});
        } else {
            startSound();
        }
    }

    function stopSound() {
        if (!audioRef.current) return;

        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
    }

    function startSession() {
        setMessage("");
        setSavedSeconds(0);
        setStarted(true);
        setRunning(true);
        startSound();
    }

    function togglePause() {
        if (!started) {
            startSession();
            return;
        }

        if (running) {
            setRunning(false);
            pauseSound();
        } else {
            setRunning(true);
            resumeSound();
        }
    }

    function chooseSound(nextSoundName) {
        setSoundName(nextSoundName);

        if (!started) return;

        if (running) {
            startSound(nextSoundName);
        } else {
            stopSound();
        }
    }

    async function endSession() {
        if (endingRef.current) return;

        endingRef.current = true;

        clearInterval(intervalRef.current);
        setRunning(false);
        stopSound();

        const elapsed = SESSION_SECONDS - secondsLeftRef.current;

        if (elapsed > 0) {
            try {
                await focusService.saveSession(elapsed);
                await loadStats();

                setSavedSeconds(elapsed);
                setMessage("Focus session saved.");
            } catch (error) {
                console.error("Could not save focus session:", error);
                setMessage("Session ended, but it could not be saved.");
            }
        }

        setStarted(false);
        setSecondsLeft(SESSION_SECONDS);

        setTimeout(() => {
            endingRef.current = false;
        }, 0);
    }

    const elapsedSeconds = SESSION_SECONDS - secondsLeft;
    const percent = (elapsedSeconds / SESSION_SECONDS) * 100;

    const today = todayKey();
    const todaySeconds = stats.daily?.[today] || 0;
    const todaySessions = stats.dailyCompletedSessions?.[today] || 0;

    return (
        <AppShell>
            <div className="page-header">
                <div className="breadcrumb">
                    <span>Focus Mode</span>
                </div>

                <h1 className="page-title">Focus Session</h1>

                <p className="page-sub">
                    Start a session, stop whenever you need, and only the actual focused time is saved.
                </p>
            </div>

            <div className="focus-layout">
                <Card>
                    <div className="focus-timer-card">
                        <div
                            className="focus-circle"
                            style={{ "--focus-progress": `${percent}%` }}
                        >
                            <div className="focus-circle-inner">
                                {formatTime(secondsLeft)}
                            </div>
                        </div>

                        <p className="focus-message">
                            {savedSeconds > 0
                                ? `Saved ${Math.floor(savedSeconds / 60)} min ${savedSeconds % 60}s from your last session.`
                                : message || "Stay focused. You've got this."}
                        </p>

                        <div className="focus-actions">
                            {!started ? (
                                <Button onClick={startSession}>Start session</Button>
                            ) : (
                                <Button variant="secondary" onClick={togglePause}>
                                    {running ? "Pause" : "Resume"}
                                </Button>
                            )}

                            <Button
                                variant="danger"
                                onClick={endSession}
                                disabled={!started}
                            >
                                End session
                            </Button>
                        </div>
                    </div>
                </Card>

                <div>
                    <div className="focus-side-card">
                        <Card>
                            <div className="material-section-title focus-section-title">
                                Ambient Sounds
                            </div>

                            <div className="focus-sound-list">
                                {sounds.map((sound) => (
                                    <button
                                        key={sound.name}
                                        type="button"
                                        className={`chip-tag focus-sound-button${
                                            soundName === sound.name ? " active" : ""
                                        }`}
                                        onClick={() => chooseSound(sound.name)}
                                    >
                                        {sound.name}
                                    </button>
                                ))}
                            </div>

                            <p className="focus-note">
                                Sounds start after pressing Start session because browsers block autoplay.
                            </p>
                        </Card>
                    </div>

                    <Card>
                        <div className="material-section-title focus-stats-title">
                            Today's Focus
                        </div>

                        <div className="stat-grid focus-stat-grid">
                            <div>
                                <div className="stat-label">Sessions Today</div>
                                <div className="stat-value">{todaySessions}</div>
                            </div>

                            <div>
                                <div className="stat-label">Minutes Today</div>
                                <div className="stat-value">
                                    {Math.floor(todaySeconds / 60)}
                                </div>
                            </div>
                        </div>

                        <div className="focus-total">
                            Total completed sessions: {stats.completedSessions || stats.sessions || 0} · Total time:{" "}
                            {(Number(stats.seconds || 0) / 3600).toFixed(1)}h
                        </div>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}