import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axios";
import { KeyRound, Loader2, Plus } from "lucide-react";

import ChangeUserPasswordModal from "../pages/ChangeUserPasswordModal";
import EditUserModal from "../pages/EditUserModal";
import DeactivateUserModal from "../pages/DeactivateUserModal";
import DeleteUserModal from "../pages/DeleteUserModal";
import UserApiKeysModal from "../pages/UserApiKeysModal";
import CreateUserInvitationModal from "./CreateUserInvitationModal";
import TelegramBotKeyModal from "./TelegramBotKeyModal";
import { normalizeRole } from "../utils/roles";

import "../pages/UsersListPage.css";

const ROLE_OPTIONS = [
  { value: "all", label: "Всі ролі" },
  { value: "admin", label: "Адміністратор" },
  { value: "manager", label: "Менеджер" },
  { value: "region_manager", label: "Регіональний менеджер" },
  { value: "director", label: "Директор" },
  { value: "complaint_manager", label: "Менеджер рекламацій" },
  { value: "operator", label: "Оператор" },
  { value: "customer", label: "Дилер" },
  { value: "dealer", label: "Дилер" },
];

const ROLE_LABELS = {
  admin: "Адміністратор",
  manager: "Менеджер",
  region_manager: "Регіональний менеджер",
  regionalManager: "Регіональний менеджер",
  director: "Директор",
  complaint_manager: "Менеджер рекламацій",
  operator: "Оператор",
  customer: "Дилер",
  dealer: "Дилер",
};

const getRoleLabel = (role) => ROLE_LABELS[normalizeRole(role)] || role || "—";

