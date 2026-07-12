import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../../services/AuthContext";

export default function AppShell({ children }) {
    const { user } = useAuth();

    return (
        <div className="app-shell">
            <div className="orb1" />
            <div className="orb2" />

            <Sidebar />

            <div className="app-main">
                <Navbar user={user} />

                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}