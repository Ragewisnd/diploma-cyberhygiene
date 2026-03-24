import { motion } from "framer-motion";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import { getToken, loginRequest, setToken } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("roman@example.com");
  const [password, setPassword] = useState("StrongPass123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (getToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginRequest(email, password);
      setToken(data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition className="login-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="login-shell">
        <motion.div
          className="login-showcase"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="brand-badge">CyberHygiene</div>
          <h1>Обучение кибергигиене без визуального хаоса</h1>
          <p>
            Личный кабинет, курсы, модули и тестирование в одном аккуратном
            интерфейсе.
          </p>

          <div className="showcase-panel">
            <div className="showcase-stat">
              <span>Курсы</span>
              <strong>01</strong>
            </div>
            <div className="showcase-stat">
              <span>Тесты</span>
              <strong>03</strong>
            </div>
            <div className="showcase-stat">
              <span>Прогресс</span>
              <strong>33%</strong>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="login-card"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          <h2>Вход в систему</h2>
          <p className="muted">Используй тестовый аккаунт для входа.</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите email"
              />
            </label>

            <label>
              <span>Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
              />
            </label>

            <motion.button
              type="submit"
              className="primary-btn"
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              disabled={loading}
            >
              {loading ? "Вход..." : "Войти"}
            </motion.button>
          </form>

          {error && <div className="error-box">{error}</div>}
        </motion.div>
      </div>
    </PageTransition>
  );
}