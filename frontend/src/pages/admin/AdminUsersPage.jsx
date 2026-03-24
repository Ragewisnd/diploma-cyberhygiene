import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { getAdminUsers, updateAdminUser } from "../../api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setUsers(await getAdminUsers()); } catch {}
  }

  async function toggleRole(u) {
    const newRole = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Сменить роль ${u.full_name} на ${newRole}?`)) return;
    try { await updateAdminUser(u._id, { role: newRole }); await load(); } catch {}
  }

  return (
    <AdminLayout title="Пользователи" subtitle="УПРАВЛЕНИЕ">
      <div className="ad-users-table">
        <div className="ad-users-head">
          <span>Пользователь</span>
          <span>Email</span>
          <span>Роль</span>
          <span>Действия</span>
        </div>
        {users.map((u) => (
          <div className="ad-users-row" key={u._id}>
            <div className="ad-user-name">
              <div className="ad-user-avatar">{u.full_name?.[0]?.toUpperCase() || "?"}</div>
              <span>{u.full_name}</span>
            </div>
            <span className="ad-user-email">{u.email}</span>
            <span className={`ad-badge ${u.role === "admin" ? "ad-badge--blue" : "ad-badge--gray"}`}>
              {u.role}
            </span>
            <button
              className="ghost-btn"
              style={{ fontSize: 13, padding: "7px 14px" }}
              onClick={() => toggleRole(u)}
            >
              Сменить роль
            </button>
          </div>
        ))}
        {users.length === 0 && <div className="ad-empty">Пользователей нет</div>}
      </div>
    </AdminLayout>
  );
}
