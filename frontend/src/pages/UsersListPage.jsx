import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { Loader2 } from "lucide-react";

import ChangeUserPasswordModal from "../pages/ChangeUserPasswordModal";
import EditUserModal from "../pages/EditUserModal";
import DeactivateUserModal from "../pages/DeactivateUserModal";

import "../pages/UsersListPage.css"; // 👈 ПІДКЛЮЧЕННЯ СТИЛІВ

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deactivateUser, setDeactivateUser] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users/all/");
      setUsers(res.data.users);
    } catch (error) {
      console.error("Помилка завантаження користувачів:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers =
    filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  return (
    <div className="ulp-wrapper users-page-wrapper p-6 min-h-screen bg-gray-50 dark:bg-[#1a1d21] portal-body">

  <h1 className="ulp-title text-3xl font-extrabold mb-6 border-b pb-2">
    Усі користувачі
  </h1>

  {/* FILTER */}
  <div className="ulp-filter mb-6 flex gap-3 items-center">
    <label className="ulp-filter-label font-medium">Фільтр за роллю:</label>

    <select
      className="ulp-filter-select users-filter-select rounded-lg px-4 py-2 shadow-sm outline-none transition"
      value={filterRole}
      onChange={(e) => setFilterRole(e.target.value)}
    >
      <option value="all">Всі</option>
      <option value="admin">Адміни</option>
      <option value="manager">Менеджери</option>
      <option value="customer">Дилери</option>
    </select>
  </div>

  {loading ? (
    <div className="ulp-loading text-center py-10 text-xl flex items-center justify-center gap-3">
      <Loader2 size={24} className="animate-spin" /> Завантаження…
    </div>
  ) : (
    <div className="ulp-table-container users-table-container shadow-2xl">

      <table className="ulp-table w-full text-left text-sm">
        <thead className="ulp-table-header users-table-header">
          <tr className="ulp-table-header-row">
            <th className="ulp-th p-4 w-16">ID</th>
            <th className="ulp-th p-4">Логін</th>
            <th className="ulp-th p-4">Ім'я</th>
            <th className="ulp-th p-4 hidden sm:table-cell">Email</th>
            <th className="ulp-th p-4">Роль</th>
            <th className="ulp-th p-4 text-center">Активний</th>
            <th className="ulp-th p-4 text-center">Дії</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((u) => (
            <tr
              key={u.id}
              className="ulp-tr users-table-row border-t border-gray-200 dark:border-gray-700 transition"
            >
              <td className="ulp-td p-4 font-mono">{u.id}</td>
              <td className="ulp-td p-4 font-medium">{u.username}</td>
              <td className="ulp-td p-4">{u.full_name}</td>
              <td className="ulp-td p-4 hidden sm:table-cell text-xs">{u.email}</td>

              <td className="ulp-td p-4 capitalize">
                <span
                  className={`ulp-role-badge px-2 py-0.5 rounded-full text-xs font-semibold
                    ${
                      u.role === "admin"
                        ? "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-200"
                        : u.role === "manager"
                        ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-700/60 dark:text-yellow-200"
                        : "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-200"
                    }
                  `}
                >
                  {u.role}
                </span>
              </td>

              <td className="ulp-td p-4 text-center">
                {u.is_active ? (
                  <span className="ulp-active text-green-400 text-xl">✓</span>
                ) : (
                  <span className="ulp-active text-red-400 text-xl">✗</span>
                )}
              </td>

              <td className="ulp-td p-4 flex gap-2 justify-center">
                <button
                  className="ulp-btn-edit px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-full"
                  onClick={() => setEditUser(u)}
                >
                  Редагувати
                </button>

                <button
                  className="ulp-btn-password px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full"
                  onClick={() => setSelectedUser(u)}
                >
                  Пароль
                </button>

                <button
                  className="ulp-btn-deactivate px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-full"
                  onClick={() => setDeactivateUser(u)}
                >
                  Деактивувати
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )}

  {/* MODALS */}
  {selectedUser && (
    <ChangeUserPasswordModal user={selectedUser} onClose={() => setSelectedUser(null)} />
  )}

  {editUser && (
    <EditUserModal user={editUser} onClose={() => setEditUser(null)} onUpdated={loadUsers} />
  )}

  {deactivateUser && (
    <DeactivateUserModal user={deactivateUser} onClose={() => setDeactivateUser(null)} onUpdated={loadUsers} />
  )}
</div>

  );
}
