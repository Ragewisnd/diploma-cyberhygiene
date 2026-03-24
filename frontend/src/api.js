const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("access_token");
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = "Ошибка запроса";
    try {
      const json = await res.json();
      detail = json.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}

// ─ auth ──────────────────────────────────────────────────────────────

export async function login(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.detail || "Ошибка входа");
  }
  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  return data;
}

export async function register(full_name, email, password) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, password }),
  });
}

// ─ user ─────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  return request("/users/me");
}

export async function getDashboardMe() {
  return request("/dashboard/me");
}

export async function getCourseDashboard(courseId) {
  return request(`/dashboard/course/${courseId}`);
}

// ─ content ──────────────────────────────────────────────────────────

export async function getModule(moduleId) {
  return request(`/modules/${moduleId}`);
}

export async function getModulesByCourse(courseId) {
  return request(`/modules/course/${courseId}`);
}

export async function getTestByCourse(courseId) {
  const tests = await request(`/tests/course/${courseId}`);
  return tests[0] || null;
}

export async function getTestById(testId) {
  return request(`/tests/${testId}`);
}

export async function submitTest(testId, answers) {
  return request(`/tests/${testId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function getMyAttempts() {
  return request("/tests/attempts/me");
}

// ─ progress ──────────────────────────────────────────────────────────

export async function completeModule(courseId, moduleType, moduleTitle, order) {
  return request("/progress/complete", {
    method: "POST",
    body: JSON.stringify({ course_id: courseId, module_type: moduleType, module_title: moduleTitle, order }),
  });
}

// ─ admin ────────────────────────────────────────────────────────────

export async function adminGetCourses() {
  return request("/admin/courses");
}

export async function adminCreateCourse(data) {
  return request("/admin/courses", { method: "POST", body: JSON.stringify(data) });
}

export async function adminUpdateCourse(courseId, data) {
  return request(`/admin/courses/${courseId}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function adminDeleteCourse(courseId) {
  return request(`/admin/courses/${courseId}`, { method: "DELETE" });
}

export async function adminGetModules(courseId) {
  return request(`/admin/courses/${courseId}/modules`);
}

export async function adminCreateModule(data) {
  return request("/admin/modules", { method: "POST", body: JSON.stringify(data) });
}

export async function adminUpdateModule(moduleId, data) {
  return request(`/admin/modules/${moduleId}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function adminDeleteModule(moduleId) {
  return request(`/admin/modules/${moduleId}`, { method: "DELETE" });
}

export async function adminGetTests(courseId) {
  return request(`/admin/courses/${courseId}/tests`);
}

export async function adminCreateTest(data) {
  return request("/admin/tests", { method: "POST", body: JSON.stringify(data) });
}

export async function adminUpdateTest(testId, data) {
  return request(`/admin/tests/${testId}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function adminDeleteTest(testId) {
  return request(`/admin/tests/${testId}`, { method: "DELETE" });
}

export async function adminGetUsers() {
  return request("/admin/users");
}

export async function adminUpdateUser(userId, data) {
  return request(`/admin/users/${userId}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function adminEnrollUser(userId, courseId) {
  return request(`/admin/users/${userId}/enroll`, {
    method: "POST",
    body: JSON.stringify({ course_id: courseId }),
  });
}

export async function adminGetReportsOverview() {
  return request("/admin/reports/overview");
}

export async function adminGetReportsCourse(courseId) {
  return request(`/admin/reports/course/${courseId}`);
}
