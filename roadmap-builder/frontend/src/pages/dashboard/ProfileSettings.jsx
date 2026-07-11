import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faChartLine, faCircleCheck, faRoad, faPlus, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faGoogle, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAuth } from "../../services/AuthContext";
import { roadmapService } from "../../services/roadmapService";
import { deriveSkills } from "../../data/catalog";
import { getProfilePicture } from "../../services/profilePicture";
import ChangePasswordSection from "./ChangePasswordSection";

const defaultConnections = [
  { key: "github", name: "GitHub", icon: faGithub, connected: false, handle: "" },
  { key: "google", name: "Google", icon: faGoogle, connected: false, handle: "" },
  { key: "linkedin", name: "LinkedIn", icon: faLinkedin, connected: false, handle: "" },
];

export default function ProfileSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState(() => JSON.parse(localStorage.getItem("rb_profile") || "null") || {
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
    occupation: "",
    careerGoal: "",
    location: "",
    gender: "",
    avatarUrl: "",
  });
  const [saved, setSaved] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [progressSkills, setProgressSkills] = useState([]);
  const [connections, setConnections] = useState(() => JSON.parse(localStorage.getItem("rb_connections") || "null") || defaultConnections);

  useEffect(() => {
    roadmapService.getAllForUser(user.id).then((items) => {
      setRoadmaps(items || []);
      const active = (items || []).find((r) => r.active) || items?.[0];
      if (active) setProgressSkills(deriveSkills(active));
    }).catch(() => {});
  }, [user.id]);

    function handleSave(event) {
        event.preventDefault();

        localStorage.setItem("rb_profile", JSON.stringify(form));

        // Tell the navbar that the profile changed
        window.dispatchEvent(new Event("profileUpdated"));

        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 2000);
    }



  function saveConnections(next) {
    setConnections(next);
    localStorage.setItem("rb_connections", JSON.stringify(next));
  }

  function addOrEditConnection(key) {
    const current = connections.find((c) => c.key === key);
    const handle = window.prompt(`Enter your ${current.name} handle/email`, current.handle || "");
    if (!handle) return;
    saveConnections(connections.map((c) => c.key === key ? { ...c, connected: true, handle } : c));
  }

  const completedRoadmaps = roadmaps.filter((r) => (r.phases || []).length && r.phases.every((p) => p.status === "completed"));
  const completedLessons = roadmaps.reduce((sum, r) => sum + (r.phases || []).reduce((s, p) => s + (p.lessonProgress || []).filter(Boolean).length, 0), 0);
  const totalLessons = roadmaps.reduce((sum, r) => sum + (r.phases || []).reduce((s, p) => s + (p.lessonProgress?.length || p.materials?.topics?.length || 0), 0), 0);
  const progressPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <AppShell>
      <div className="page-header">
        <div className="breadcrumb"><span>Profile</span></div>
        <h1 className="page-title">Learner Profile</h1>
        <p className="page-sub">Your public learner info, account handles, completed roadmaps, and progress summary.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.9fr)", gap: 20, alignItems: "start" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <div className="material-section-title" style={{ marginBottom: 14 }}>About & Personal Info</div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img
                src={getProfilePicture(form)}
                alt="Profile"
                width={56}
                height={56}
                style={{ borderRadius: "50%", objectFit: "cover", background: "var(--surface)" }}
                onError={(e) => { e.target.style.visibility = "hidden"; }}
              />

            </div>
            <div className="form-group"><label className="form-label">Full name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Email address</label><input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input" value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
              <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Used only to choose a default profile picture if you haven't uploaded one.</p>
            </div>
            <div className="form-group"><label className="form-label">Occupation</label><input className="form-input" placeholder="e.g. Student, Product Manager" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Career goal</label><input className="form-input" placeholder="e.g. Full-Stack Developer" value={form.careerGoal} onChange={(e) => setForm({ ...form, careerGoal: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Location</label><input className="form-input" placeholder="Optional" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Bio</label><textarea className="form-input" rows={4} placeholder="A short bio about yourself" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          </Card>

          <Card>
            <div className="material-section-title" style={{ marginBottom: 6 }}>Connected Accounts</div>
            <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>Saved display handles only. No real OAuth connection is made.</p>
            {connections.map((c) => (
              <div className="settings-row" key={c.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FontAwesomeIcon icon={c.icon} style={{ fontSize: 18, color: "var(--text2)" }} />
                  <div><div className="settings-row-label">{c.name}</div><div className="settings-row-sub">{c.connected ? c.handle : "Not added"}</div></div>
                </div>
                <Button variant={c.connected ? "secondary" : "primary"} icon={<FontAwesomeIcon icon={c.connected ? faPenToSquare : faPlus} />} style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => addOrEditConnection(c.key)}>
                  {c.connected ? "Edit" : "Add"}
                </Button>
              </div>
            ))}
          </Card>

          <Button type="submit" icon={<FontAwesomeIcon icon={faFloppyDisk} />} style={{ alignSelf: "flex-start" }}>{saved ? "Saved!" : "Save profile"}</Button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <div className="material-section-title" style={{ marginBottom: 12 }}><FontAwesomeIcon icon={faChartLine} /> Profile Analytics</div>
            <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 14 }}>
              <div><div className="stat-label">Roadmaps</div><div className="stat-value">{roadmaps.length}</div></div>
              <div><div className="stat-label">Completed</div><div className="stat-value">{completedRoadmaps.length}</div></div>
              <div><div className="stat-label">Lessons</div><div className="stat-value">{completedLessons}</div></div>
              <div><div className="stat-label">Overall</div><div className="stat-value">{progressPercent}%</div></div>
            </div>
            <ProgressBar percent={progressPercent} />
          </Card>

          <Card>
            <div className="material-section-title" style={{ marginBottom: 14 }}>Skills from Progress</div>
            {progressSkills.length === 0 ? <p style={{ fontSize: 13, color: "var(--text2)" }}>Complete lessons to automatically add skills here.</p> : <div>{progressSkills.map((skill) => <span key={skill} className="chip-tag active">{skill}</span>)}</div>}
          </Card>

          <Card>
            <div className="material-section-title" style={{ marginBottom: 14 }}><FontAwesomeIcon icon={faRoad} /> Completed Roadmaps</div>
            {completedRoadmaps.length === 0 ? <p style={{ fontSize: 13, color: "var(--text2)" }}>No completed roadmaps yet.</p> : completedRoadmaps.map((r) => (
              <div className="settings-row" key={r._id}><div><div className="settings-row-label"><FontAwesomeIcon icon={faCircleCheck} /> {r.goal}</div><div className="settings-row-sub">{r.phases?.length || 0} phases completed</div></div></div>
            ))}
          </Card>
        </div>
      </div>
        <ChangePasswordSection />

    </AppShell>

  );
}
