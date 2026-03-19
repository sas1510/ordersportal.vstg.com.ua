import { useState, useCallback } from "react";
import axiosInstance from "../api/axios";
import { useNotification } from "../components/notification/Notifications.jsx";

import { Settings, X, Save, Eraser } from "lucide-react";
import "./EditUserModal.css";

export default function EditUserModal({ user, onClose, onUpdated }) {
  const { addNotification } = useNotification();

  const originalFormData = {
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    role: user.role,
    expire_date: user.expire_date?.slice(0, 10) ?? "",
    is_active: user.is_active,
    permit_finance_info: user.permit_finance_info,
    old_portal_id: user.old_portal_id,
  };

  const [form, setForm] = useState(originalFormData);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = Object.keys(form).some(
    (key) => String(form[key]) !== String(originalFormData[key])
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    });
  };

  const saveChanges = useCallback(async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);

    try {
      await axiosInstance.put(`/users/${user.id}/edit/`, form);
      addNotification("Дані користувача успішно оновлено!", "success");

      onUpdated();
      onClose();
    } catch (e) {
      addNotification("Помилка при оновленні даних", "error");
    } finally {
      setIsSaving(false);
    }
  }, [form, user.id, onUpdated, onClose, hasChanges, isSaving]);

  return (
    <div className="portal-user-edit-modal-overlay" onClick={onClose}>
      <div
        className="portal-user-edit-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="portal-user-edit-modal-header">
          <div className="portal-user-edit-header-content">
            <div className="portal-user-edit-icon">
              <Settings size={28} />
            </div>

            <h3>Редагувати користувача: {user.username}</h3>
          </div>

          <button className="portal-user-edit-close-btn" onClick={onClose}>
            <X size={26} />
          </button>
        </div>

        {/* BODY */}
        <div className="portal-user-edit-form">
          <div className="portal-user-edit-grid">
            <label className="portal-user-edit-label">
              <span>Логін</span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="portal-user-edit-input"
              />
            </label>

            <label className="portal-user-edit-label">
              <span>ПІБ</span>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="portal-user-edit-input"
              />
            </label>

            <label className="portal-user-edit-label">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="portal-user-edit-input"
              />
            </label>

            <label className="portal-user-edit-label">
              <span>Телефон</span>
              <input
                name="phone_number"
                type="tel"
                value={form.phone_number}
                onChange={handleChange}
                className="portal-user-edit-input"
              />
            </label>

            <label className="portal-user-edit-label">
              <span>Роль</span>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="portal-user-edit-select"
              >
                <option value="admin">Адмін</option>
                <option value="manager">Менеджер</option>
                <option value="customer">Дилер</option>
              </select>
            </label>
{/* 
            <label className="portal-user-label">
              <span>ID 1С</span>
              <input
                name="user_id_1C"
                value={form.user_id_1C}
                onChange={handleChange}
                className="portal-user-input"
              />
            </label> */}

            <label className="portal-user-edit-label">
              <span>Дата закінчення доступу</span>
              <input
                type="date"
                name="expire_date"
                value={form.expire_date}
                onChange={handleChange}
                className="portal-user-edit-input"
              />
            </label>

            {/* <label className="portal-user-label">
              <span>ID Старого Порталу</span>
              <input
                name="old_portal_id"
                type="number"
                value={form.old_portal_id}
                onChange={handleChange}
                className="portal-user-input"
              />
            </label> */}

            <label className="portal-user-edit-label portal-user-edit-checkbox-row">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              <span>Активний</span>
            </label>

            <label className="portal-user-edit-label portal-user-edit-checkbox-row">
              <input
                type="checkbox"
                name="permit_finance_info"
                checked={form.permit_finance_info}
                onChange={handleChange}
              />
              <span>Доступ до фінансів</span>
            </label>
          </div>
        </div>

        {/* FOOTER */}
        <div className="portal-user-edit-modal-footer">
          <button className="portal-user-edit-btn-cancel" onClick={onClose}>
            <Eraser size={18} />
            Скасувати
          </button>

          <button
            className="portal-user-edit-btn-save"
            onClick={saveChanges}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner" />
                Збереження...
              </>
            ) : (
              <>
                <Save size={18} />
                Зберегти
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
