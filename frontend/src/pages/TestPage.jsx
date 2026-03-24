import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { completeModule, getCourseDashboard } from "../api";

const QUESTIONS = [
  { id: 1, question: "Какой пароль наиболее безопасен?",
    options: ["12345678", "Qwerty2024", "T7!mZ#91pL"], correct: 2 },
  { id: 2, question: "Что нужно сделать при подозрительном письме?",
    options: ["Сразу открыть вложение", "Проверить отправителя и не переходить по ссылкам", "Переслать коллегам"], correct: 1 },
  { id: 3, question: "Для чего нужна двухфакторная аутентификация?",
    options: ["Ускорить вход без пароля", "Добавить второй уровень проверки", "Скрыть браузерную историю"], correct: 1 },
];

export default function TestPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseView, setCourseView] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ok = true;
    getCourseDashboard(courseId).then((d) => { if (ok) setCourseView(d); }).catch((e) => { if (ok) setError(e.message); });
    return () => { ok = false; };
  }, [courseId]);

  const testModule = courseView?.modules?.find((m) => m.module_type === "test" || m.module_type === "quiz");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const correct = QUESTIONS.reduce((a, q) => a + (answers[q.id] === q.correct ? 1 : 0), 0);
      const percent = Math.round((correct / QUESTIONS.length) * 100);
      const passed = percent >= 70;
      setResult({ correct, percent, passed });
      if (passed && testModule && !testModule.completed) {
        await completeModule(courseId, testModule.module_type, testModule.title, testModule.order);
      }
    } catch { setError("Не удалось сохранить результат."); }
    finally { setSubmitting(false); }
  }

  return (
    <UserLayout backTo={`/course/${courseId}`} backLabel="Назад к курсу">
      <div className="tp-header">
        <div className="db-eyebrow">КОНТРОЛЬ ЗНАНИЙ</div>
        <h1 className="tp-title">Итоговое тестирование</h1>
        <p className="tp-sub">{courseView?.course_title || "Загрузка..."}  ·  Курс засчитывается завершённым после успешного прохождения</p>
      </div>

      {error && <div className="ul-error">{error}</div>}

      <div className="tp-questions">
        {QUESTIONS.map((q, i) => (
          <div key={q.id} className="tp-question">
            <div className="tp-q-num">0{i + 1}</div>
            <div className="tp-q-body">
              <div className="tp-q-text">{q.question}</div>
              <div className="tp-options">
                {q.options.map((opt, idx) => (
                  <motion.button
                    key={opt}
                    type="button"
                    className={`tp-option${answers[q.id] === idx ? " tp-option--active" : ""}`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                  >
                    <span className="tp-option-dot" />
                    {opt}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="tp-actions">
        <button className="ghost-btn" onClick={() => navigate(`/course/${courseId}`)} >← Вернуться</button>
        <button className="primary-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Проверяю..." : "Завершить тест"}
        </button>
      </div>

      {result && (
        <motion.div
          className={`tp-result ${result.passed ? "tp-result--pass" : "tp-result--fail"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="tp-result-pct">{result.percent}%</div>
          <div className="tp-result-text">
            {result.passed
              ? `✅ Тест пройден: ${result.correct} из ${QUESTIONS.length}`
              : `❌ Недостаточный результат: ${result.correct} из ${QUESTIONS.length}. Нужно не менее 70%`}
          </div>
          {result.passed && (
            <button className="ghost-btn" style={{ marginTop: 10 }} onClick={() => navigate(`/course/${courseId}`)} >
              Вернуться в курс
            </button>
          )}
        </motion.div>
      )}
    </UserLayout>
  );
}
