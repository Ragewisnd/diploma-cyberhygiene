import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../components/PageTransition";
import {
  adminGetReportsOverview,
  adminGetCourses,
  clearToken,
} from "../../api";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [ov, cr] = await Promise.all([
          adminGetReportsOverview(),
          adminGetCourses(),
        ]);
        if (!mounted) return;
        setOverview(ov);
        setCourses(cr);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <PageTransition className="page-shell">
      <header className="app-header">
        <div>
          <p className="app-header-label">Панель администратора</p>
          <h1>CyberHygiene Admin</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button
            className="ghost-btn"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate("/admin/courses")}
          >
            Курсы
          </motion.button>
          <motion.button
            className="ghost-btn"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate("/admin/users")}
          >
            Пользователи
          </motion.button>
          <motion.button
            className="ghost-btn"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={handleLogout}
          >
            Выйти
          </motion.button>
        </div>
      </header>

      {error && <div className="error-box">{error}</div>}

      {loading && <div className="loading-card">Загружаю аналитику...</div>}

      {overview && (
        <>
          <section className="admin-kpi-grid">
            {[
              { label: "Пользователей", value: overview.total_users },
              { label: "Курсов", value: overview.total_courses },
              { label: "Записей на курсы", value: overview.total_enrollments },
              { label: "Попыток тестов", value: overview.total_attempts },
              { label: "Сдали тест", value: `${overview.pass_rate}%` },
              { label: "Средний балл", value: `${overview.avg_score}%` },
              { label: "Completion rate", value: `${overview.completion_rate}%` },
            ].map((kpi) => (
              <motion.div
                key={kpi.label}
                className="admin-kpi-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span>{kpi.label}</span>
                <strong>{kpi.value}</strong>
              </motion.div>
            ))}
          </section>

          <section className="admin-courses-panel">
            <div className="section-head section-head-tight">
              <div>
                <span className="eyebrow">Курсы</span>
                <h2>Быстрый доступ к редактированию</h2>
              </div>
              <motion.button
                className="primary-btn"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => navigate("/admin/courses")}
              >
                Все курсы
              </motion.button>
            </div>

            <div className="course-list">
              {courses.slice(0, 5).map((course) => (
                <motion.article
                  key={course._id}
                  className="course-row"
                  whileHover={{ y: -2 }}
                >
                  <div className="course-row-main">
                    <div className="course-row-head">
                      <div>
                        <h3>{course.title}</h3>
                        <p className="muted">{course.description}</p>
                      </div>
                      <span className={`status-pill ${course.is_published ? "done" : ""}`}>
                        {course.is_published ? "Опубликован" : "Черновик"}
                      </span>
                    </div>
                  </div>
                  <div className="course-row-side">
                    <motion.button
                      className="ghost-btn"
                      whileHover={{ y: -1 }}
                      onClick={() => navigate(`/admin/courses/${course._id}`)}
                    >
                      Редактировать
                    </motion.button>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        </>
      )}
    </PageTransition>
  );
}
