import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faTrophy, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProgressBar from "../../components/ui/ProgressBar";

export default function SessionComplete() {
  useEffect(() => {
    const current = Number(localStorage.getItem("rb_focus_sessions") || 0);
    localStorage.setItem("rb_focus_sessions", String(current + 1));
  }, []);

  return (
    <AppShell>
      <div className="state-block" style={{ paddingTop: 40, paddingBottom: 20 }}>
        <div className="state-icon" style={{ color: "var(--success)", background: "rgba(34,197,94,0.12)" }}>
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <h1 className="page-title">Session Complete</h1>
        <p className="state-text">Nice focus session. Take a short break before your next task.</p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <div className="material-section-title" style={{ marginBottom: 12 }}>Session Breakdown</div>
          <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div>
              <div className="stat-label">Duration</div>
              <div className="stat-value" style={{ fontSize: 18 }}>25 min</div>
            </div>
            <div>
              <div className="stat-label">Focus Score</div>
              <div className="stat-value" style={{ fontSize: 18 }}>92%</div>
            </div>
            <div>
              <div className="stat-label">XP Earned</div>
              <div className="stat-value" style={{ fontSize: 18 }}>+50</div>
            </div>
          </div>
        </Card>

        <Card style={{ borderColor: "rgba(245,158,11,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="stat-card-icon" style={{ color: "var(--warning)", background: "rgba(245,158,11,0.12)", marginBottom: 0 }}>
              <FontAwesomeIcon icon={faTrophy} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Achievement Unlocked: Deep Focus Master</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>Bonus reward: +100 XP</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="material-section-title" style={{ marginBottom: 10 }}>Monthly XP Goal</div>
          <ProgressBar percent={68} />
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>On track &middot; Top 8% this month</div>
        </Card>

        <Card style={{ borderColor: "rgba(217,70,239,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: "var(--primary)" }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>AI Learning Insight</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
            Great momentum — this was your most consistent session this week. Keep this pace
            and you'll finish your current phase ahead of schedule.
          </p>
        </Card>

        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/tasks" style={{ flex: 1 }}><Button variant="secondary" block>Back to tasks</Button></Link>
          <Link to="/focus" style={{ flex: 1 }}><Button block>Start another session</Button></Link>
        </div>
      </div>
    </AppShell>
  );
}
