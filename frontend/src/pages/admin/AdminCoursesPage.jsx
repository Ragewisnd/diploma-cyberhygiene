import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../../components/PageTransition";
import {
  adminGetCourses,
  adminCreateCourse,
  adminDeleteCourse,
  adminUpdateCourse,
} from "../../api";

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "general", is_published: false });
  const [saving, setSaving] = useState(false);

  async function loadCourses() {
    try {
      const data = await adminGetCourses();
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCourses(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateCourse(form);
      setForm({ title: "", description: "", category: "general", is_published: false });
      setShowForm(false);
      await loadCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(courseId) {
    if (!window.confirm("Удалить курс и все его данные?")) return;
    try {
      await adminDeleteCourse(courseId);
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTogglePublish(course) {
    try {
      await adminUpdateCourse(course._id, { is_published: !course.is_published });
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PageTransition className="page-shell">
      <header className="app-header">
        <div>
          <p className="app-header-label">Администратор</p>
          <h1>Управление курсами</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button
            className="ghost-btn"
            whileHover={{ y: -1 }}
            onClick={() => navigate("/admin")}
          >
            ← Назад
          </motion.button>
          <motion.button
            className="primary-btn"
            whileHover={{ y: -1 }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Отмена" : "+ Новый курс"}
          </motion.button>
        </div>
      </header>

      {error && <div className="error-box">{error}</div>}

      {showForm && (
        <motion.form
          className="admin-form-card"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
        >
          <h3>Новый курс</h3>
          <div className="form-stack">
            <label>
              <span>Название</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Основы кибергигиены"
                required
              />
            </label>
            <label>
              <span>Описание</span>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Краткое описание курса"
                required
              />
            </label>
            <label>
              <span>Категория</span>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="general"
              />
            </label>
            <label style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              <span>Опубликовать сразу</span>
            </label>
            <motion.button
              className="primary-btn"
              type="submit"
              disabled={saving}
              whileHover={{ y: -1 }}
            >
              {saving ? "Создаю..." : "Создать курс"}
            </motion.button>
          </div>
        </motion.form>
      )}

      {loading && <div className="loading-card">Загружаю курсы...</div>}

      <div className="course-list">
        {courses.map((course, index) => (
          <motion.article
            key={course._id}
            className="course-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
          >
            <div className="course-row-main">
              <div className="course-row-head">
                <div>
                  <h3>{course.title}</h3>
                  <p className="muted">{course.description}</p>
                </div>
                <div className="course-row-meta">
                  <span className={`status-pill ${course.is_published ? "done" : ""}`}>
                    {course.is_published ? "Опубликован" : "Черновик"}
                  </span>
                  <span className="muted" style={{ fontSize: 13 }}>{course.category}</span>
                </div>
              </div>
            </div>
            <div className="course-row-side">
              <motion.button
                className="ghost-btn"
                whileHover={{ y: -1 }}
                onClick={() => handleTogglePublish(course)}
              >
                {course.is_published ? "Снять" : "Опубликовать"}
              </motion.button>
              <motion.button
                className="ghost-btn"
                whileHover={{ y: -1 }}
                onClick={() => navigate(`/admin/courses/${course._id}`)}
              >
                Редактировать
              </motion.button>
              <motion.button
                className="ghost-btn"
                style={{ color: "var(--danger)" }}
                whileHover={{ y: -1 }}
                onClick={() => handleDelete(course._id)}
              >
                Удалить
              </motion.button>
            </div>
          </motion.article>
        ))}
      </div>
    </PageTransition>
  );
}
