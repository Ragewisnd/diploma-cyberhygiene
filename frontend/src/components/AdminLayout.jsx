import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { removeToken } from "../api";

const NAV = [
  { to: "/admin",         label: "Обзор",         emoji: "📈" },
  { to: "/admin/courses", label: "Курсы",         emoji: "📚" },
  { to: "/admin/users",   label: "Пользователи",  emoji: "👥" },
];

export default function AdminLayout({ children, title, subtitle }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    removeToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="al-root">
      <aside className="al-sidebar">
        <div className="al-brand">
          <div className="al-brand-icon">C</div>
          <div>
            <div className="al-brand-name">CyberHygiene</div>
            <div className="al-brand-sub">Admin panel</div>
          </div>
        </div>

        <nav className="al-nav">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`al-nav-item${pathname === n.to ? " al-nav-item--active" : ""}`}
            >
              <span className="al-nav-emoji">{n.emoji}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        <button className="al-logout" onClick={handleLogout}>
          🚪 Выйти
        </button>
      </aside>

      <main className="al-main">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {(title || subtitle) && (
            <div className="al-page-head">
              {subtitle && <div className="al-page-eyebrow">{subtitle}</div>}
              {title && <h1 className="al-page-title">{title}</h1>}
            </div>
          )}
          {children}
        </motion.div>
      </main>
    </div>
  );
}
