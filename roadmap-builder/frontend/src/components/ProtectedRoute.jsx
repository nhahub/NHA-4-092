import { Navigate } from "react-router-dom";
import { useAuth } from "../services/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (!user) {
        const isLoggingOut = sessionStorage.getItem("rb_logging_out") === "true";

        if (isLoggingOut) {
            sessionStorage.removeItem("rb_logging_out");
            return <Navigate to="/" replace />;
        }

        return <Navigate to="/login" replace />;
    }

    return children;
}