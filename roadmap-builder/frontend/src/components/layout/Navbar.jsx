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
    faMoon,
    faSun,
} from "@fortawesome/free-solid-svg-icons";
import { roadmapService } from "../../services/roadmapService";
import { useAuth } from "../../services/AuthContext";
import {
    getProfilePicture,
    readStoredProfile,
} from "../../services/profilePicture";
import AppLogo from "./AppLogo";
import Button from "../ui/Button";
import "./Navbar.css";

const THEME_KEY = "rb_theme";

const mobileLinks = [
    { label: "Roadmap", path: "/roadmap", icon: faRoad },
    { label: "Progress", path: "/dashboard", icon: faChartLine },
    { label: "Focus Mode", path: "/focus", icon: faBullseye },
    { label: "Achievements", path: "/achievements", icon: faTrophy },
    { label: "Profile", path: "/settings/profile", icon: faUser },
    { label: "Account Settings", path: "/settings/account", icon: faGear },
];

export default function Navbar({ user, variant }) {
    const { logout } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [roadmapId, setRoadmapId] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [profile, setProfile] = useState(readStoredProfile());

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem(THEME_KEY) || "dark";
    });

    const wrapperRef = useRef(null);

    const profilePicture = getProfilePicture(profile);
    const unread = notifications.filter((notification) => !notification.read).length;
    const recent = notifications.slice(0, 5);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);

        document.documentElement.classList.toggle("light", theme === "light");
        document.documentElement.classList.toggle("dark", theme === "dark");

        localStorage.setItem(THEME_KEY, theme);

        window.dispatchEvent(
            new CustomEvent("themeUpdated", {
                detail: theme,
            })
        );
    }, [theme]);

    useEffect(() => {
        if (!user?.id || variant === "landing") return;

        roadmapService
            .getForUser(user.id)
            .then((roadmap) => {
                if (!roadmap) return;

                setRoadmapId(roadmap._id);
                setNotifications(roadmap.notifications || []);
            })
            .catch(() => {});
    }, [user?.id, variant]);

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

    function toggleTheme() {
        setTheme((currentTheme) => {
            return currentTheme === "dark" ? "light" : "dark";
        });
    }

    function scrollToTop(event) {
        if (event) {
            event.preventDefault();
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    function handleLandingNavClick(event, id) {
        event.preventDefault();

        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    function openNotifications() {
        const shouldOpen = !notesOpen;

        setNotesOpen(shouldOpen);
        setMenuOpen(false);
        setMobileMenuOpen(false);

        if (!shouldOpen || !roadmapId) return;

        const hasUnread = notifications.some((notification) => {
            return !notification.read;
        });

        if (!hasUnread) return;

        setNotifications(
            notifications.map((notification) => ({
                ...notification,
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
        setMenuOpen(false);
        setMobileMenuOpen(false);
        logout();
    }

    if (variant === "landing") {
        return (
            <header className="landing-nav">
                <div className="landing-nav-inner">
                    <Link to="/" className="landing-logo" onClick={scrollToTop}>
                        <AppLogo />
                    </Link>

                    <nav className="landing-nav-links">
                        <a
                            href="#features"
                            onClick={(event) =>
                                handleLandingNavClick(event, "features")
                            }
                        >
                            Features
                        </a>

                        <a
                            href="#why"
                            onClick={(event) =>
                                handleLandingNavClick(event, "why")
                            }
                        >
                            Why Rhodes
                        </a>

                        <a
                            href="#how"
                            onClick={(event) =>
                                handleLandingNavClick(event, "how")
                            }
                        >
                            How it works
                        </a>
                    </nav>

                    <div className="landing-nav-actions">
                        <button
                            type="button"
                            className="nav-btn theme-toggle-btn"
                            aria-label="Toggle theme"
                            onClick={toggleTheme}
                        >
                            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                        </button>

                        <Link to="/login" className="landing-nav-login">
                            Log in
                        </Link>

                        <Link to="/signup">
                            <Button>Get started</Button>
                        </Link>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <nav className="navbar" ref={wrapperRef}>
            <Link
                to="/roadmap"
                className="navbar-logo"
                onClick={() => {
                    window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                    });
                }}
            >
                <img
                    src="/AppLogo.png"
                    alt="Rhodes Logo"
                    className="navbar-logo-img"
                />

                <span className="navbar-logo-text">Rhodes</span>
            </Link>

            <div className="navbar-right">
                <button
                    className="nav-btn theme-toggle-btn"
                    type="button"
                    aria-label="Toggle theme"
                    onClick={toggleTheme}
                >
                    <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
                </button>

                <button
                    className="nav-btn notification-button"
                    type="button"
                    aria-label="Notifications"
                    onClick={openNotifications}
                >
                    <FontAwesomeIcon icon={faBell} />

                    {unread > 0 && (
                        <span className="notification-dot">{unread}</span>
                    )}
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
                                            {new Date(
                                                notification.createdAt
                                            ).toLocaleString()}
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
                                <FontAwesomeIcon icon={faClockRotateLeft} /> View
                                notification history
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

                        <Link
                            to="/settings/profile"
                            onClick={() => setMenuOpen(false)}
                        >
                            <FontAwesomeIcon icon={faUser} /> Profile
                        </Link>

                        <Link
                            to="/achievements"
                            onClick={() => setMenuOpen(false)}
                        >
                            <FontAwesomeIcon icon={faTrophy} /> Achievements
                        </Link>

                        <Link
                            to="/settings/account"
                            onClick={() => setMenuOpen(false)}
                        >
                            <FontAwesomeIcon icon={faGear} /> Account settings
                        </Link>

                        <button type="button" onClick={handleLogout}>
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