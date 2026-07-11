import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBell,
    faGear,
    faUser,
    faRightFromBracket,
    faTrophy,
    faClockRotateLeft,
    faBars,
    faXmark,
    faRoad,
    faChartLine,
    faBullseye,
} from "@fortawesome/free-solid-svg-icons";
import { roadmapService } from "../../services/roadmapService";
import { useAuth } from "../../services/AuthContext";
import {
    getProfilePicture,
    readStoredProfile,
} from "../../services/profilePicture";
import "./Navbar.css";

const mobileLinks = [
    { label: "Roadmap", path: "/roadmap", icon: faRoad },
    { label: "Progress", path: "/progress", icon: faChartLine },
    { label: "Focus Mode", path: "/focus", icon: faBullseye },
    { label: "Achievements", path: "/achievements", icon: faTrophy },
    { label: "Profile", path: "/settings/profile", icon: faUser },
    { label: "Account Settings", path: "/settings/account", icon: faGear },
];

export default function Navbar({ user }) {
    const { logout } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [roadmapId, setRoadmapId] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [profile, setProfile] = useState(readStoredProfile());

    const wrapperRef = useRef(null);

    const profilePicture = getProfilePicture(profile);
    const unread = notifications.filter((n) => !n.read).length;
    const recent = notifications.slice(0, 5);

    useEffect(() => {
        if (!user?.id) return;

        roadmapService
            .getForUser(user.id)
            .then((roadmap) => {
                if (!roadmap) return;

                setRoadmapId(roadmap._id);
                setNotifications(roadmap.notifications || []);
            })
            .catch(() => {});
    }, [user?.id]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (!wrapperRef.current?.contains(event.target)) {
                setMenuOpen(false);
                setNotesOpen(false);
                setMobileMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        function updateNavbarProfile() {
            setProfile(readStoredProfile());
        }

        window.addEventListener("profileUpdated", updateNavbarProfile);

        return () => {
            window.removeEventListener("profileUpdated", updateNavbarProfile);
        };
    }, []);

    function openNotifications() {
        const shouldOpen = !notesOpen;

        setNotesOpen(shouldOpen);
        setMenuOpen(false);
        setMobileMenuOpen(false);

        if (!shouldOpen || !roadmapId) return;

        const hasUnread = notifications.some((n) => !n.read);

        if (!hasUnread) return;

        setNotifications(
            notifications.map((n) => ({
                ...n,
                read: true,
            }))
        );

        roadmapService
            .readAllNotifications(roadmapId)
            .then((roadmap) => {
                setNotifications(roadmap.notifications || []);
            })
            .catch(() => {});
    }

    function openProfileMenu() {
        setProfile(readStoredProfile());
        setMenuOpen(!menuOpen);
        setNotesOpen(false);
        setMobileMenuOpen(false);
    }

    function toggleMobileMenu() {
        setMobileMenuOpen(!mobileMenuOpen);
        setMenuOpen(false);
        setNotesOpen(false);
    }

    function closeMobileMenu() {
        setMobileMenuOpen(false);
    }

    function handleLogout() {
        setMobileMenuOpen(false);
        logout();
    }

    return (
        <nav className="navbar" ref={wrapperRef}>
            <Link to="/roadmap" className="navbar-logo">
                <img src="/AppLogo.png" alt="Rhodes Logo" className="navbar-logo-img" />

                <span className="navbar-logo-text">Rhodes</span>
            </Link>

            <div className="navbar-right">
                <button
                    className="nav-btn notification-button"
                    type="button"
                    aria-label="Notifications"
                    onClick={openNotifications}
                >
                    <FontAwesomeIcon icon={faBell} />

                    {unread > 0 && <span className="notification-dot">{unread}</span>}
                </button>

                {notesOpen && (
                    <div className="dropdown-panel notifications-panel">
                        <div className="dropdown-title">Recent notifications</div>

                        {notifications.length === 0 ? (
                            <div className="dropdown-empty">
                                No notifications yet. Finish a lesson or save your streak.
                            </div>
                        ) : (
                            recent.map((notification) => (
                                <div
                                    className="notification-row"
                                    key={notification._id || notification.title}
                                >
                                    <strong>{notification.title}</strong>
                                    <span>{notification.message}</span>

                                    {notification.createdAt && (
                                        <small>
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </small>
                                    )}
                                </div>
                            ))
                        )}

                        {notifications.length > 5 && (
                            <Link
                                className="dropdown-link"
                                to="/notifications"
                                onClick={() => setNotesOpen(false)}
                            >
                                <FontAwesomeIcon icon={faClockRotateLeft} /> View notification
                                history
                            </Link>
                        )}
                    </div>
                )}

                <Link
                    to="/settings/account"
                    className="nav-btn desktop-nav-item"
                    aria-label="Settings"
                >
                    <FontAwesomeIcon icon={faGear} />
                </Link>

                <button
                    className="avatar desktop-nav-item"
                    type="button"
                    aria-label="Profile menu"
                    onClick={openProfileMenu}
                >
                    <img
                        src={profilePicture}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="navbar-avatar-img"
                    />
                </button>

                <button
                    className="nav-btn hamburger-button"
                    type="button"
                    aria-label="Open menu"
                    onClick={toggleMobileMenu}
                >
                    <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} />
                </button>

                {menuOpen && (
                    <div className="dropdown-panel profile-menu">
                        <div className="profile-menu-head">
                            <strong>{user?.name || "Learner"}</strong>
                            <span>{user?.email}</span>
                        </div>

                        <Link to="/settings/profile" onClick={() => setMenuOpen(false)}>
                            <FontAwesomeIcon icon={faUser} /> Profile
                        </Link>

                        <Link to="/achievements" onClick={() => setMenuOpen(false)}>
                            <FontAwesomeIcon icon={faTrophy} /> Achievements
                        </Link>

                        <Link to="/settings/account" onClick={() => setMenuOpen(false)}>
                            <FontAwesomeIcon icon={faGear} /> Account settings
                        </Link>

                        <button type="button" onClick={logout}>
                            <FontAwesomeIcon icon={faRightFromBracket} /> Log out
                        </button>
                    </div>
                )}

                {mobileMenuOpen && (
                    <div className="mobile-menu-panel">
                        <div className="mobile-menu-head">
                            <img
                                src={profilePicture}
                                alt="Profile"
                                width={38}
                                height={38}
                                className="navbar-avatar-img"
                            />

                            <div>
                                <strong>{user?.name || "Learner"}</strong>
                                <span>{user?.email}</span>
                            </div>
                        </div>

                        <div className="mobile-menu-links">
                            {mobileLinks.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={closeMobileMenu}
                                    className={({ isActive }) =>
                                        `mobile-menu-link${isActive ? " active" : ""}`
                                    }
                                >
                                    <FontAwesomeIcon icon={link.icon} />
                                    <span>{link.label}</span>
                                </NavLink>
                            ))}

                            <button
                                type="button"
                                className="mobile-menu-link logout-link"
                                onClick={handleLogout}
                            >
                                <FontAwesomeIcon icon={faRightFromBracket} />
                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}