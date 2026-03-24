import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import {
  completeModule,
  getCourseDashboard,
  getCurrentUser,
} from "../api";

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
  const labels = {
    intro: "Введение",
    theory: "Теория",
    lecture: "Лекция",
    practice: "Практика",
    lesson: "Урок",
    test: "Тест",
    quiz: "Тест",
  };

  return labels[type] || "Модуль";
}

function buildLessonContent(module, courseTitle) {
  const normalizedTitle = normalizeModuleTitle(
    module?.title,
    module?.module_type,
    module?.order
  );

  const contentMap = {
    "Введение в кибергигиену": {
      lead: `Раздел «${normalizedTitle}» курса «${courseTitle}» знакомит пользователя с базовыми принципами безопасной цифровой среды и формирует понимание того, зачем вообще нужна кибергигиена.`,
      blocks: [
        {
          title: "Что такое кибергигиена",
          text: "Кибергигиена - это совокупность повседневных правил и привычек, которые помогают защищать учетные записи, устройства, персональные данные и рабочую информацию от распространенных цифровых угроз.",
        },
        {
          title: "Почему это важно",
          text: "Большинство инцидентов начинается не со сложных атак, а с простых ошибок пользователя: слабого пароля, перехода по подозрительной ссылке, установки сомнительного файла или повторного использования одного и того же пароля в разных сервисах.",
        },
        {
          title: "Главная цель раздела",
          text: "После изучения этого материала пользователь должен понимать, что личная цифровая безопасность строится не на одном антивирусе, а на регулярных осознанных действиях и внимательности в повседневной работе.",
        },
      ],
    },
    "Безопасность электронной почты": {
      lead: `Раздел «${normalizedTitle}» посвящен безопасной работе с электронной почтой, так как именно письма и вложения часто становятся источником фишинга, вредоносных ссылок и социальной инженерии.`,
      blocks: [
        {
          title: "Проверка отправителя",
          text: "Перед открытием письма нужно внимательно сверять адрес отправителя, домен и общий контекст сообщения. Поддельные письма нередко маскируются под знакомые сервисы, но содержат незначительные отличия в адресе.",
        },
        {
          title: "Осторожность со ссылками и вложениями",
          text: "Не следует открывать вложения и переходить по ссылкам, если сообщение вызывает сомнение, содержит давление, срочность или неожиданные требования. Особенно опасны архивы, исполняемые файлы и документы с макросами.",
        },
        {
          title: "Практическое правило",
          text: "Если письмо кажется подозрительным, безопаснее проверить информацию через официальный сайт или связаться с отправителем по другому каналу связи, чем действовать напрямую из письма.",
        },
      ],
    },
    "Безопасное поведение в сети": {
      lead: `Раздел «${normalizedTitle}» показывает, как безопасно вести себя в интернете, пользоваться сайтами и сервисами, а также избегать типовых сценариев цифрового обмана.`,
      blocks: [
        {
          title: "Надежные пароли и вход",
          text: "Для разных сервисов необходимо использовать разные сложные пароли и по возможности включать двухфакторную аутентификацию. Это снижает риск компрометации учетных записей даже в случае утечки одного пароля.",
        },
        {
          title: "Проверка сайтов",
          text: "Перед вводом данных нужно смотреть на адрес сайта, наличие защищенного соединения и общее качество страницы. Мошеннические сайты часто копируют внешний вид известных ресурсов, но содержат ошибки в домене и тексте.",
        },
        {
          title: "Цифровая внимательность",
          text: "Безопасное поведение в сети - это постоянная оценка контекста: кто просит данные, зачем, насколько это ожидаемо и можно ли подтвердить подлинность запроса через независимый источник.",
        },
      ],
    },
  };

  return (
    contentMap[normalizedTitle] || {
      lead: `Раздел «${normalizedTitle}» курса «${courseTitle}» посвящен практическим аспектам безопасного поведения пользователя в цифровой среде.`,
      blocks: [
        {
          title: "Содержание раздела",
          text: "В этом модуле рассматриваются правила, которые пользователь должен применять в повседневной работе с цифровыми сервисами, учетными записями и информацией.",
        },
        {
          title: "Практическая значимость",
          text: "Изучение материала помогает снизить вероятность типовых ошибок, связанных с фишингом, ненадежными паролями, небезопасными сайтами и неосторожными действиями в интернете.",
        },
      ],
    }
  );
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

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [me, data] = await Promise.all([
          getCurrentUser(),
          getCourseDashboard(courseId),
        ]);

        if (!mounted) return;

        setUser(me);
        setCourseView(data);

        const firstIncompleteIndex = data.modules.findIndex(
          (item) => !item.completed
        );

        setActiveIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
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
  }, [courseId]);

  const modules = courseView?.modules || [];
  const activeModule = modules[activeIndex];

  const activeModuleTitle = activeModule
    ? normalizeModuleTitle(
        activeModule.title,
        activeModule.module_type,
        activeModule.order
      )
    : "";

  const lessonContent = useMemo(
    () => buildLessonContent(activeModule, courseView?.course_title || "Курс"),
    [activeModule, courseView]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeModule) return;

    setReadReady(false);

    const handleScroll = () => {
      const reachedBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 18;
      if (reachedBottom) {
        setReadReady(true);
      }
    };

    handleScroll();
    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [activeModule?._id]);

  useEffect(() => {
    if (!activeModule) return;
    if (activeModule.completed) return;
    if (activeModule.module_type === "test" || activeModule.module_type === "quiz") return;
    if (!readReady || syncing) return;

    let cancelled = false;

    async function saveProgress() {
      try {
        setSyncing(true);

        await completeModule(
          courseId,
          activeModule.module_type,
          activeModule.title,
          activeModule.order
        );

        const updated = await getCourseDashboard(courseId);
        if (cancelled) return;

        setCourseView(updated);

        const currentIndex = updated.modules.findIndex(
          (item) => item.order === activeModule.order
        );

        setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
      } catch (err) {
        if (!cancelled) {
          setError("Не удалось автоматически сохранить прогресс.");
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    saveProgress();

    return () => {
      cancelled = true;
    };
  }, [readReady, activeModule?._id, courseId, syncing, activeModule]);

  if (loading) {
    return (
      <PageTransition className="page-shell">
        <div className="loading-card">Загружаю курс...</div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="page-shell">
      <div className="course-header">
        <div>
          <div className="breadcrumb">
            <Link to="/dashboard">Личный кабинет</Link>
            <span>/</span>
            <span>{courseView?.course_title || "Курс"}</span>
          </div>

          <h1>{courseView?.course_title || "Курс"}</h1>
          <p className="muted course-subline">
            {user?.full_name} · прогресс {courseView?.progress_percent ?? 0}%
          </p>
        </div>

        <motion.button
          className="ghost-btn"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate("/dashboard")}
        >
          Назад
        </motion.button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {courseView && activeModule && (
        <div className="course-layout">
          <aside className="course-sidebar">
            <div className="sidebar-summary">
              <span className="eyebrow">Прогресс курса</span>
              <strong className="sidebar-progress-value">
                {courseView.progress_percent}%
              </strong>

              <div className="progress-track compact">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${courseView.progress_percent}%` }}
                  transition={{ duration: 0.65 }}
                />
              </div>
            </div>

            <nav className="module-nav">
              {modules.map((module, index) => {
                const isActive = index === activeIndex;
                const isTest =
                  module.module_type === "test" || module.module_type === "quiz";

                const title = normalizeModuleTitle(
                  module.title,
                  module.module_type,
                  module.order
                );

                return (
                  <motion.button
                    key={module._id || `${module.order}-${module.title}`}
                    className={`module-nav-item ${isActive ? "active" : ""}`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="module-order">{module.order}</span>

                    <span className="module-meta">
                      <strong>{title}</strong>
                      <small>
                        {isTest ? "Итоговый тест" : getTypeLabel(module.module_type)}
                      </small>
                    </span>

                    <span className={`module-state ${module.completed ? "done" : ""}`}>
                      {module.completed ? "✓" : isTest ? "T" : "•"}
                    </span>
                  </motion.button>
                );
              })}
            </nav>
          </aside>

          <main className="course-content-card">
            <div className="content-head">
              <div>
                <span className="eyebrow">
                  {getTypeLabel(activeModule.module_type)}
                </span>
                <h2>{activeModule.order}. {activeModuleTitle}</h2>
              </div>

              <div className={`status-pill ${activeModule.completed ? "done" : ""}`}>
                {activeModule.completed ? "Пройден" : "В процессе"}
              </div>
            </div>

            {activeModule.module_type === "test" || activeModule.module_type === "quiz" ? (
              <div className="test-cta test-cta-large">
                <p className="muted">
                  Итоговый модуль не отмечается вручную. Курс считается
                  завершенным только после успешного прохождения тестирования.
                </p>

                <motion.button
                  className="primary-btn"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => navigate(`/course/${courseId}/test`)}
                >
                  Перейти к тесту
                </motion.button>
              </div>
            ) : (
              <>
                <div className="reading-banner">
                  <span>
                    Этот модуль засчитывается автоматически после полного
                    просмотра содержимого.
                  </span>

                  <span className={readReady ? "reading-state ready" : "reading-state"}>
                    {readReady ? "Материал просмотрен" : "Прокрути материал до конца"}
                  </span>
                </div>

                <div ref={scrollRef} className="lesson-scroll lesson-scroll-rich">
                  <p className="lead-text">{lessonContent.lead}</p>

                  <div className="lesson-blocks">
                    {lessonContent.blocks.map((block, index) => (
                      <section key={index} className="lesson-block">
                        <h3>{block.title}</h3>
                        <p>{block.text}</p>
                      </section>
                    ))}
                  </div>

                  <div className="lesson-end">
                    <span>
                      После изучения раздела можно перейти к следующему модулю.
                    </span>
                    {syncing && <small>Сохраняю прогресс...</small>}
                  </div>
                </div>
              </>
            )}

            <div className="content-actions">
              <motion.button
                className="ghost-btn"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
              >
                ← Назад
              </motion.button>

              {activeIndex < modules.length - 1 ? (
                <motion.button
                  className="primary-btn"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() =>
                    setActiveIndex((prev) => Math.min(prev + 1, modules.length - 1))
                  }
                >
                  Далее →
                </motion.button>
              ) : (
                <motion.button
                  className="primary-btn"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => navigate(`/course/${courseId}/test`)}
                >
                  К итоговому тесту →
                </motion.button>
              )}
            </div>
          </main>
        </div>
      )}
    </PageTransition>
  );
}