import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRoad,
  faListCheck,
  faChartLine,
  faTrophy,
  faBolt,
  faGear,
} from "@fortawesome/free-solid-svg-icons";

const links = [
  { to: "/roadmap", label: "Roadmap", icon: faRoad },
  { to: "/tasks", label: "Weekly Tasks", icon: faListCheck },
  { to: "/dashboard", label: "Progress", icon: faChartLine },
  { to: "/focus", label: "Focus", icon: faBolt },
  { to: "/achievements", label: "Achievements", icon: faTrophy },
  { to: "/settings/account", label: "Settings", icon: faGear },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
        >
          <FontAwesomeIcon icon={link.icon} />
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}