const getRoleBadgeClass = (role) => {
  switch (normalizeRole(role)) {
    case "admin":
      return "bg-red-200 text-red-800 dark:bg-red-700/60 dark:text-red-200";
    case "manager":
    case "region_manager":
    case "director":
    case "complaint_manager":
    case "operator":
      return "bg-blue-200 text-blue-800 dark:bg-blue-700/60 dark:text-blue-200";
    case "customer":
    case "dealer":
      return "bg-green-200 text-green-800 dark:bg-green-700/60 dark:text-green-200";
    default:
      return "bg-gray-200 text-gray-800 dark:bg-gray-700/60 dark:text-gray-200";
  }
};

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deactivateUser, setDeactivateUser] = useState(null);
  const [apiKeyUser, setApiKeyUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTelegramBotKeyModal, setShowTelegramBotKeyModal] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users/all/");
      setUsers(res.data.users || []);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Помилка завантаження користувачів:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const availableRoleFilters = useMemo(() => {
    const roleSet = new Set(users.map((user) => normalizeRole(user.role)).filter(Boolean));
    return ROLE_OPTIONS.filter((option) => option.value === "all" || roleSet.has(option.value));
  }, [users]);

  const filteredUsers = users.filter((user) => {
    const normalizedRole = normalizeRole(user.role);
    const roleOk = filterRole === "all" || normalizedRole === filterRole;

    const query = search.toLowerCase();
    const searchOk =
      !search ||
      user.username?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      getRoleLabel(user.role).toLowerCase().includes(query);

    return roleOk && searchOk;
  });

  return (
    <div
      className="ulp-wrapper users-page-wrapper p-6 min-h-screen bg-gray-50 dark:bg-[#1a1d21] portal-body"
      style={{ justifyContent: "center" }}
    >
      <div className="max-w-[1334px] mx-auto">
        <div className="flex max-w-[1334px] justify-between items-center mb-6 mt-2 border-b pb-4">
          <h1 className="ulp-title text-3xl font-extrabold m-0">Усі користувачі</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTelegramBotKeyModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <KeyRound size={18} />
              <span>{"\u041a\u043b\u044e\u0447 Telegram-\u0431\u043e\u0442\u0430"}</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Plus size={18} />
              <span>Створити користувача</span>
            </button>
          </div>
        </div>

        <div className="ulp-filter mb-6 max-w-[1334px] flex gap-3 items-center">
          <label className="ulp-filter-label font-medium">Фільтр за роллю:</label>

          <select
            className="ulp-filter-select users-filter-select rounded-lg px-4 py-2 shadow-sm"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            {availableRoleFilters.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="user_search_query"
            autoComplete="new-password"
            placeholder="Пошук за дилером / логіном / email / роллю..."
            className="ulp-search-input rounded-lg px-4 py-2 shadow-sm w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            readOnly
            onFocus={(e) => e.target.removeAttribute("readonly")}
            onBlur={(e) => e.target.setAttribute("readonly", true)}
          />
        </div>

        {loading ? (
          <div className="ulp-loading text-center py-10 text-xl flex items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin" />
            Завантаження…
          </div>
        ) : (
          <div className="ulp-table-container max-w-[1334px] users-table-container shadow-2xl">
            <table className="ulp-table w-full text-left text-sm">
              <thead className="ulp-table-header users-table-header">
                <tr>
                  <th className="p-4 w-16">ID</th>
                  <th className="p-4">Логін</th>
                  <th className="p-4">Ім'я</th>
                  <th className="p-4 hidden sm:table-cell">Email</th>
                  <th className="p-4">Роль</th>
                  <th className="p-4">Активний</th>
                  <th className="p-4 text-center">Дії</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="users-table-row border-t border-gray-200 dark:border-gray-700"
                  >
                    <td className="p-4 font-mono" data-label="ID">
                      {user.id}
                    </td>

                    <td className="p-4 font-medium" data-label="Логін">
                      {user.username}
                    </td>

                    <td className="p-4" data-label="Ім'я">
                      {user.full_name}
                    </td>

                    <td className="p-4 hidden sm:table-cell text-xs" data-label="Email">
                      {user.email}
                    </td>

                    <td className="p-4 capitalize" data-label="Роль">
                      <span
                        className={`ulp-role-badge px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClass(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td className="p-4" data-label="Активний">
                      {user.is_active ? (
                        <span className="text-green-400 text-xl font-bold">✓</span>
                      ) : (
                        <span className="text-red-400 text-xl font-bold">✕</span>
                      )}
                    </td>

                    <td className="p-4 flex gap-2 justify-center flex-wrap" data-label="Дії">
                      <div className="actions-container">
                        <button
                          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-full transition-colors"
                          onClick={() => setEditUser(user)}
                        >
                          Редагувати
                        </button>

                        <button
                          type="button"
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full transition-colors"
                          onClick={() => setSelectedUser(user)}
                        >
                          Змінити пароль
                        </button>

                        <button
                          className={`px-3 py-1 text-white text-sm rounded-full transition-colors ${
                            user.is_active
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-gray-400 cursor-not-allowed opacity-70"
                          }`}
                          onClick={() => setDeactivateUser(user)}
                          disabled={!user.is_active}
                        >
                          {user.is_active ? "Деактивувати" : "Деактивовано"}
                        </button>

                        <button
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-full ulp-nowrap-btn transition-colors"
                          onClick={() => setApiKeyUser(user)}
                        >
                          API-ключі
                        </button>

                        <button
                          className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-sm rounded-full ulp-nowrap-btn transition-colors"
                          onClick={() => setDeleteUser(user)}
                        >
                          Видалити назавжди
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      Користувачів не знайдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showTelegramBotKeyModal && (
          <TelegramBotKeyModal onClose={() => setShowTelegramBotKeyModal(false)} />
        )}

        {showInviteModal && (
          <CreateUserInvitationModal
            onClose={() => setShowInviteModal(false)}
            onCreated={loadUsers}
          />
        )}

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
          <UserApiKeysModal user={apiKeyUser} onClose={() => setApiKeyUser(null)} />
        )}

        {deleteUser && (
          <DeleteUserModal
            user={deleteUser}
            onClose={() => setDeleteUser(null)}
            onUpdated={loadUsers}
          />
        )}
      </div>
    </div>
  );
}



