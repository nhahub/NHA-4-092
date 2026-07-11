import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import Button from "../ui/Button";

export default function ErrorState({
  title = "Something went wrong",
  text = "We couldn't load this right now. Please try again.",
  onRetry,
  retryLabel = "Try again",
}) {
  return (
    <div className="state-block">
      <div className="state-icon error">
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>
      <div className="state-title">{title}</div>
      <div className="state-text">{text}</div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
