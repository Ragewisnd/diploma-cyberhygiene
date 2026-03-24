import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getCurrentUser } from "../api";
import PageTransition from "../components/PageTransition";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Введите email и пароль");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      const user = await getCurrentUser();
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition className="login-page">
      <div className="login-shell">
        <div className="login-showcase">
          <div className="brand-badge">CyberHygiene</div>
          <h1>Обучение кибербезопасности для каждого</h1>
          <p>
            Платформа для повышения цифровой грамотности сотрудников. Курсы,
            тестирование и аналитика в одном месте.
          </p>
          <div className="showcase-panel">
            <div className="showcase-stat">
              <span>Модулей в базе</span>
              <strong>12+</strong>
            </div>
            <div className="showcase-stat">
              <span>Тем кибергигиены</span>
              <strong>6</strong>
            </div>
            <div className="showcase-stat">
              <span>Уровней обучения</span>
              <strong>3</strong>
            </div>
          </div>
        </div>

        <div className="login-card">
          <h2>Войти в кабинет</h2>
          <p className="muted">Введите данные вашей учетной записи</p>

          {error && <div className="error-box">{error}</div>}

          <form className="form-stack" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            <label>
              <span>Пароль</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            <motion.button
              className="primary-btn"
              type="submit"
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
            >
              {loading ? "Входим..." : "Войти"}
            </motion.button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
