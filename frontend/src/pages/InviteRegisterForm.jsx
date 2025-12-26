// src/components/InviteRegisterForm.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import "./InviteRegisterForm.css";

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
    access_failed_count: 0,
    role: "customer",
    order_portal_user_id: "",
    auto_confirm_order: false,
    permit_finance_info: false,
  });

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosInstance
      .get(`/register/${code}/`)
      .then((res) => {
        const d = res.data;
        setFormData((prev) => ({
          ...prev,
          full_name: d.full_name || "",
          username: d.username || "",
          phone_number: d.phone_number || "",
          expire_date: d.expire_date || "",
          role: d.role || "customer",
          order_portal_user_id: d.user_id_1C || "",
          auto_confirm_order: d.auto_confirm_order || false,
          permit_finance_info: d.permit_finance_info || false,
        }));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Не вдалося завантажити дані");
        setLoading(false);
      });
  }, [code]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
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
      setError(err.response?.data?.error || "Помилка реєстрації");
    }
  };

  if (loading)
    return (
      <div className="portal-body align-center">
        <div className="loading-spinner"></div>
      </div>
    );

  if (error)
    return (
      <div className="portal-body align-center">
        <div className="panel invite-panel text-danger text-center">
          {error}
        </div>
      </div>
    );

  if (success)
    return (
      <div className="portal-body align-center">
        <div className="panel invite-panel text-success text-center">
          Реєстрацію успішно завершено
        </div>
      </div>
    );

  return (
    <div className="portal-body">
      <div className="invite-wrapper">
        <div className="panel invite-panel column gap-14">
          <div className="header uppercase text-info">
            Реєстрація за запрошенням
          </div>

          <form onSubmit={handleSubmit} className="column gap-14">
            {/* ===== ОСНОВНІ ДАНІ ===== */}
            <div className="row gap-14">
              <div className="column w-50">
                <label>Повне ім’я</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>

              <div className="column w-50">
                <label>Логін</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row gap-14">
              <div className="column w-50">
                <label>Телефон</label>
                <input
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div className="column w-50">
                <label>Пароль</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ===== СИСТЕМНІ ПОЛЯ ===== */}
            <div className="row gap-14">
              <div className="column w-50">
                <label>Роль</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
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

              <div className="column w-50">
                <label>ID користувача (1C)</label>
                <input
                  name="order_portal_user_id"
                  value={formData.order_portal_user_id}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ===== ЧЕКБОКСИ ===== */}
            <div className="row gap-14">
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="auto_confirm_order"
                  checked={formData.auto_confirm_order}
                  onChange={handleChange}
                />
                Автопідтвердження замовлень
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  name="permit_finance_info"
                  checked={formData.permit_finance_info}
                  onChange={handleChange}
                />
                Доступ до фінансів
              </label>
            </div>

            <div className="delimiter1"></div>

            <button type="submit" className="button background-info">
              Завершити реєстрацію
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
