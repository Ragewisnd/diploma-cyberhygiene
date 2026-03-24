import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import {
  clearToken,
  getCurrentUser,
  getDashboardMe,
} from "../api";

function getCourseStatusText(course) {
  if (!course) return "Нет активного курса";
  if (course.progress_percent >= 100) return "Курс завершен";
  if (course.progress_percent >= 70) return "Почти завершен";
  if (course.progress_percent > 0) return "В процессе";
  return "Еще не начат";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [me, dash] = await Promise.all([
          getCurrentUser(),
          getDashboardMe(),
        ]);

        if (!mounted) return;
        setUser(me);
        setDashboard(dash);
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const activeCourse = useMemo(() => {
    if (!dashboard?.courses?.length) return null;
    const incomplete = dashboard.courses.find(
      (course) => course.progress_percent < 100
    );
    return incomplete || dashboard.courses[0];
  }, [dashboard]);

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <PageTransition className="page-shell">
        <div className="loading-card">Загружаю кабинет...</div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="page-shell">
      <header className="app-header">
        <div>
          <p className="app-header-label">Личный кабинет</p>
          <h1>CyberHygiene</h1>
        </div>

        <motion.button
          className="ghost-btn"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
          onClick={handleLogout}
        >
          Выйти
        </motion.button>
      </header>

      {error && <div className="error-box">{error}</div>}

      {dashboard && (
        <>
          <section className="hero-panel">
            <div className="hero-panel-main">
              <div className="hero-user">
                <div className="hero-avatar">
                  {user?.full_name?.[0] || "R"}
                </div>

                <div>
                  <p className="hero-kicker">Добро пожаловать</p>
                  <h2>{user?.full_name || "Пользователь"}</h2>
                  <p className="muted">Уровень пользователя: {user?.level ?? 0}</p>
                </div>
              </div>

              <div className="hero-copy">
                <h3>Продолжай обучение без визуального шума</h3>
                <p className="muted">
                  Курс, прогресс и следующее действие собраны в одной спокойной
                  рабочей области без лишней дробности.
                </p>
              </div>

              <div className="hero-stats">
                <div className="stat-inline">
                  <span>Курсов</span>
                  <strong>{dashboard.stats.total_courses}</strong>
                </div>

                <div className="stat-inline">
                  <span>Шагов завершено</span>
                  <strong>{dashboard.stats.completed_progress_items}</strong>
                </div>

                <div className="stat-inline">
                  <span>Статус</span>
                  <strong>
                    {activeCourse?.progress_percent >= 100
                      ? "Завершено"
                      : "В процессе"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="hero-course-card">
              {activeCourse && (
                <>
                  <div className="hero-course-top">
                    <span className="course-chip">Текущий курс</span>
                    <strong>{activeCourse.progress_percent}%</strong>
                  </div>

                  <div className="hero-course-title">
                    <h4>{activeCourse.course_title}</h4>
                    <p className="muted">
                      {getCourseStatusText(activeCourse)} ·{" "}
                      {activeCourse.completed_modules}/{activeCourse.total_modules} модулей
                    </p>
                  </div>

                  <div className="progress-track large">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${activeCourse.progress_percent}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>

                  <div className="hero-course-bottom">
                    <span className="muted">
                      {activeCourse.progress_percent >= 100
                        ? "Доступны результаты"
                        : "Следующий шаг - открыть курс"}
                    </span>

                    <motion.button
                      className="primary-btn"
                      whileHover={{ y: -1, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => navigate(`/course/${activeCourse.course_id}`)}
                    >
                      Продолжить
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="courses-board">
            <div className="section-head section-head-tight">
              <div>
                <span className="eyebrow">Мои курсы</span>
                <h2>Назначенные программы обучения</h2>
              </div>
            </div>

            <div className="course-list">
              {dashboard.courses.map((course, index) => (
                <motion.article
                  key={course.course_id}
                  className="course-row"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  whileHover={{ y: -3 }}
                >
                  <div className="course-row-main">
                    <div className="course-row-head">
                      <div>
                        <h3>{course.course_title}</h3>
                        <p className="muted">
                          {course.completed_modules}/{course.total_modules} модулей завершено
                        </p>
                      </div>

                      <div className="course-row-meta">
                        <span className="course-chip">{course.status}</span>
                        <strong>{course.progress_percent}%</strong>
                      </div>
                    </div>

                    <div className="progress-track">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress_percent}%` }}
                        transition={{ duration: 0.75, delay: 0.15 }}
                      />
                    </div>
                  </div>

                  <div className="course-row-side">
                    <span className="muted">{getCourseStatusText(course)}</span>

                    <motion.button
                      className="ghost-btn"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => navigate(`/course/${course.course_id}`)}
                    >
                      Открыть
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