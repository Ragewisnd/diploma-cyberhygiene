const API_URL = "http://127.0.0.1:8000";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export async function loginRequest(email, password) {
  const body = new URLSearchParams({
    username: email,
    password,
  });

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("Неверный email или пароль");
  }

  return response.json();
}

export async function authFetch(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearToken();
    throw new Error("Сессия истекла. Выполни вход заново.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Ошибка запроса");
  }

  return response.json();
}

export async function getCurrentUser() {
  return authFetch("/users/me");
}

export async function getDashboardMe() {
  return authFetch("/dashboard/me");
}

export async function getCourseDashboard(courseId) {
  return authFetch(`/dashboard/course/${courseId}`);
}

export async function completeModule(courseId, moduleType, moduleTitle, order) {
  return authFetch("/progress/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      course_id: courseId,
      module_type: moduleType,
      module_title: moduleTitle,
      order,
    }),
  });
}