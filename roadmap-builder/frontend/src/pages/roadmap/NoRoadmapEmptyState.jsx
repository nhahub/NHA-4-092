import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoad, faCode, faServer, faChartLine, faBrain, faRobot } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const popularRoadmaps = [
  { title: "Frontend Developer", icon: faCode, tags: ["React", "Next.js", "JavaScript"] },
  { title: "Backend Developer", icon: faServer, tags: ["Node.js", "PostgreSQL", "Docker"] },
  { title: "Data Analyst", icon: faChartLine, tags: ["Python", "Pandas", "SQL"] },
  { title: "AI Engineer", icon: faBrain, tags: ["LLMs", "LangChain", "RAG"] },
  { title: "AI Assistant Builder", icon: faRobot, tags: ["Pinecone", "LLMs", "Prompting"] },
];

export default function NoRoadmapEmptyState() {
  const navigate = useNavigate();

  function startWithGoal(goal) {
    sessionStorage.setItem("onboarding_goal", goal);
    navigate("/onboarding/skill-level");
  }

  return (
    <AppShell>
      <div className="page-header">
        <div className="breadcrumb"><span>Roadmap</span></div>
        <h1 className="page-title">Your Roadmap</h1>
        <p className="page-sub">Nothing here yet — let's build your first one.</p>
      </div>

      <div className="state-block" style={{ paddingTop: 20, paddingBottom: 40 }}>
        <div className="state-icon" style={{ width: 64, height: 64, fontSize: 26 }}>
          <FontAwesomeIcon icon={faRoad} />
        </div>
        <div className="state-title" style={{ fontSize: 20 }}>No roadmap yet</div>
        <div className="state-text" style={{ maxWidth: 420 }}>
          Tell us what you want to learn and we'll generate a personalized, phased
          roadmap for you — or pick one of the popular paths below to get started fast.
        </div>
        <Button onClick={() => navigate("/onboarding/goal")}>Create my own roadmap</Button>
      </div>

      <div className="material-section-title" style={{ marginBottom: 14 }}>Popular Roadmaps</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {popularRoadmaps.map((r) => (
          <Card key={r.title} style={{ cursor: "pointer" }} onClick={() => startWithGoal(r.title)}>
            <div className="navbar-logo-icon" style={{ marginBottom: 14 }}>
              <FontAwesomeIcon icon={r.icon} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{r.title}</div>
            <div>
              {r.tags.map((t) => (
                <span key={t} className="topic-pill" style={{ fontSize: 11, padding: "4px 10px" }}>{t}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
