import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import RoleRoute from "./components/RoleRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CoursePage from "./pages/CoursePage";
import TestPage from "./pages/TestPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminCourseEditorPage from "./pages/admin/AdminCourseEditorPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";

function getToken() {
  return localStorage.getItem("access_token");
}

function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            getToken() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/course/:courseId"
          element={
            <ProtectedRoute>
              <CoursePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/course/:courseId/test"
          element={
            <ProtectedRoute>
              <TestPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <RoleRoute role="admin">
              <AdminDashboardPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/courses"
          element={
            <RoleRoute role="admin">
              <AdminCoursesPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/courses/:courseId"
          element={
            <RoleRoute role="admin">
              <AdminCourseEditorPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RoleRoute role="admin">
              <AdminUsersPage />
            </RoleRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to={getToken() ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </AnimatePresence>
  );
}
