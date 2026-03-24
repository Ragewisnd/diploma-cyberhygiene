import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { getAdminReportsOverview, getAdminCourses } from "../../api";
import { Link } from "react-router-dom";

const KPI = [
  { key: "total_users",       label: "Пользователей",      icon: "◎", color: "#7a8fe8" },
  { key: "total_courses",     label: "Курсов",             icon: "◈", color: "#82b99a" },
  { key: "total_enrollments", label: "Записей на курсы",  icon: "⊞", color: "#a9c7f5" },
  { key: "total_attempts",    label: "Попыток тестов",  icon: "◷", color: "#efb36f" },
  { key: "pass_rate",         label: "Сдали тест",        icon: "✓",  color: "#82b99a", pct: true },
  { key: "avg_score",         label: "Средний балл",        icon: "◈", color: "#7a8fe8", pct: true },
  { key: "completion_rate",   label: "Completion rate",   icon: "⬡", color: "#a9c7f5", pct: true },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    getAdminReportsOverview().then(setStats).catch(() => {});
    getAdminCourses().then(setCourses).catch(() => {});
  }, []);

  function fmt(item) {
    if (!stats) return "—";
    const v = stats[item.key] ?? 0;
    return item.pct ? Math.round(v) + "%" : v;
  }

  return (
    <AdminLayout title="Панель администратора" subtitle="ОБЗОР">
      {/* KPI */}
      <div className="ad-kpi-grid">
        {KPI.map((k) => (
          <div className="ad-kpi-card" key={k.key}>
            <div className="ad-kpi-icon" style={{ background: k.color + "22", color: k.color }}>
              {k.icon}
            </div>
            <div className="ad-kpi-value">{fmt(k)}</div>
            <div className="ad-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div className="ad-section">
        <div className="ad-section-head">
          <div>
            <div className="ad-section-eyebrow">КУРСЫ</div>
            <h2 className="ad-section-title">Быстрый доступ к редактированию</h2>
          </div>
          <Link to="/admin/courses" className="primary-btn" style={{ fontSize: 14 }}>
            Все курсы
          </Link>
        </div>

        <div className="ad-course-list">
          {courses.slice(0, 5).map((c) => (
            <div className="ad-course-row" key={c._id}>
              <div className="ad-course-info">
                <div className="ad-course-title">{c.title}</div>
                <div className="ad-course-desc">{c.description}</div>
              </div>
              <div className="ad-course-actions">
                <span className={`ad-badge ${c.is_published ? "ad-badge--green" : "ad-badge--orange"}`}>
                  {c.is_published ? "Опубликован" : "Черновик"}
                </span>
                <Link to={`/admin/courses/${c._id}`} className="ghost-btn" style={{ fontSize: 13, padding: "8px 14px" }}>
                  Редактировать
                </Link>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="ad-empty">Курсы ещё не созданы</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
