import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

export default function UserLayout({ children, backTo, backLabel }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="ul-root">
      <header className="ul-topbar">
        <div className="ul-brand">
          <div className="ul-brand-icon">C</div>
          <span className="ul-brand-name">CyberHygiene</span>
        </div>

        <nav className="ul-nav">
          <Link to="/dashboard" className="ul-nav-link">📈 Кабинет</Link>
        </nav>

        <button className="ul-logout" onClick={handleLogout}>
          🚪 Выйти
        </button>
      </header>

      <main className="ul-main">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {backTo && (
            <div className="ul-breadcrumb">
              <Link to={backTo} className="ul-back">← {backLabel || "Назад"}</Link>
            </div>
          )}
          {children}
        </motion.div>
      </main>
    </div>
  );
}
