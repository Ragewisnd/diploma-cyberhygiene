import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { getCurrentUser, getDashboardMe } from "../api";

function statusText(p) {
  if (p >= 100) return "Курс завершён";
  if (p >= 70)  return "Почти готово";
  if (p > 0)    return "В процессе";
  return "Не начат";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ok = true;
    Promise.all([getCurrentUser(), getDashboardMe()])
      .then(([u, d]) => { if (ok) { setUser(u); setDash(d); } })
      .catch((e) => { if (ok) setError(e.message); })
      .finally(() => { if (ok) setLoading(false); });
    return () => { ok = false; };
  }, []);

  const active = useMemo(() => {
    if (!dash?.courses?.length) return null;
    return dash.courses.find((c) => c.progress_percent < 100) || dash.courses[0];
  }, [dash]);

  if (loading) return (
    <UserLayout>
      <div className="ul-loading">Загрузка...</div>
    </UserLayout>
  );

  return (
    <UserLayout>
      {error && <div className="ul-error">{error}</div>}

      {/* Hero */}
      <div className="db-hero">
        <div className="db-hero-left">
          <div className="db-avatar">{user?.full_name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div className="db-welcome">Добро пожаловать</div>
            <div className="db-name">{user?.full_name || "Пользователь"}</div>
            <div className="db-sub">Уровень {user?.level ?? 0}</div>
          </div>
        </div>

        <div className="db-stats">
          <div className="db-stat">
            <div className="db-stat-val">{dash?.stats?.total_courses ?? 0}</div>
            <div className="db-stat-lbl">Курсов</div>
          </div>
          <div className="db-stat">
            <div className="db-stat-val">{dash?.stats?.completed_progress_items ?? 0}</div>
            <div className="db-stat-lbl">Шагов</div>
          </div>
          <div className="db-stat">
            <div className="db-stat-val">{active ? active.progress_percent + "%" : "—"}</div>
            <div className="db-stat-lbl">Прогресс</div>
          </div>
        </div>
      </div>

      {/* Active course card */}
      {active && (
        <div className="db-active-card">
          <div className="db-active-top">
            <div>
              <div className="db-eyebrow">Текущий курс</div>
              <div className="db-active-title">{active.course_title}</div>
              <div className="db-active-sub">{statusText(active.progress_percent)} · {active.completed_modules}/{active.total_modules} модулей</div>
            </div>
            <div className="db-active-pct">{active.progress_percent}%</div>
          </div>
          <div className="db-progress-track">
            <motion.div
              className="db-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${active.progress_percent}%` }}
              transition={{ duration: 0.8, delay: 0.1 }}
            />
          </div>
          <div className="db-active-foot">
            <span className="db-active-hint">
              {active.progress_percent >= 100 ? "Доступны результаты" : "Продолжи с того места, где остановился"}
            </span>
            <button className="primary-btn" onClick={() => navigate(`/course/${active.course_id}`)}>
              Продолжить
            </button>
          </div>
        </div>
      )}

      {/* All courses */}
      <div className="db-section">
        <div className="db-section-head">
          <div className="db-eyebrow">МОИ КУРСЫ</div>
          <div className="db-section-title">Назначенные программы</div>
        </div>

        <div className="db-course-list">
          {dash?.courses?.map((c, i) => (
            <motion.div
              key={c.course_id}
              className="db-course-row"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <div className="db-course-dot" style={{ background: c.progress_percent >= 100 ? "#82b99a" : c.progress_percent > 0 ? "#7a8fe8" : "#ccc" }} />
              <div className="db-course-info">
                <div className="db-course-title">{c.course_title}</div>
                <div className="db-course-sub">{c.completed_modules}/{c.total_modules} модулей · {statusText(c.progress_percent)}</div>
                <div className="db-progress-track" style={{ marginTop: 8 }}>
                  <motion.div
                    className="db-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress_percent}%` }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.05 }}
                  />
                </div>
              </div>
              <div className="db-course-right">
                <div className="db-course-pct">{c.progress_percent}%</div>
                <button className="ghost-btn" style={{ fontSize: 13 }} onClick={() => navigate(`/course/${c.course_id}`)} >
                  Открыть
                </button>
              </div>
            </motion.div>
          ))}
          {!dash?.courses?.length && (
            <div className="ul-empty">📚 Курсов пока нет. Обратитесь к администратору.</div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
