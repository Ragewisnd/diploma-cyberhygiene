import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { completeModule, getCourseDashboard, getCurrentUser, clearToken } from "../api";

function normalizeModuleTitle(title, type, order) {
  const map = {
    Introduction: "Введение в кибергигиену",
    "Business Gifts": "Безопасность электронной почты",
    Entertainment: "Безопасное поведение в сети",
  };
  if (map[title]) return map[title];
  if (type === "intro") return "Введение в курс";
  if (type === "test" || type === "quiz") return "Итоговое тестирование";
  return `Модуль ${order}`;
}

function getTypeLabel(type) {
  return { intro:"Введение", theory:"Теория", lecture:"Лекция", practice:"Практика", lesson:"Урок", test:"Тест", quiz:"Тест" }[type] || "Модуль";
}

function buildLessonContent(module, courseTitle) {
  const normalizedTitle = normalizeModuleTitle(module?.title, module?.module_type, module?.order);
  const contentMap = {
    "Введение в кибергигиену": {
      lead: `Раздел «${normalizedTitle}» курса «${courseTitle}» знакомит с базовыми принципами безопасной цифровой среды.`,
      blocks: [
        { title: "Что такое кибергигиена", text: "Кибергигиена - это совокупность повседневных правил и привычек, которые помогают защищать учетные записи, устройства, персональные данные и рабочую информацию от цифровых угроз." },
        { title: "Почему это важно", text: "Большинство инцидентов начинается не со сложных атак, а с простых ошибок пользователя: слабого пароля, перехода по подозрительной ссылке, установки сомнительного файла." },
        { title: "Главная цель раздела", text: "После изучения этого материала пользователь должен понимать, что личная цифровая безопасность строится на регулярных осознанных действиях и внимательности." },
      ],
    },
    "Безопасность электронной почты": {
      lead: `Раздел посвящен безопасной работе с электронной почтой, так как именно письма часто становятся источником фишинга.`,
      blocks: [
        { title: "Проверка отправителя", text: "Перед открытием письма нужно внимательно сверять адрес отправителя, домен и общий контекст сообщения. Поддельные письма нередко маскируются под знакомые сервисы." },
        { title: "Осторожность со ссылками", text: "Не следует открывать вложения и переходить по ссылкам, если сообщение вызывает сомнение. Особенно опасны архивы, исполняемые файлы и документы с макросами." },
        { title: "Практическое правило", text: "Если письмо кажется подозрительным, безопаснее проверить информацию через официальный сайт или связаться с отправителем по другому каналу." },
      ],
    },
    "Безопасное поведение в сети": {
      lead: `Раздел показывает, как безопасно вести себя в интернете и избегать типовых сценариев цифрового обмана.`,
      blocks: [
        { title: "Надежные пароли", text: "Для разных сервисов необходимо использовать разные сложные пароли и по возможности включать двухфакторную аутентификацию." },
        { title: "Проверка сайтов", text: "Перед вводом данных нужно смотреть на адрес сайта, наличие защищенного соединения и общее качество страницы." },
        { title: "Цифровая внимательность", text: "Безопасное поведение - это постоянная оценка контекста: кто просит данные, зачем, насколько это ожидаемо." },
      ],
    },
  };
  return contentMap[normalizedTitle] || {
    lead: `Раздел «${normalizedTitle}» курса «${courseTitle}».`,
    blocks: [
      { title: "Содержание раздела", text: "В этом модуле рассматриваются правила безопасного поведения в цифровой среде." },
    ],
  };
}

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [user, setUser] = useState(null);
  const [courseView, setCourseView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [readReady, setReadReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sidebarWide, setSidebarWide] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let ok = true;
    async function load() {
      try {
        const [me, data] = await Promise.all([getCurrentUser(), getCourseDashboard(courseId)]);
        if (!ok) return;
        setUser(me);
        setCourseView(data);
        const first = data.modules.findIndex((m) => !m.completed);
        setActiveIndex(first >= 0 ? first : 0);
      } catch (err) {
        if (ok) setError(err.message);
      } finally {
        if (ok) setLoading(false);
      }
    }
    load();
    return () => { ok = false; };
  }, [courseId]);

  const modules = courseView?.modules || [];
  const activeModule = modules[activeIndex];
  const activeModuleTitle = activeModule ? normalizeModuleTitle(activeModule.title, activeModule.module_type, activeModule.order) : "";
  const lessonContent = useMemo(() => buildLessonContent(activeModule, courseView?.course_title || "Курс"), [activeModule, courseView]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeModule) return;
    setReadReady(false);
    const check = () => { if (el.scrollTop + el.clientHeight >= el.scrollHeight - 18) setReadReady(true); };
    check();
    el.addEventListener("scroll", check);
    return () => el.removeEventListener("scroll", check);
  }, [activeModule?._id]);

  useEffect(() => {
    if (!activeModule || activeModule.completed) return;
    if (activeModule.module_type === "test" || activeModule.module_type === "quiz") return;
    if (!readReady || syncing) return;
    let cancelled = false;
    async function save() {
      try {
        setSyncing(true);
        await completeModule(courseId, activeModule.module_type, activeModule.title, activeModule.order);
        const updated = await getCourseDashboard(courseId);
        if (cancelled) return;
        setCourseView(updated);
        const idx = updated.modules.findIndex((m) => m.order === activeModule.order);
        setActiveIndex(idx >= 0 ? idx : 0);
      } catch { if (!cancelled) setError("Не удалось сохранить прогресс."); }
      finally { if (!cancelled) setSyncing(false); }
    }
    save();
    return () => { cancelled = true; };
  }, [readReady, activeModule?._id, courseId, syncing, activeModule]);

  function handleLogout() { clearToken(); navigate("/login", { replace: true }); }

  if (loading) return (
    <div className="ul-root">
      <header className="ul-topbar">
        <div className="ul-brand"><div className="ul-brand-icon">C</div><span className="ul-brand-name">CyberHygiene</span></div>
      </header>
      <div className="ul-main"><div className="ul-loading">Загрузка курса...</div></div>
    </div>
  );

  const sidebarWidth = sidebarCollapsed ? 60 : sidebarWide ? 320 : 220;

  return (
    <div className="ul-root">
      {/* topbar */}
      <header className="ul-topbar">
        <div className="ul-brand">
          <div className="ul-brand-icon">C</div>
          <span className="ul-brand-name">CyberHygiene</span>
        </div>
        <nav className="ul-nav">
          <Link to="/dashboard" className="ul-nav-link">📈 Кабинет</Link>
        </nav>
        <button className="ul-logout" onClick={handleLogout}>🚪 Выйти</button>
      </header>

      {error && <div style={{ padding: "12px 24px" }}><div className="ul-error">{error}</div></div>}

      {courseView && activeModule && (
        <div className="cp-layout" style={{ gridTemplateColumns: `${sidebarWidth}px 1fr` }}>

          {/* sidebar */}
          <aside className="cp-sidebar">
            {/* sidebar controls */}
            <div className="cp-sidebar-controls">
              {!sidebarCollapsed && (
                <button
                  className="cp-sidebar-btn"
                  title={sidebarWide ? "Свернуть" : "Расширить"}
                  onClick={() => setSidebarWide((v) => !v)}
                >
                  {sidebarWide ? "‹" : "›"}
                </button>
              )}
              <button
                className="cp-sidebar-btn"
                title={sidebarCollapsed ? "Развернуть" : "Свернуть"}
                onClick={() => { setSidebarCollapsed((v) => !v); if (!sidebarCollapsed) setSidebarWide(false); }}
              >
                {sidebarCollapsed ? "»" : "«"}
              </button>
            </div>

            {/* progress */}
            {!sidebarCollapsed && (
              <div className="cp-sidebar-progress">
                <div className="db-eyebrow">ПРОГРЕСС</div>
                <div className="cp-progress-val">{courseView.progress_percent}%</div>
                <div className="db-progress-track">
                  <motion.div
                    className="db-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${courseView.progress_percent}%` }}
                    transition={{ duration: 0.65 }}
                  />
                </div>
              </div>
            )}

            {/* module nav */}
            <nav className="cp-module-nav">
              {modules.map((m, i) => {
                const isActive = i === activeIndex;
                const isTest = m.module_type === "test" || m.module_type === "quiz";
                const title = normalizeModuleTitle(m.title, m.module_type, m.order);
                return (
                  <motion.button
                    key={m._id || `${m.order}-${m.title}`}
                    className={`cp-module-item${isActive ? " cp-module-item--active" : ""}${m.completed ? " cp-module-item--done" : ""}`}
                    whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveIndex(i)}
                    title={sidebarCollapsed ? title : undefined}
                  >
                    <span className="cp-module-num">{m.order}</span>
                    {!sidebarCollapsed && (
                      <span className="cp-module-label">
                        <span className="cp-module-title">{title}</span>
                        <span className="cp-module-type">{isTest ? "Итоговый тест" : getTypeLabel(m.module_type)}</span>
                      </span>
                    )}
                    <span className={`cp-module-state${m.completed ? " done" : ""}`}>
                      {m.completed ? "✓" : isTest ? "📝" : ""}
                    </span>
                  </motion.button>
                );
              })}
            </nav>
          </aside>

          {/* content */}
          <main className="cp-content">
            <div className="cp-content-head">
              <div>
                <div className="db-eyebrow">{getTypeLabel(activeModule.module_type)}</div>
                <h1 className="cp-content-title">{activeIndex + 1}. {activeModuleTitle}</h1>
                <div className="cp-content-sub">{courseView.course_title} · {user?.full_name}</div>
              </div>
              <span className={`ad-badge ${activeModule.completed ? "ad-badge--green" : "ad-badge--orange"}`}>
                {activeModule.completed ? "Пройден" : "В процессе"}
              </span>
            </div>

            {activeModule.module_type === "test" || activeModule.module_type === "quiz" ? (
              <div className="cp-test-cta">
                <div className="cp-test-icon">📝</div>
                <h2>Итоговое тестирование</h2>
                <p>Курс считается завершённым только после успешного прохождения тестирования. Нужно набрать не менее 70%.</p>
                <button className="primary-btn" onClick={() => navigate(`/course/${courseId}/test`)}>
                  Начать тест →
                </button>
              </div>
            ) : (
              <>
                <div className="cp-read-banner">
                  <span>Модуль засчитывается автоматически после полного просмотра содержимого</span>
                  <span className={readReady ? "cp-read-state ready" : "cp-read-state"}>
                    {readReady ? "✅ Просмотрен" : "Прокрути до конца"}
                  </span>
                </div>

                <div ref={scrollRef} className="cp-scroll">
                  <p className="cp-lead">{lessonContent.lead}</p>
                  <div className="cp-blocks">
                    {lessonContent.blocks.map((b, i) => (
                      <div key={i} className="cp-block">
                        <h3>{b.title}</h3>
                        <p>{b.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="cp-end">
                    <span>После изучения можно перейти к следующему модулю.</span>
                    {syncing && <span className="cp-syncing">Сохраняю прогресс...</span>}
                  </div>
                </div>
              </>
            )}

            <div className="cp-actions">
              <button className="ghost-btn" disabled={activeIndex === 0} onClick={() => setActiveIndex((p) => Math.max(p - 1, 0))}>← Назад</button>
              {activeIndex < modules.length - 1
                ? <button className="primary-btn" onClick={() => setActiveIndex((p) => Math.min(p + 1, modules.length - 1))}>Далее →</button>
                : <button className="primary-btn" onClick={() => navigate(`/course/${courseId}/test`)}>К тесту →</button>
              }
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
