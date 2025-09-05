// src/components/InviteRegisterForm.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";

export default function InviteRegisterForm() {
  const { code } = useParams();
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone_number: "",
    password: "",
    expire_date: "",
    email_confirmed: false,
    phone_number_confirmed: false,
    two_factor_enabled: false,
    lockout_end_date: "",
    lockout_enabled: false,
    access_failed_count: 0,
    role: "customer",
    order_portal_user_id: "",
    auto_confirm_order: false,
    permit_finance_info: false,
    guid: "",
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Завантаження даних користувача за кодом запрошення
  useEffect(() => {
    axiosInstance
      .get(`/register/${code}/`)
      .then((res) => {
        const data = res.data;
        setFormData((prev) => ({
          ...prev,
          full_name: data.full_name || "",
          username: data.username || "",
          phone_number: data.phone_number || "",
          password: "",
          expire_date: data.expire_date || "",
          email_confirmed: data.email_confirmed || false,
          phone_number_confirmed: data.phone_number_confirmed || false,
          two_factor_enabled: data.two_factor_enabled || false,
          lockout_end_date: data.lockout_end_date || "",
          lockout_enabled: data.lockout_enabled || false,
          access_failed_count: data.access_failed_count || 0,
          role: data.role || "customer",
          order_portal_user_id: data.user_id_1C || "",
          auto_confirm_order: data.auto_confirm_order || false,
          permit_finance_info: data.permit_finance_info || false,
          guid: data.guid || "",
        }));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.data?.error) {
          setError(err.response.data.error); // "використано" або "не активне"
        } else {
          setError("Не вдалося завантажити дані користувача.");
        }
        setLoading(false);
      });
  }, [code]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await axiosInstance.post(`/register/${code}/`, formData);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Не вдалося зареєструвати користувача. Перевірте введені дані.");
      }
    }
  };

  if (loading) return <p className="text-center mt-6">Завантаження...</p>;
  if (error)
    return (
      <p className="text-center mt-6 text-red-600 font-semibold">{error}</p>
    );
  if (success)
    return (
      <p className="text-center mt-6 text-green-600 font-semibold">
        Реєстрацію успішно завершено!
      </p>
    );

  return (
    <div className="max-w-2xl mt-8 mx-auto px-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200"
      >
        <h2 className="text-2xl font-bold text-[#003d66] mb-6 border-b border-[#003d66] pb-2">
          Форма реєстрації за запрошенням
        </h2>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">
            Повне ім’я:
          </label>
          <input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">
            Ім'я користувача
          </label>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">Телефон:</label>
          <input
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">Пароль:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">Термін дії:</label>
          <input
            type="datetime-local"
            name="expire_date"
            value={formData.expire_date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        {/* Чекбокси */}
        {[
          { name: "email_confirmed", label: "Email підтверджено" },
          { name: "phone_number_confirmed", label: "Телефон підтверджено" },
          { name: "two_factor_enabled", label: "Двофакторна автентифікація" },
          { name: "lockout_enabled", label: "Блокування увімкнено" },
          { name: "auto_confirm_order", label: "Авто підтвердження замовлення" },
          { name: "permit_finance_info", label: "Доступ до фінансової інформації" },
        ].map((item) => (
          <div key={item.name} className="mb-4 flex items-center">
            <input
              type="checkbox"
              name={item.name}
              checked={formData[item.name]}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="font-semibold text-gray-700">{item.label}</label>
          </div>
        ))}

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">
            Дата закінчення блокування:
          </label>
          <input
            type="datetime-local"
            name="lockout_end_date"
            value={formData.lockout_end_date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">
            Кількість невдалих спроб входу:
          </label>
          <input
            type="number"
            name="access_failed_count"
            value={formData.access_failed_count}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">Роль:</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="admin">Адміністратор</option>
            <option value="manager">Менеджер</option>
            <option value="operator">Оператор</option>
            <option value="director">Директор</option>
            <option value="region_manager">Регіональний менеджер</option>
            <option value="complaint_manager">Менеджер скарг</option>
            <option value="customer">Клієнт</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">ID користувача в 1C:</label>
          <input
            name="order_portal_user_id"
            value={formData.order_portal_user_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 font-semibold text-gray-700">GUID:</label>
          <input
            name="guid"
            value={formData.guid}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#003d66] text-white font-semibold py-2 rounded-md shadow-md hover:bg-[#00509e]"
        >
          Зареєструвати
        </button>
      </form>
    </div>
  );
}
