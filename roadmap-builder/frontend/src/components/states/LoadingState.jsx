import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

export default function LoadingState({ title = "Crafting your materials...", text = "We're putting together beginner-friendly materials for you." }) {
  return (
    <div className="state-block">
      <div className="state-icon loading">
        <FontAwesomeIcon icon={faWandMagicSparkles} />
      </div>
      <div className="state-title">{title}</div>
      <div className="state-text">{text}</div>
    </div>
  );
}
