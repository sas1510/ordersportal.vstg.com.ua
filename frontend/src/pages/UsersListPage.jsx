import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { Loader2 } from "lucide-react";

import ChangeUserPasswordModal from "../pages/ChangeUserPasswordModal";
import EditUserModal from "../pages/EditUserModal";
import DeactivateUserModal from "../pages/DeactivateUserModal";
import UserApiKeysModal from "../pages/UserApiKeysModal";

import "../pages/UsersListPage.css";

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deactivateUser, setDeactivateUser] = useState(null);
  const [apiKeyUser, setApiKeyUser] = useState(null);

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users/all/");
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Помилка завантаження користувачів:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ================= FILTER ================= */
  const filteredUsers = users.filter((u) => {
    const roleOk = filterRole === "all" || u.role === filterRole;

    const q = search.toLowerCase();
    const searchOk =
      !search ||
      u.username?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);

    return roleOk && searchOk;
  });

  /* ================= RENDER ================= */
  return (
    <div className="ulp-wrapper users-page-wrapper p-6 min-h-screen bg-gray-50 dark:bg-[#1a1d21] portal-body">
      <h1 className="ulp-title text-3xl font-extrabold mb-6 border-b pb-2">
        Усі користувачі
      </h1>

      {/* FILTERS */}
      <div className="ulp-filter mb-6 flex gap-3 items-center">
        <label className="ulp-filter-label font-medium">
          Фільтр за роллю:
        </label>

        <select
          className="ulp-filter-select users-filter-select rounded-lg px-4 py-2 shadow-sm"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">Всі</option>
          <option value="admin">Адміни</option>
          <option value="customer">Дилери</option>
        </select>

        <input
          type="text"
          placeholder="Пошук дилера / логін / email…"
          className="ulp-search-input rounded-lg px-4 py-2 shadow-sm w-72"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="ulp-loading text-center py-10 text-xl flex items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin" />
          Завантаження…
        </div>
      ) : (
        <div className="ulp-table-container users-table-container shadow-2xl">
          <table className="ulp-table w-full text-left text-sm">
            <thead className="ulp-table-header users-table-header">
              <tr>
                <th className="p-4 w-16">ID</th>
                <th className="p-4">Логін</th>
                <th className="p-4">Імʼя</th>
                <th className="p-4 hidden sm:table-cell">Email</th>
                <th className="p-4">Роль</th>
                <th className="p-4 text-center">Активний</th>
                <th className="p-4 text-center">Дії</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="users-table-row border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="p-4 font-mono" data-label="ID">
                    {u.id}
                  </td>

                  <td className="p-4 font-medium" data-label="Логін">
                    {u.username}
                  </td>

                  <td className="p-4" data-label="Імʼя">
                    {u.full_name}
                  </td>

                  <td
                    className="p-4 hidden sm:table-cell text-xs"
                    data-label="Email"
                  >
                    {u.email}
                  </td>

                  <td className="p-4 capitalize" data-label="Роль">
                    <span
                      className={`ulp-role-badge px-2 py-0.5 rounded-full text-xs font-semibold
                        ${
                          u.role === "admin"
                            ? "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-200"
                            : "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-200"
                        }
                      `}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="p-4" data-label="Активний">
                    {u.is_active ? (
                      <span className="text-green-400 text-xl">✓</span>
                    ) : (
                      <span className="text-red-400 text-xl">✗</span>
                    )}
                  </td>

                  <td
                    className="p-4 flex gap-2 justify-center"
                    data-label="Дії"
                  >
                    <button
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-full"
                      onClick={() => setEditUser(u)}
                    >
                      Редагувати
                    </button>

                    <button
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full"
                      onClick={() => setSelectedUser(u)}
                    >
                      Пароль
                    </button>

                    <button
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-full"
                      onClick={() => setDeactivateUser(u)}
                    >
                      Деактивувати
                    </button>

                    {u.role === "customer" && (
                      <button
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-full ulp-nowrap-btn"
                        onClick={() => setApiKeyUser(u)}
                      >
                        API-ключі
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {selectedUser && (
        <ChangeUserPasswordModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={loadUsers}
        />
      )}

      {deactivateUser && (
        <DeactivateUserModal
          user={deactivateUser}
          onClose={() => setDeactivateUser(null)}
          onUpdated={loadUsers}
        />
      )}

      {apiKeyUser && (
        <UserApiKeysModal
          user={apiKeyUser}
          onClose={() => setApiKeyUser(null)}
        />
      )}
    </div>
  );
}
