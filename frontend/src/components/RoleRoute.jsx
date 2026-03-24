import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api";

export default function RoleRoute({ role, children }) {
  const [status, setStatus] = useState("loading");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setUserRole(user.role);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return <div className="loading-card">Проверка доступа...</div>;
  }

  if (status === "error" || !userRole) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to={userRole === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
}
