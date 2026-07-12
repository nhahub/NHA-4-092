import { useEffect, useRef, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { focusService } from "../../services/focusService";
import "./FocusMode.css";

const DEFAULT_SESSION_SECONDS = 25 * 60;

// Bounds for the custom duration input/stepper
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

// Suggested Pomodoro durations shown at the bottom of the page (in minutes)
const SUGGESTED_MINUTES = [25, 30, 45, 50];

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
    // The currently selected timer duration (changes when a suggested time is picked)
    const [sessionSeconds, setSessionSeconds] = useState(DEFAULT_SESSION_SECONDS);
    const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SESSION_SECONDS);
    const [running, setRunning] = useState(false);
    const [started, setStarted] = useState(false);
    const [sounds, setSounds] = useState([]);
    const [soundName, setSoundName] = useState("None");
    const [stats, setStats] = useState(emptyStats);
    const [savedSeconds, setSavedSeconds] = useState(0);
    const [message, setMessage] = useState("");

    const intervalRef = useRef(null);
    const audioRef = useRef(null);
    const secondsLeftRef = useRef(DEFAULT_SESSION_SECONDS);
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
            endSession(true);
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

    // Resets the timer back to the current session length without saving progress
    function resetTimer() {
        clearInterval(intervalRef.current);
        endingRef.current = false;

        setRunning(false);
        setStarted(false);
        stopSound();

        setSecondsLeft(sessionSeconds);
        setSavedSeconds(0);
        setMessage("");
    }

    // Sets a new timer length. Only meant to be used while the timer isn't
    // running (inputs are disabled once a session starts), so it just updates
    // the duration and the displayed clock directly.
    function applyDuration(minutes) {
        const clampedMinutes = Math.min(Math.max(minutes, MIN_MINUTES), MAX_MINUTES);
        const newSeconds = clampedMinutes * 60;

        setSessionSeconds(newSeconds);
        setSecondsLeft(newSeconds);
        setSavedSeconds(0);
        setMessage("");
    }

    // Called when the user picks one of the Suggested Times presets
    function choosePreset(minutes) {
        applyDuration(minutes);
    }

    // Called when the user types directly into the custom duration input
    function handleDurationInputChange(event) {
        const value = parseInt(event.target.value, 10);

        // Ignore incomplete typing (e.g. an empty field) until it's a real number
        if (Number.isNaN(value)) return;

        applyDuration(value);
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

    // timedOut is true when the countdown reached 00:00 on its own,
    // vs. the user pressing "End session" early
    async function endSession(timedOut = false) {
        if (endingRef.current) return;

        endingRef.current = true;

        clearInterval(intervalRef.current);
        setRunning(false);
        stopSound();

        const elapsed = sessionSeconds - secondsLeftRef.current;

        if (elapsed > 0) {
            try {
                // Send the planned duration too, so the backend can tell whether
                // this was a completed session (this may vary now that durations are selectable)
                await focusService.saveSession(elapsed, sessionSeconds);
                await loadStats();

                setSavedSeconds(elapsed);
                setMessage(
                    timedOut ? "Time's up! Focus session complete." : "Focus session saved."
                );
            } catch (error) {
                console.error("Could not save focus session:", error);
                setMessage("Session ended, but it could not be saved.");
            }
        }

        setStarted(false);
        setSecondsLeft(sessionSeconds);

        setTimeout(() => {
            endingRef.current = false;
        }, 0);
    }

    const elapsedSeconds = sessionSeconds - secondsLeft;
    const percent = (elapsedSeconds / sessionSeconds) * 100;

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

                        {!started && (
                            <div className="focus-duration-control">
                                <Button
                                    variant="secondary"
                                    onClick={() => applyDuration(sessionSeconds / 60 - 1)}
                                    disabled={sessionSeconds / 60 <= MIN_MINUTES}
                                >
                                    −
                                </Button>

                                <input
                                    type="number"
                                    className="focus-duration-input"
                                    min={MIN_MINUTES}
                                    max={MAX_MINUTES}
                                    value={sessionSeconds / 60}
                                    onChange={handleDurationInputChange}
                                />

                                <span className="focus-duration-unit">min</span>

                                <Button
                                    variant="secondary"
                                    onClick={() => applyDuration(sessionSeconds / 60 + 1)}
                                    disabled={sessionSeconds / 60 >= MAX_MINUTES}
                                >
                                    +
                                </Button>
                            </div>
                        )}

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
                                variant="secondary"
                                onClick={resetTimer}
                                disabled={!started && secondsLeft === sessionSeconds}
                            >
                                Reset
                            </Button>

                            <Button
                                variant="danger"
                                onClick={() => endSession(false)}
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

                <div className="focus-suggested-card">
                    <Card>
                        <div className="material-section-title focus-section-title">
                            Suggested Times
                        </div>

                        <div className="focus-preset-list">
                            {SUGGESTED_MINUTES.map((minutes) => (
                                <button
                                    key={minutes}
                                    type="button"
                                    className={`chip-tag focus-preset-button${
                                        sessionSeconds === minutes * 60 ? " active" : ""
                                    }`}
                                    onClick={() => choosePreset(minutes)}
                                    disabled={started}
                                >
                                    {minutes} min
                                </button>
                            ))}
                        </div>


                    </Card>
                </div>
            </div>
        </AppShell>
    );
}