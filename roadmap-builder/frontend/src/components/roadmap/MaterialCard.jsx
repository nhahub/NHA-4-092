import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faBookOpen, faVideo, faLink } from "@fortawesome/free-solid-svg-icons";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import "./roadmap.css";

function normalizeResource(resource) {
  if (typeof resource === "string") {
    return {
      title: resource,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(resource)}`,
      type: "Video",
      platform: "YouTube",
    };
  }
  const r = resource || {};
  // Older saved roadmaps used "source" instead of "platform" — support both.
  return { ...r, platform: r.platform || r.source };
}

export default function MaterialCard({ materials }) {
  if (!materials) return null;
  const { topics = [], explanation, resources = [], difficulty, estimatedTime } = materials;

  return (
    <Card>
      <div className="material-meta-row">
        <Badge level={difficulty}>{difficulty || "Beginner"}</Badge>
        <span style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}>
          <FontAwesomeIcon icon={faClock} /> {estimatedTime || "Flexible"}
        </span>
      </div>

      {explanation && <p className="material-explanation">{explanation}</p>}

      {topics.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="material-section-title">Recommended lessons</div>
          {topics.map((topic, i) => <span className="topic-pill" key={i}>Lesson {i + 1}: {topic}</span>)}
        </div>
      )}

      {resources.length > 0 && (
        <div>
          <div className="material-section-title">Useful resources</div>
          {resources.map((r, i) => {
            const resource = normalizeResource(r);
            const isVideo = resource.type === "Video" || resource.platform?.toLowerCase().includes("youtube");
            return (
              <a className="resource-item resource-link" key={i} href={resource.url} target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={isVideo ? faVideo : resource.url ? faLink : faBookOpen} />
                <span>
                  {resource.title || resource.url}
                  {resource.description && <small style={{ display: "block", color: "var(--text3)", fontWeight: 400, marginTop: 2 }}>{resource.description}</small>}
                </span>
                <span style={{ marginLeft: "auto", color: "var(--text3)", fontSize: 11 }}>{resource.platform || "Web"}</span>
              </a>
            );
          })}
        </div>
      )}
    </Card>
  );
}
