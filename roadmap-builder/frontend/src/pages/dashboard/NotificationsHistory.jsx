import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import AppShell from "../../components/layout/AppShell";
import Card from "../../components/ui/Card";
import LoadingState from "../../components/states/LoadingState";
import EmptyState from "../../components/states/EmptyState";
import { useAuth } from "../../services/AuthContext";
import { roadmapService } from "../../services/roadmapService";

export default function NotificationsHistory() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    roadmapService.getForUser(user.id).then((r) => setNotifications(r.notifications || [])).catch(() => setNotifications([]));
  }, [user.id]);

  if (!notifications) return <AppShell><LoadingState title="Loading notifications..." /></AppShell>;

  return (
    <AppShell>
      <div className="page-header">
        <div className="breadcrumb"><span>Notifications</span></div>
        <h1 className="page-title">Notifications History</h1>
        <p className="page-sub">All roadmap, streak, lesson, and phase updates are saved here.</p>
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={faBell} title="No notifications yet" text="Complete lessons and phases to see history here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map((n) => (
            <Card key={n._id || `${n.title}-${n.createdAt}`}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div className="stat-card-icon" style={{ marginBottom: 0 }}><FontAwesomeIcon icon={faBell} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
                  <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>{n.message}</p>
                  {n.createdAt && <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
