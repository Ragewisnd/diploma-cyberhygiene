import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, login, getCurrentUser } from "../api";
import PageTransition from "../components/PageTransition";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      setError("Заполните все поля");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (form.password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form.full_name, form.email, form.password);
      await login(form.email, form.password);
      const user = await getCurrentUser();
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
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
          <h2>Создать аккаунт</h2>
          <p className="muted">Заполните данные для регистрации</p>

          {error && <div className="error-box">{error}</div>}

          <form className="form-stack" onSubmit={handleSubmit}>
            <label>
              <span>Полное имя</span>
              <input
                type="text"
                placeholder="Иван Иванов"
                value={form.full_name}
                onChange={set("full_name")}
                autoComplete="name"
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
              />
            </label>
            <label>
              <span>Пароль</span>
              <input
                type="password"
                placeholder="Не менее 6 символов"
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
              />
            </label>
            <label>
              <span>Повторите пароль</span>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={set("confirm")}
                autoComplete="new-password"
              />
            </label>

            <motion.button
              className="primary-btn"
              type="submit"
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
            >
              {loading ? "Регистрирую..." : "Создать аккаунт"}
            </motion.button>
          </form>

          <p style={{ marginTop: 18, textAlign: "center" }} className="muted">
            Уже есть аккаунт?{" "}
            <Link to="/login" style={{ color: "var(--primary-dark)", fontWeight: 600 }}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
