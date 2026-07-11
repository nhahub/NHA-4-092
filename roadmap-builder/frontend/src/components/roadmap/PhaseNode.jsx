import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faLock, faBolt } from "@fortawesome/free-solid-svg-icons";
import "./roadmap.css";

const statusIcon = {
  completed: faCheck,
  "in-progress": faBolt,
  locked: faLock,
};

export default function PhaseNode({ phase, onClick, active }) {
  return (
    <button className={`phase-item${active ? " active" : ""}`} onClick={onClick}>
      <span className={`phase-node phase-node--${phase.status}`}>
        <FontAwesomeIcon icon={statusIcon[phase.status] || faLock} />
      </span>
      <span className="phase-title">{phase.title}</span>
    </button>
  );
}
