import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { getAdminCourses, createAdminCourse, deleteAdminCourse, updateAdminCourse } from "../../api";
import { Link } from "react-router-dom";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setCourses(await getAdminCourses()); } catch {}
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title) return;
    setLoading(true);
    try {
      await createAdminCourse(form);
      setForm({ title: "", description: "", category: "" });
      setShowForm(false);
      await load();
    } catch {}
    setLoading(false);
  }

  async function handleToggle(c) {
    try {
      await updateAdminCourse(c._id, { is_published: !c.is_published });
      await load();
    } catch {}
  }

  async function handleDelete(id) {
    if (!confirm("Удалить курс?")) return;
    try { await deleteAdminCourse(id); await load(); } catch {}
  }

  return (
    <AdminLayout title="Курсы" subtitle="УПРАВЛЕНИЕ">
      <div className="ad-toolbar">
        <button className="primary-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "× Отмена" : "+ Новый курс"}
        </button>
      </div>

      {showForm && (
        <form className="ad-form-card" onSubmit={handleCreate}>
          <h3>Новый курс</h3>
          <div className="ad-form-grid">
            <label className="ad-label">
              Название
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Основы кибергигиены" />
            </label>
            <label className="ad-label">
              Категория
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="например, Пароли" />
            </label>
          </div>
          <label className="ad-label" style={{ marginTop: 14 }}>
            Описание
            <textarea className="ad-textarea" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Краткое описание курса" />
          </label>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? "Создание..." : "Создать"}
            </button>
            <button className="ghost-btn" type="button" onClick={() => setShowForm(false)}>Отмена</button>
          </div>
        </form>
      )}

      <div className="ad-course-list">
        {courses.map((c) => (
          <div className="ad-course-row" key={c._id}>
            <div className="ad-course-info">
              <div className="ad-course-title">{c.title}</div>
              <div className="ad-course-desc">{c.description || "Описание не добавлено"}</div>
              {c.category && <span className="ad-badge ad-badge--blue">{c.category}</span>}
            </div>
            <div className="ad-course-actions">
              <span
                className={`ad-badge ${c.is_published ? "ad-badge--green" : "ad-badge--orange"}`}
                style={{ cursor: "pointer" }}
                onClick={() => handleToggle(c)}
                title="Нажмите чтобы сменить статус"
              >
                {c.is_published ? "Опубликован" : "Черновик"}
              </span>
              <Link to={`/admin/courses/${c._id}`} className="ghost-btn" style={{ fontSize: 13, padding: "8px 14px" }}>
                Редактировать
              </Link>
              <button className="ad-btn-danger" onClick={() => handleDelete(c._id)}>Удалить</button>
            </div>
          </div>
        ))}
        {courses.length === 0 && <div className="ad-empty">Курсов пока нет. Создайте первый!</div>}
      </div>
    </AdminLayout>
  );
}
