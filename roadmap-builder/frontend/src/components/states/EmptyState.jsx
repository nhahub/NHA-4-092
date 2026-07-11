import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../ui/Button";

export default function EmptyState({ icon, title, text, actionLabel, onAction }) {
  return (
    <div className="state-block">
      <div className="state-icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="state-title">{title}</div>
      <div className="state-text">{text}</div>
      {actionLabel && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
