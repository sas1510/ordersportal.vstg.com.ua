import { useState, useCallback } from "react";
import axiosInstance from "../api/axios";
import { useNotification } from "../hooks/useNotification";
import { Settings, X, Save, Eraser } from "lucide-react";
import "./EditUserModal.css";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { normalizeRole } from "../utils/roles";

const EDITABLE_ROLE_OPTIONS = [
  { value: "admin", label: "Адміністратор" },
  { value: "manager", label: "Менеджер" },
  { value: "region_manager", label: "Регіональний менеджер" },
  { value: "branch_manager", label: "Керівник філіалу" },
  { value: "branches_director", label: "Керівник усіх філій" },
];

const LEGACY_ROLE_LABELS = {
  customer: "Дилер",
  dealer: "Дилер",
  director: "Директор",
  complaint_manager: "Менеджер рекламацій",
  operator: "Оператор",
};

export default function EditUserModal({ user, branches = [], onClose, onUpdated }) {
  const { addNotification } = useNotification();
  const { isAdmin, role: currentRole } = useAuthGetRole();

  const originalFormData = {
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    role: normalizeRole(user.role),
    expire_date: user.expire_date?.slice(0, 10) ?? "",
    is_active: user.is_active,
    permit_finance_info: user.permit_finance_info,
    load_all_contractor_addresses: user.load_all_contractor_addresses ?? false,
    branch_id: user.branch_id ?? "",
    is_branch: user.is_branch ?? false,
    old_portal_id: user.old_portal_id,
  };

  const [form, setForm] = useState(originalFormData);
  const [isSaving, setIsSaving] = useState(false);
  const normalizedUserRole = normalizeRole(user.role);
  const allowedRoleOptions = isAdmin
    ? EDITABLE_ROLE_OPTIONS
    : EDITABLE_ROLE_OPTIONS.filter((option) => ["manager", "branch_manager"].includes(option.value));
  const roleOptions = allowedRoleOptions.some((option) => option.value === normalizedUserRole)
    ? allowedRoleOptions
    : [
        ...allowedRoleOptions,
        {
          value: normalizedUserRole,
          label: LEGACY_ROLE_LABELS[normalizedUserRole] || normalizedUserRole,
        },
      ];

  const hasChanges = Object.keys(form).some(
    (key) => String(form[key]) !== String(originalFormData[key]),
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
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating user:", error);
      }

      addNotification(
        error?.response?.data?.detail || error?.response?.data?.error || "Помилка при оновленні даних",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }, [form, user.id, onUpdated, onClose, hasChanges, isSaving, addNotification]);

  return (
    <div className="portal-user-edit-modal-overlay" onClick={onClose}>
      <div
        className="portal-user-edit-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
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

            {(isAdmin || currentRole === "branches_director") && <label className="portal-user-edit-label">
              <span>Роль</span>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="portal-user-edit-select"
              >
                {roleOptions.map((roleOption) => (
                  <option key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </option>
                ))}
              </select>
            </label>}

            {(isAdmin || currentRole === "branches_director") && (form.role === "manager" || form.role === "branch_manager") && (
              <label className="portal-user-edit-label">
                <span>Філія</span>
                <select
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  className="portal-user-edit-select"
                >
                  <option value="">Не вибрано</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {form.role === "manager" && (
              <label className="portal-user-edit-label portal-user-edit-checkbox-row">
                <input
                  type="checkbox"
                  name="is_branch"
                  checked={form.is_branch}
                  onChange={handleChange}
                />
                <span>Філіал</span>
              </label>
            )}

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

            <label className="portal-user-edit-label portal-user-edit-checkbox-row">
              <input
                type="checkbox"
                name="load_all_contractor_addresses"
                checked={form.load_all_contractor_addresses}
                onChange={handleChange}
              />
              <span>Завантажувати всі адреси контрагента</span>
            </label>
          </div>
        </div>

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
