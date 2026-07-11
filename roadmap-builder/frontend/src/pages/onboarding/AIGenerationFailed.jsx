import { useNavigate } from "react-router-dom";
import ErrorState from "../../components/states/ErrorState";

export default function AIGenerationFailed() {
  const navigate = useNavigate();

  return (
    <div className="auth-shell">
      <div className="orb1" />
      <div className="orb2" />
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <ErrorState
          title="We couldn't build your roadmap"
          text="This is usually temporary — check your connection and try again."
          onRetry={() => navigate("/onboarding/generating")}
        />
      </div>
    </div>
  );
}
