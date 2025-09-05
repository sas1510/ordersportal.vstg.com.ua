import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "username", ascending: true });
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axiosInstance
      .get("/users/")
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("Ви впевнені, що хочете видалити цього користувача?")) return;
    try {
      await axiosInstance.delete(`/users/${id}/`);
      fetchUsers();
    } catch (error) {
      alert("Помилка при видаленні користувача: " + (error.response?.data || error.message));
    }
  };

  const formatDateDot = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Колонки для різних ролей
  const columnsByRole = {
    All: [
      { key: "username", label: "Логін", width: "120px" },
      { key: "firstLastName", label: "ПІБ", width: "180px" },
      { key: "email", label: "E-Mail", width: "180px" },
      { key: "phone", label: "Телефон", width: "130px" },
      { key: "region", label: "Регіон", width: "120px" },
      { key: "organization", label: "Організація", width: "150px" },
      { key: "createdAt", label: "Дата реєст.", width: "120px" },
      { key: "activityEndDate", label: "Дата зак.", width: "120px" },
      { key: "isActive", label: "Вкл.", width: "70px" },
    ],
    Dealer: [
      { key: "username", label: "Логін", width: "120px" },
      { key: "firstLastName", label: "ПІБ", width: "180px" },
      { key: "email", label: "E-Mail", width: "180px" },
      { key: "phone", label: "Телефон", width: "130px" },
      { key: "region", label: "Регіон", width: "120px" },
      { key: "manager", label: "Менеджер", width: "180px" }, // припускаю, що є поле manager
      { key: "organization", label: "Організація", width: "150px" },
      { key: "createdAt", label: "Дата реєст.", width: "120px" },
      { key: "activityEndDate", label: "Дата зак.", width: "120px" },
      { key: "isActive", label: "Вкл.", width: "70px" },
    ],
    Manager: [
      { key: "username", label: "Логін", width: "120px" },
      { key: "firstLastName", label: "ПІБ", width: "180px" },
      { key: "email", label: "E-Mail", width: "180px" },
      { key: "phone", label: "Телефон", width: "130px" },
      { key: "region", label: "Регіон", width: "120px" },
      { key: "regionalManager", label: "Рег.Менеджер", width: "180px" }, // поле regionalManager
      { key: "organization", label: "Організація", width: "150px" },
      { key: "createdAt", label: "Дата реєст.", width: "120px" },
      { key: "activityEndDate", label: "Дата зак.", width: "120px" },
      { key: "isActive", label: "Вкл.", width: "70px" },
    ],
    RegionalManager: [
      { key: "username", label: "Логін", width: "120px" },
      { key: "firstLastName", label: "ПІБ", width: "180px" },
      { key: "email", label: "E-Mail", width: "180px" },
      { key: "phone", label: "Телефон", width: "130px" },
      { key: "region", label: "Регіон", width: "120px" },
      { key: "organization", label: "Організація", width: "150px" },
      { key: "createdAt", label: "Дата реєст.", width: "120px" },
      { key: "activityEndDate", label: "Дата зак.", width: "120px" },
      { key: "isActive", label: "Вкл.", width: "70px" },
    ],
    Director: [
      { key: "username", label: "Логін", width: "120px" },
      { key: "firstLastName", label: "ПІБ", width: "180px" },
      { key: "email", label: "E-Mail", width: "180px" },
      { key: "phone", label: "Телефон", width: "130px" },
      { key: "organization", label: "Організація", width: "150px" },
      { key: "createdAt", label: "Дата реєст.", width: "120px" },
      { key: "activityEndDate", label: "Дата зак.", width: "120px" },
      { key: "isActive", label: "Вкл.", width: "70px" },
    ],
    Admin: [
      { key: "username", label: "Логін", width: "120px" },
      { key: "firstLastName", label: "ПІБ", width: "180px" },
      { key: "email", label: "E-Mail", width: "180px" },
      { key: "phone", label: "Телефон", width: "130px" },
      { key: "organization", label: "Організація", width: "150px" },
      { key: "createdAt", label: "Дата реєст.", width: "120px" },
      { key: "activityEndDate", label: "Дата зак.", width: "120px" },
      { key: "isActive", label: "Вкл.", width: "70px" },
    ],
  };

  const columns = filterRole === "All" ? columnsByRole.All : columnsByRole[filterRole] || columnsByRole.All;

  const filteredUsers = filterRole === "All" ? users : users.filter((u) => u.userType === filterRole);

  // Сортування
  const sortedUsers = React.useMemo(() => {
    const sorted = [...filteredUsers];
    const { key, ascending } = sortConfig;

    sorted.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (key.toLowerCase().includes("date")) {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return ascending ? valA - valB : valB - valA;
      }

      valA = valA ? valA.toString().toLowerCase() : "";
      valB = valB ? valB.toString().toLowerCase() : "";

      return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return sorted;
  }, [filteredUsers, sortConfig]);

  const onSortClick = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, ascending: !prev.ascending };
      }
      return { key, ascending: true };
    });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return " ⇅";
    return sortConfig.ascending ? " ▲" : " ▼";
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto overflow-x-auto bg-gray-50 mt-8 rounded-md shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">Користувачі</h1>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        {isAdmin && (
          <button
            onClick={() => navigate("/addUser")}
            className="bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1e3a8a] text-white px-5 py-2 rounded-md shadow-sm transition-all duration-300"
          >
            ➕ Додати користувача
          </button>
        )}

        <div>
          <label htmlFor="filterRole" className="mr-2 font-semibold text-gray-700">
            Фільтр за роллю:
          </label>
          <select
            id="filterRole"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-400 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            <option value="All">Всі</option>
            {[...new Set(users.map((u) => u.userType))].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className="min-w-[900px] w-full border-collapse border border-gray-400">
        <thead className="bg-gray-200 select-none">
          <tr>
            {columns.map(({ key, label, width }) => (
              <th
                key={key}
                onClick={() => onSortClick(key)}
                className="border border-gray-500 px-3 py-2 cursor-pointer text-lg font-semibold text-gray-700 whitespace-nowrap select-none"
                style={{ width }}
                title={`Сортувати за ${label}`}
              >
                <div className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="ml-2">{renderSortArrow(key)}</span>
                </div>
              </th>
            ))}
            {isAdmin && (
              <th
                className="border border-gray-500 px-3 py-2 text-lg font-semibold text-gray-700 whitespace-nowrap"
                style={{ width: "110px" }}
              >
                Дії
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {sortedUsers.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (isAdmin ? 1 : 0)}
                className="text-center py-6 text-gray-600 text-lg font-medium"
              >
                Користувачі не знайдені
              </td>
            </tr>
          ) : (
            sortedUsers.map((user, idx) => (
              <tr key={user.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                {columns.map(({ key, width }) => {
                  let value = user[key];
                  if (key === "isActive") value = value ? "Так" : "Ні";
                  if (key === "activityEndDate" || key === "createdAt") value = formatDateDot(value);
                  if (!value) value = "—";

                  return (
                    <td
                      key={key}
                      className="border border-gray-300 px-3 py-2 text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ maxWidth: width }}
                      title={value}
                    >
                      {value}
                    </td>
                  );
                })}

                {isAdmin && (
                  <td className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap space-x-3">
                    <button
                      onClick={() => navigate(`/users/${user.id}/edit`)}
                      className="text-yellow-600 hover:underline text-sm"
                      title="Редагувати"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:underline text-sm"
                      title="Видалити"
                    >
                      🗑
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="mt-6 text-gray-900 text-lg font-semibold">
        Всього користувачів: {sortedUsers.length}
      </p>
    </div>
  );
}
