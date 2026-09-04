import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/internships", label: "Browse Internships" },
  { to: "/student/applications", label: "My Applications" },
  { to: "/profile", label: "Profile" },
  { to: "/notifications", label: "Notifications" },
];

const employerLinks = [
  { to: "/employer/dashboard", label: "Dashboard" },
  { to: "/employer/listings", label: "My Listings" },
  { to: "/employer/post", label: "Post Internship" },
  { to: "/employer/applications", label: "Applications Received" },
  { to: "/profile", label: "Profile" },
  { to: "/notifications", label: "Notifications" },
];

const adminLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Manage Users" },
  { to: "/reports", label: "Reports" },
  { to: "/notifications", label: "Notifications" },
];

export default function Sidebar({ role = "student" }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const links = role === "employer" ? employerLinks : role === "admin" ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
    <aside className={`portal-sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand-lockup"><span className="brand-mark">i</span><div><h2>Intern<span>Link</span></h2><span>Internship portal</span></div></div>
      <div className="role-label">{role} workspace</div>
      <nav className="portal-nav">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `portal-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-dot" />{label}
          </NavLink>
        ))}
      </nav>
      <button onClick={handleLogout} className="logout-button"><span>↪</span> Log out</button>
    </aside>
    </>
  );
}
