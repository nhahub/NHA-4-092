import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import CursorGradient from "./components/ui/CursorGradient";

// Auth
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import VerificationSuccess from "./pages/auth/VerificationSuccess";

// Onboarding
import GoalSelection from "./pages/onboarding/GoalSelection";
import GoalSearchResults from "./pages/onboarding/GoalSearchResults";
import SkillLevelSelection from "./pages/onboarding/SkillLevelSelection";
import WeeklySchedule from "./pages/onboarding/WeeklySchedule";
import AIGeneration from "./pages/onboarding/AIGeneration";
import AIGenerationFailed from "./pages/onboarding/AIGenerationFailed";

// Roadmap
import RoadmapTimeline from "./pages/roadmap/RoadmapTimeline";
import RoadmapPhaseDetails from "./pages/roadmap/RoadmapPhaseDetails";
import LessonDetails from "./pages/roadmap/LessonDetails";
import CompletedRoadmap from "./pages/roadmap/CompletedRoadmap";
import NoRoadmapEmptyState from "./pages/roadmap/NoRoadmapEmptyState";

// Dashboard
import DailyTasks from "./pages/dashboard/DailyTasks";
import TaskDetails from "./pages/dashboard/TaskDetails";
import FocusMode from "./pages/dashboard/FocusMode";
import SessionComplete from "./pages/dashboard/SessionComplete";
import ProgressDashboard from "./pages/dashboard/ProgressDashboard";
import Achievements from "./pages/dashboard/Achievements";
import ProfileSettings from "./pages/dashboard/ProfileSettings";
import AccountSettings from "./pages/dashboard/AccountSettings";
import NotificationsHistory from "./pages/dashboard/NotificationsHistory";

// Landing Page
import Landing from "./pages/Landing";

export default function App() {
    const location = useLocation();

    return (
        <>
            <CursorGradient />

            <div key={location.pathname} className="fade-in-route">
                <Routes location={location}>
                    {/* Landing page */}
                    <Route path="/" element={<Landing />} />

                    {/* Auth */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route
                        path="/verification-success"
                        element={<VerificationSuccess />}
                    />

                    {/* Onboarding */}
                    <Route
                        path="/onboarding/goal"
                        element={
                            <ProtectedRoute>
                                <GoalSelection />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/onboarding/goal-results"
                        element={
                            <ProtectedRoute>
                                <GoalSearchResults />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/onboarding/skill-level"
                        element={
                            <ProtectedRoute>
                                <SkillLevelSelection />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/onboarding/schedule"
                        element={
                            <ProtectedRoute>
                                <WeeklySchedule />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/onboarding/generating"
                        element={
                            <ProtectedRoute>
                                <AIGeneration />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/onboarding/generation-failed"
                        element={
                            <ProtectedRoute>
                                <AIGenerationFailed />
                            </ProtectedRoute>
                        }
                    />

                    {/* Roadmap */}
                    <Route
                        path="/roadmap"
                        element={
                            <ProtectedRoute>
                                <RoadmapTimeline />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/roadmap/empty"
                        element={
                            <ProtectedRoute>
                                <NoRoadmapEmptyState />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/roadmap/phase/:phaseId"
                        element={
                            <ProtectedRoute>
                                <RoadmapPhaseDetails />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/roadmap/phase/:phaseId/lesson/:lessonIndex"
                        element={
                            <ProtectedRoute>
                                <LessonDetails />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/roadmap/completed"
                        element={
                            <ProtectedRoute>
                                <CompletedRoadmap />
                            </ProtectedRoute>
                        }
                    />

                    {/* Dashboard */}
                    <Route
                        path="/tasks"
                        element={
                            <ProtectedRoute>
                                <DailyTasks />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/tasks/:taskId"
                        element={
                            <ProtectedRoute>
                                <TaskDetails />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/focus"
                        element={
                            <ProtectedRoute>
                                <FocusMode />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/session-complete"
                        element={
                            <ProtectedRoute>
                                <SessionComplete />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <ProgressDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/achievements"
                        element={
                            <ProtectedRoute>
                                <Achievements />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings/profile"
                        element={
                            <ProtectedRoute>
                                <ProfileSettings />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings/account"
                        element={
                            <ProtectedRoute>
                                <AccountSettings />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings/appearance"
                        element={<Navigate to="/settings/account" replace />}
                    />

                    <Route
                        path="/notifications"
                        element={
                            <ProtectedRoute>
                                <NotificationsHistory />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </>
    );
}