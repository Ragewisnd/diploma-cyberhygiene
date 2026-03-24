import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../components/PageTransition";
import { adminGetUsers, adminGetCourses, adminEnrollUser, adminUpdateUser } from "../../api";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [u, c] = await Promise.all([adminGetUsers(), adminGetCourses()]);
        if (!mounted) return;
        setUsers(u);
        setCourses(c);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleEnroll(userId) {
    if (!selectedCourse) return;
    try {
      await adminEnrollUser(userId, selectedCourse);
      setEnrolling(null);
      setSelectedCourse("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleRole(user) {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await adminUpdateUser(user._id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => u._id === user._id ? { ...u, role: newRole } : u)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PageTransition className="page-shell">
      <header className="app-header">
        <div>
          <p className="app-header-label">Администратор</p>
          <h1>Управление пользователями</h1>
        </div>
        <motion.button className="ghost-btn" whileHover={{ y: -1 }} onClick={() => navigate("/admin")}>← Назад</motion.button>
      </header>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading-card">Загружаю пользователей...</div>}

      <div className="course-list">
        {users.map((user, index) => (
          <motion.article key={user._id} className="course-row" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -2 }}>
            <div className="course-row-main">
              <div className="course-row-head">
                <div>
                  <h3>{user.full_name}</h3>
                  <p className="muted">{user.email} · уровень {user.level ?? 0}</p>
                </div>
                <span className={`status-pill ${user.role === "admin" ? "done" : ""}`}>{user.role}</span>
              </div>
              {enrolling === user._id && (
                <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                  <select className="admin-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                    <option value="">Выбрать курс...</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                  <motion.button className="primary-btn" whileHover={{ y: -1 }} onClick={() => handleEnroll(user._id)}>Записать</motion.button>
                  <motion.button className="ghost-btn" whileHover={{ y: -1 }} onClick={() => setEnrolling(null)}>Отмена</motion.button>
                </div>
              )}
            </div>
            <div className="course-row-side">
              <motion.button className="ghost-btn" whileHover={{ y: -1 }} onClick={() => { setEnrolling(user._id); setSelectedCourse(""); }}>Записать на курс</motion.button>
              <motion.button className="ghost-btn" whileHover={{ y: -1 }} onClick={() => handleToggleRole(user)}>
                {user.role === "admin" ? "Сделать user" : "Сделать admin"}
              </motion.button>
            </div>
          </motion.article>
        ))}
      </div>
    </PageTransition>
  );
}
