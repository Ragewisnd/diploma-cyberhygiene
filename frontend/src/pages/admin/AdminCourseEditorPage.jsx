import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTransition from "../../components/PageTransition";
import {
  adminGetModules,
  adminCreateModule,
  adminUpdateModule,
  adminDeleteModule,
  adminGetTests,
  adminCreateTest,
  adminUpdateTest,
  adminGetReportsCourse,
} from "../../api";

const EMPTY_BLOCK = { order: 1, type: "text", title: "", text: "" };
const EMPTY_QUESTION = { question: "", options: ["", "", "", ""], correct_answer: "", explanation: "", order: 0 };

export default function AdminCourseEditorPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [tests, setTests] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("modules");

  const [moduleForm, setModuleForm] = useState({
    title: "", module_type: "lesson", order: 1,
    is_required: true, estimated_minutes: 10,
    content: [{ ...EMPTY_BLOCK }]
  });

  const [testForm, setTestForm] = useState({
    title: "Итоговый тест", description: "",
    pass_percent: 70, shuffle_questions: false,
    questions: [{ ...EMPTY_QUESTION }]
  });

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingTestId, setEditingTestId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [mods, ts, rep] = await Promise.all([
        adminGetModules(courseId),
        adminGetTests(courseId),
        adminGetReportsCourse(courseId),
      ]);
      setModules(mods);
      setTests(ts);
      setReport(rep);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [courseId]);

  // ─ module helpers ────────────────────────────────────────────────────

  function addBlock() {
    setModuleForm((f) => ({
      ...f,
      content: [
        ...f.content,
        { order: f.content.length + 1, type: "text", title: "", text: "" }
      ]
    }));
  }

  function updateBlock(index, field, value) {
    setModuleForm((f) => {
      const content = [...f.content];
      content[index] = { ...content[index], [field]: value };
      return { ...f, content };
    });
  }

  function removeBlock(index) {
    setModuleForm((f) => ({
      ...f,
      content: f.content.filter((_, i) => i !== index)
    }));
  }

  function startEditModule(module) {
    setEditingModuleId(module._id);
    setModuleForm({
      title: module.title,
      module_type: module.module_type,
      order: module.order,
      is_required: module.is_required,
      estimated_minutes: module.estimated_minutes,
      content: module.content?.length ? module.content : [{ ...EMPTY_BLOCK }]
    });
    setShowModuleForm(true);
    setActiveTab("modules");
  }

  async function handleSaveModule(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...moduleForm, course_id: courseId };
      if (editingModuleId) {
        await adminUpdateModule(editingModuleId, payload);
      } else {
        await adminCreateModule(payload);
      }
      setShowModuleForm(false);
      setEditingModuleId(null);
      setModuleForm({ title: "", module_type: "lesson", order: modules.length + 1, is_required: true, estimated_minutes: 10, content: [{ ...EMPTY_BLOCK }] });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteModule(moduleId) {
    if (!window.confirm("Удалить модуль?")) return;
    try {
      await adminDeleteModule(moduleId);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  // ─ test helpers ───────────────────────────────────────────────────

  function addQuestion() {
    setTestForm((f) => ({
      ...f,
      questions: [
        ...f.questions,
        { ...EMPTY_QUESTION, order: f.questions.length }
      ]
    }));
  }

  function updateQuestion(index, field, value) {
    setTestForm((f) => {
      const questions = [...f.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { ...f, questions };
    });
  }

  function updateOption(qIndex, oIndex, value) {
    setTestForm((f) => {
      const questions = [...f.questions];
      const options = [...questions[qIndex].options];
      options[oIndex] = value;
      questions[qIndex] = { ...questions[qIndex], options };
      return { ...f, questions };
    });
  }

  function removeQuestion(index) {
    setTestForm((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== index)
    }));
  }

  function startEditTest(test) {
    setEditingTestId(test._id);
    setTestForm({
      title: test.title,
      description: test.description,
      pass_percent: test.pass_percent,
      shuffle_questions: test.shuffle_questions,
      questions: test.questions?.length ? test.questions : [{ ...EMPTY_QUESTION }]
    });
    setShowTestForm(true);
    setActiveTab("tests");
  }

  async function handleSaveTest(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...testForm, course_id: courseId };
      if (editingTestId) {
        await adminUpdateTest(editingTestId, payload);
      } else {
        await adminCreateTest(payload);
      }
      setShowTestForm(false);
      setEditingTestId(null);
      setTestForm({ title: "Итоговый тест", description: "", pass_percent: 70, shuffle_questions: false, questions: [{ ...EMPTY_QUESTION }] });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTransition className="page-shell">
      <header className="app-header">
        <div>
          <p className="app-header-label">Редактор курса</p>
          <h1>Модули, тесты и аналитика</h1>
        </div>
        <motion.button
          className="ghost-btn"
          whileHover={{ y: -1 }}
          onClick={() => navigate("/admin/courses")}
        >
          ← Назад
        </motion.button>
      </header>

      {error && <div className="error-box">{error}</div>}

      <div className="admin-tabs">
        {["modules", "tests", "analytics"].map((tab) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "modules" ? "Модули" : tab === "tests" ? "Тесты" : "Аналитика"}
          </button>
        ))}
      </div>

      {loading && <div className="loading-card">Загружаю данные курса...</div>}

      {activeTab === "modules" && !loading && (
        <>
          <div className="section-head section-head-tight">
            <h2>Модули курса</h2>
            <motion.button
              className="primary-btn"
              whileHover={{ y: -1 }}
              onClick={() => { setEditingModuleId(null); setShowModuleForm((v) => !v); }}
            >
              {showModuleForm && !editingModuleId ? "Отмена" : "+ Модуль"}
            </motion.button>
          </div>

          {showModuleForm && (
            <motion.form
              className="admin-form-card"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSaveModule}
            >
              <h3>{editingModuleId ? "Редактировать модуль" : "Новый модуль"}</h3>
              <div className="form-stack">
                <label><span>Название модуля</span>
                  <input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Введение в кибергигиену" required />
                </label>
                <label><span>Тип модуля</span>
                  <select className="admin-select" value={moduleForm.module_type} onChange={(e) => setModuleForm({ ...moduleForm, module_type: e.target.value })}>
                    <option value="intro">Введение</option>
                    <option value="lesson">Урок</option>
                    <option value="lecture">Лекция</option>
                    <option value="practice">Практика</option>
                    <option value="test">Тест</option>
                  </select>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label><span>Порядок</span>
                    <input type="number" value={moduleForm.order} onChange={(e) => setModuleForm({ ...moduleForm, order: +e.target.value })} />
                  </label>
                  <label><span>Минут на изучение</span>
                    <input type="number" value={moduleForm.estimated_minutes} onChange={(e) => setModuleForm({ ...moduleForm, estimated_minutes: +e.target.value })} />
                  </label>
                </div>

                <div className="admin-blocks-section">
                  <div className="section-head section-head-tight">
                    <span className="eyebrow">Блоки содержимого</span>
                    <button type="button" className="ghost-btn" onClick={addBlock}>+ Блок</button>
                  </div>
                  {moduleForm.content.map((block, i) => (
                    <div key={i} className="admin-block-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <strong>Блок {i + 1}</strong>
                        <button type="button" className="ghost-btn" style={{ color: "var(--danger)" }} onClick={() => removeBlock(i)}>Удалить</button>
                      </div>
                      <label><span>Заголовок блока</span>
                        <input value={block.title} onChange={(e) => updateBlock(i, "title", e.target.value)} placeholder="Что такое кибергигиена" />
                      </label>
                      <label style={{ marginTop: 10 }}><span>Текст</span>
                        <textarea className="admin-textarea" value={block.text} onChange={(e) => updateBlock(i, "text", e.target.value)} placeholder="Текст блока..." rows={4} />
                      </label>
                    </div>
                  ))}
                </div>

                <motion.button className="primary-btn" type="submit" disabled={saving} whileHover={{ y: -1 }}>
                  {saving ? "Сохраняю..." : editingModuleId ? "Сохранить изменения" : "Создать модуль"}
                </motion.button>
              </div>
            </motion.form>
          )}

          <div className="course-list">
            {modules.map((mod, index) => (
              <motion.article key={mod._id} className="course-row" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -2 }}>
                <div className="course-row-main">
                  <div className="course-row-head">
                    <div>
                      <h3>{mod.order}. {mod.title}</h3>
                      <p className="muted">{mod.module_type} · {mod.estimated_minutes} мин · {mod.content?.length || 0} блоков</p>
                    </div>
                  </div>
                </div>
                <div className="course-row-side">
                  <motion.button className="ghost-btn" whileHover={{ y: -1 }} onClick={() => startEditModule(mod)}>Редактировать</motion.button>
                  <motion.button className="ghost-btn" style={{ color: "var(--danger)" }} whileHover={{ y: -1 }} onClick={() => handleDeleteModule(mod._id)}>Удалить</motion.button>
                </div>
              </motion.article>
            ))}
          </div>
        </>
      )}

      {activeTab === "tests" && !loading && (
        <>
          <div className="section-head section-head-tight">
            <h2>Тесты курса</h2>
            <motion.button className="primary-btn" whileHover={{ y: -1 }} onClick={() => { setEditingTestId(null); setShowTestForm((v) => !v); }}>
              {showTestForm && !editingTestId ? "Отмена" : "+ Тест"}
            </motion.button>
          </div>

          {showTestForm && (
            <motion.form className="admin-form-card" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSaveTest}>
              <h3>{editingTestId ? "Редактировать тест" : "Новый тест"}</h3>
              <div className="form-stack">
                <label><span>Название теста</span>
                  <input value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} required />
                </label>
                <label><span>Описание</span>
                  <input value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} />
                </label>
                <label><span>Проходной балл (%)</span>
                  <input type="number" value={testForm.pass_percent} onChange={(e) => setTestForm({ ...testForm, pass_percent: +e.target.value })} min={0} max={100} />
                </label>

                <div className="admin-blocks-section">
                  <div className="section-head section-head-tight">
                    <span className="eyebrow">Вопросы</span>
                    <button type="button" className="ghost-btn" onClick={addQuestion}>+ Вопрос</button>
                  </div>
                  {testForm.questions.map((q, qi) => (
                    <div key={qi} className="admin-block-card">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <strong>Вопрос {qi + 1}</strong>
                        <button type="button" className="ghost-btn" style={{ color: "var(--danger)" }} onClick={() => removeQuestion(qi)}>Удалить</button>
                      </div>
                      <label><span>Текст вопроса</span>
                        <input value={q.question} onChange={(e) => updateQuestion(qi, "question", e.target.value)} placeholder="Как создать надежный пароль?" />
                      </label>
                      <div style={{ marginTop: 10 }}>
                        <span className="muted" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>Варианты ответов</span>
                        {q.options.map((opt, oi) => (
                          <input key={oi} style={{ marginBottom: 6 }} value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Вариант ${oi + 1}`} />
                        ))}
                      </div>
                      <label style={{ marginTop: 8 }}><span>Правильный ответ (точно как выше)</span>
                        <input value={q.correct_answer} onChange={(e) => updateQuestion(qi, "correct_answer", e.target.value)} placeholder="Вариант 1" />
                      </label>
                      <label style={{ marginTop: 8 }}><span>Пояснение (необязательно)</span>
                        <input value={q.explanation} onChange={(e) => updateQuestion(qi, "explanation", e.target.value)} />
                      </label>
                    </div>
                  ))}
                </div>

                <motion.button className="primary-btn" type="submit" disabled={saving} whileHover={{ y: -1 }}>
                  {saving ? "Сохраняю..." : editingTestId ? "Сохранить тест" : "Создать тест"}
                </motion.button>
              </div>
            </motion.form>
          )}

          <div className="course-list">
            {tests.map((test) => (
              <motion.article key={test._id} className="course-row" whileHover={{ y: -2 }}>
                <div className="course-row-main">
                  <div className="course-row-head">
                    <div>
                      <h3>{test.title}</h3>
                      <p className="muted">{test.description} · проходной балл {test.pass_percent}% · {test.questions?.length || 0} вопросов</p>
                    </div>
                  </div>
                </div>
                <div className="course-row-side">
                  <motion.button className="ghost-btn" whileHover={{ y: -1 }} onClick={() => startEditTest(test)}>Редактировать</motion.button>
                </div>
              </motion.article>
            ))}
          </div>
        </>
      )}

      {activeTab === "analytics" && report && (
        <div className="admin-analytics-panel">
          <div className="admin-kpi-grid">
            {[
              { label: "Записано на курс", value: report.total_enrolled },
              { label: "Завершили курс", value: report.users_completed_all },
              { label: "Completion rate", value: `${report.overall_completion_rate}%` },
              { label: "Попыток тестов", value: report.total_attempts },
              { label: "Сдали тест", value: `${report.pass_rate}%` },
              { label: "Средний балл", value: `${report.avg_score}%` },
            ].map((kpi) => (
              <div key={kpi.label} className="admin-kpi-card">
                <span>{kpi.label}</span>
                <strong>{kpi.value}</strong>
              </div>
            ))}
          </div>

          <div className="section-head section-head-tight" style={{ marginTop: 22 }}>
            <h2>Прохождение по модулям</h2>
          </div>

          <div className="course-list">
            {report.module_stats.map((mod) => (
              <div key={mod.module_id} className="course-row">
                <div className="course-row-main">
                  <div className="course-row-head">
                    <div>
                      <h3>{mod.order}. {mod.title}</h3>
                      <p className="muted">Завершили: {mod.completed_by} из {report.total_enrolled}</p>
                    </div>
                    <strong>{mod.completion_rate}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${mod.completion_rate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
