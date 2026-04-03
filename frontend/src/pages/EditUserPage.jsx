import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [managers1C, setManagers1C] = useState([]);
  const [regionalManagers1C, setRegionalManagers1C] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, orgRes, regRes] = await Promise.all([
          axiosInstance.get("/users/"),
          axiosInstance.get("/organizations/db"),
          axiosInstance.get("/regions/"),
        ]);

        setOrganizations(orgRes.data);
        setRegions(regRes.data);

        const found = userRes.data.find((u) => u.id === parseInt(id));
        if (found) {
          const orgId =
            orgRes.data.find((o) => o.name === found.organization)?.id || "";
          const regId =
            regRes.data.find((r) => r.name === found.region)?.id || "";

          setUser({
            Id: found.id,
            Username: found.username,
            FirstLastName: found.firstLastName || "",
            Email: found.email || "",
            Phone: found.phone || "",
            UserType: found.userType || "Dealer",
            IsActive: found.isActive,
            ActivityEndDate: found.activityEndDate
              ? formatDateLocal(found.activityEndDate)
              : "",
            OrganizationId: orgId.toString(),
            RegionId: regId.toString(),
            ContractorCode: found.contractorCode || "",
            ManagerCode: found.managerCode || "",
            RegionalManagerCode: found.regionalManagerCode || "",
            FinancialOperations: found.financialOperations || false,
            AutoApprove: found.autoApprove || false,
            Photo: null,
          });
        }
      } catch (err) {
        alert(
          "Помилка завантаження даних: " + (err.response?.data || err.message),
        );
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    // Завантаження контрагентів при зміні організації
    async function fetchContractors() {
      if (!user?.OrganizationId || user.UserType !== "Dealer") {
        setContractors([]);
        setUser((prev) => ({ ...prev, ContractorCode: "" }));
        return;
      }
      try {
        const selectedOrg = organizations.find(
          (o) => o.id.toString() === user.OrganizationId,
        );
        if (!selectedOrg) return;

        const res = await axiosInstance.get(
          `/contractors/by-organization?firm=${selectedOrg.code_1c}`,
        );
        setContractors(res.data);
      } catch (err) {
        console.error("Помилка завантаження контрагентів", err);
      }
    }

    fetchContractors();
  }, [user?.OrganizationId, user?.UserType, organizations]);

  useEffect(() => {
    // Завантаження менеджерів та регіональних менеджерів
    async function fetchManagers() {
      if (!user?.OrganizationId) {
        setManagers1C([]);
        setRegionalManagers1C([]);
        return;
      }
      try {
        const selectedOrg = organizations.find(
          (o) => o.id.toString() === user.OrganizationId,
        );
        if (!selectedOrg) return;

        if (["Dealer", "Manager"].includes(user.UserType)) {
          const mgrRes = await axiosInstance.get(
            `/managerssync/get-managers-by-organization?organization=${selectedOrg.code_1c}`,
          );
          setManagers1C(mgrRes.data);
        }

        if (["Dealer", "Manager", "RegionalManager"].includes(user.UserType)) {
          const regMgrRes = await axiosInstance.get(
            `/managerssync/get-regional-managers-by-organization?organization=${selectedOrg.code_1c}`,
          );
          setRegionalManagers1C(regMgrRes.data);
        }
      } catch (err) {
        console.error("Помилка завантаження менеджерів", err);
      }
    }
    fetchManagers();
  }, [user?.OrganizationId, user?.UserType, organizations]);

  const formatDateLocal = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSave = () => {
    const activeUntilIso = user.ActivityEndDate
      ? new Date(user.ActivityEndDate).toISOString()
      : "";

    const formData = new FormData();
    formData.append("Id", user.Id);
    formData.append("Username", user.Username);
    formData.append("FirstLastName", user.FirstLastName);
    formData.append("Email", user.Email);
    formData.append("Phone", user.Phone);
    formData.append("UserType", user.UserType);
    formData.append("IsActive", user.IsActive ? "true" : "false");
    formData.append("ActiveUntil", activeUntilIso);
    formData.append("OrganizationId", user.OrganizationId || "");
    formData.append("RegionId", user.RegionId || "");
    formData.append("ContractorCode", user.ContractorCode || "");
    formData.append("ManagerCode", user.ManagerCode || "");
    formData.append("RegionalManagerCode", user.RegionalManagerCode || "");
    formData.append(
      "FinancialOperations",
      user.FinancialOperations ? "true" : "false",
    );
    formData.append("AutoApprove", user.AutoApprove ? "true" : "false");

    if (user.Photo) formData.append("Photo", user.Photo);

    axiosInstance
      .put(`/users/${user.Id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        alert("Користувача оновлено");
        navigate("/users");
      })
      .catch((err) => alert("Помилка: " + (err.response?.data || err.message)));
  };

  const handlePasswordChange = () => {
    axiosInstance
      .post(`/auth/admin-change-password/${user.Id}`, { newPassword })
      .then(() => {
        alert("Пароль змінено");
        setNewPassword("");
      })
      .catch((err) =>
        alert(
          "Помилка при зміні пароля: " + (err.response?.data || err.message),
        ),
      );
  };

  if (!user) return <p className="text-center mt-10">Завантаження...</p>;

  return (
    <div className="max-w-3xl mt-8 mx-auto px-6 py-8 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-[#003d66]">
        Редагування користувача
      </h2>

      <div className="space-y-4">
        {/* Твої поля */}
        <input
          type="text"
          value={user.Username}
          onChange={(e) => setUser({ ...user, Username: e.target.value })}
          placeholder="Логін"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />
        <input
          type="text"
          value={user.FirstLastName}
          onChange={(e) => setUser({ ...user, FirstLastName: e.target.value })}
          placeholder="ПІБ"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />
        <input
          type="email"
          value={user.Email}
          onChange={(e) => setUser({ ...user, Email: e.target.value })}
          placeholder="Email"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />
        <input
          type="tel"
          value={user.Phone}
          onChange={(e) => setUser({ ...user, Phone: e.target.value })}
          placeholder="Телефон"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />

        {/* Дата активності */}
        <div>
          <label className="block mb-1 font-semibold text-[#003d66]">
            Активний до:
          </label>
          <input
            type="date"
            value={user.ActivityEndDate}
            onChange={(e) =>
              setUser({ ...user, ActivityEndDate: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
            disabled={!user.IsActive}
          />
        </div>

        {/* UserType і чекбокси */}
        <input
          type="text"
          value={user.UserType}
          disabled
          className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-200 cursor-not-allowed"
        />
        <label className="block text-[#003d66]">
          <input
            type="checkbox"
            className="mr-2"
            checked={user.IsActive}
            onChange={(e) =>
              setUser({
                ...user,
                IsActive: e.target.checked,
                ActivityEndDate: e.target.checked ? user.ActivityEndDate : "",
              })
            }
          />
          Активний
        </label>

        {/* Фото */}
        <label className="block text-[#003d66]">
          Фото:
          <input
            type="file"
            accept="image/*"
            className="block mt-1"
            onChange={(e) =>
              setUser({ ...user, Photo: e.target.files?.[0] || null })
            }
          />
        </label>

        {/* Організація */}
        <select
          value={user.OrganizationId || ""}
          onChange={(e) =>
            setUser({ ...user, OrganizationId: e.target.value || null })
          }
          className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        >
          <option value="">Виберіть організацію</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id.toString()}>
              {org.name}
            </option>
          ))}
        </select>

        {/* Контрагент */}
        {contractors.length > 0 && (
          <select
            value={user.ContractorCode || ""}
            onChange={(e) =>
              setUser({ ...user, ContractorCode: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          >
            <option value="">Виберіть контрагента</option>
            {contractors.map((c) => (
              <option key={c.kod} value={c.kod}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Менеджери */}
        {managers1C.length > 0 && (
          <select
            value={user.ManagerCode || ""}
            onChange={(e) => setUser({ ...user, ManagerCode: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          >
            <option value="">Виберіть менеджера</option>
            {managers1C.map((m) => (
              <option key={m._1c_ID} value={m._1c_ID}>
                {m._1c_name}
              </option>
            ))}
          </select>
        )}

        {/* Регіональні менеджери */}
        {regionalManagers1C.length > 0 && (
          <select
            value={user.RegionalManagerCode || ""}
            onChange={(e) =>
              setUser({ ...user, RegionalManagerCode: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          >
            <option value="">Виберіть регіонального менеджера</option>
            {regionalManagers1C.map((r) => (
              <option key={r._1c_ID} value={r._1c_ID}>
                {r._1c_name}
              </option>
            ))}
          </select>
        )}

        {/* Регіон */}
        <select
          value={user.RegionId || ""}
          onChange={(e) =>
            setUser({ ...user, RegionId: e.target.value || null })
          }
          className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        >
          <option value="">Виберіть регіон</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id.toString()}>
              {r.name}
            </option>
          ))}
        </select>

        {/* Поля для Dealer */}
        {user.UserType === "Dealer" && (
          <>
            <label className="block text-[#003d66]">
              <input
                type="checkbox"
                className="mr-2"
                checked={user.FinancialOperations}
                onChange={(e) =>
                  setUser({ ...user, FinancialOperations: e.target.checked })
                }
              />
              Фінансові операції
            </label>
            <label className="block text-[#003d66]">
              <input
                type="checkbox"
                className="mr-2"
                checked={user.AutoApprove}
                onChange={(e) =>
                  setUser({ ...user, AutoApprove: e.target.checked })
                }
              />
              Авто підтвердження
            </label>
          </>
        )}

        <button
          onClick={handleSave}
          className="bg-[#003d66] text-white px-5 py-2 rounded hover:bg-[#005c99] transition"
        >
          💾 Зберегти
        </button>
      </div>

      <div className="mt-8 border-t pt-6">
        <h3 className="font-semibold text-lg text-[#003d66] mb-3">
          🔑 Змінити пароль
        </h3>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Новий пароль"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66] mb-3"
        />
        <button
          onClick={handlePasswordChange}
          className="bg-gray-600 text-white px-5 py-2 rounded hover:bg-gray-700 transition"
        >
          Змінити пароль
        </button>
      </div>
    </div>
  );
}
