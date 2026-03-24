import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import {
  completeModule,
  getCourseDashboard,
} from "../api";

function getQuestions() {
  return [
    {
      id: 1,
      question: "Какой пароль наиболее безопасен?",
      options: ["12345678", "Qwerty2024", "T7!mZ#91pL"],
      correct: 2,
    },
    {
      id: 2,
      question: "Что нужно сделать при подозрительном письме?",
      options: [
        "Сразу открыть вложение",
        "Проверить отправителя и не переходить по подозрительным ссылкам",
        "Переслать всем коллегам",
      ],
      correct: 1,
    },
    {
      id: 3,
      question: "Для чего нужна двухфакторная аутентификация?",
      options: [
        "Чтобы ускорить вход без пароля",
        "Чтобы добавить второй уровень проверки личности",
        "Чтобы скрыть браузерную историю",
      ],
      correct: 1,
    },
  ];
}

export default function TestPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [courseView, setCourseView] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const questions = useMemo(() => getQuestions(), []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getCourseDashboard(courseId);
        if (mounted) setCourseView(data);
      } catch (err) {
        if (mounted) setError(err.message);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  const testModule = courseView?.modules?.find(
    (item) => item.module_type === "test" || item.module_type === "quiz"
  );

  function choose(questionId, optionIndex) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const correctCount = questions.reduce((acc, question) => {
        return acc + (answers[question.id] === question.correct ? 1 : 0);
      }, 0);

      const percent = Math.round((correctCount / questions.length) * 100);
      const passed = percent >= 70;

      setResult({ correctCount, percent, passed });

      if (passed && testModule && !testModule.completed) {
        await completeModule(
          courseId,
          testModule.module_type,
          testModule.title,
          testModule.order
        );
      }
    } catch (err) {
      setError("Не удалось сохранить результат тестирования.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageTransition className="page-shell">
      <div className="topbar glassy">
        <div>
          <div className="breadcrumb">
            <Link to="/dashboard">Личный кабинет</Link>
            <span>/</span>
            <Link to={`/course/${courseId}`}>Курс</Link>
            <span>/</span>
            <span>Тест</span>
          </div>
          <h1>Итоговое тестирование</h1>
          <p className="muted">
            Курс считается завершенным после успешного прохождения теста.
          </p>
        </div>

        <motion.button
          className="ghost-btn"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate(`/course/${courseId}`)}
        >
          Назад к курсу
        </motion.button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="soft-card test-page-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Контроль знаний</span>
            <h2>{courseView?.course_title || "Курс"}</h2>
          </div>
        </div>

        <div className="quiz-list">
          {questions.map((question, qIndex) => (
            <div key={question.id} className="quiz-card">
              <div className="quiz-number">0{qIndex + 1}</div>
              <div className="quiz-content">
                <h3>{question.question}</h3>

                <div className="quiz-options">
                  {question.options.map((option, optionIndex) => {
                    const active = answers[question.id] === optionIndex;

                    return (
                      <motion.button
                        key={option}
                        type="button"
                        className={`quiz-option ${active ? "active" : ""}`}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => choose(question.id, optionIndex)}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="content-actions">
          <motion.button
            className="ghost-btn"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(`/course/${courseId}`)}
          >
            ← Вернуться
          </motion.button>

          <motion.button
            className="primary-btn"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Проверяю..." : "Завершить тест"}
          </motion.button>
        </div>

        {result && (
          <motion.div
            className={`result-banner ${result.passed ? "success" : "warning"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <strong>{result.percent}%</strong>
            <span>
              {result.passed
                ? `Тест пройден: ${result.correctCount} из ${questions.length}.`
                : `Недостаточный результат: ${result.correctCount} из ${questions.length}.`}
            </span>

            {result.passed && (
              <button
                className="link-btn"
                onClick={() => navigate(`/course/${courseId}`)}
              >
                Вернуться в курс
              </button>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}