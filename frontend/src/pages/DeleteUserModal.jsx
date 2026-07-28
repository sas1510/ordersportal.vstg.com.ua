import { useState } from "react";
import axiosInstance from "../api/axios";
import { useNotification } from "../hooks/useNotification";
import { Trash2, X, ShieldAlert, Loader2 } from "lucide-react";
import "../pages/DeactivateUserModal.css";

export default function DeleteUserModal({ user, onClose, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotification();

  const deleteUser = async () => {
    setSaving(true);

    try {
      await axiosInstance.delete(`/users/${user.id}/delete/`);
      addNotification(`Користувача ${user.username} повністю видалено`, "success");

      setTimeout(() => {
        onUpdated();
        onClose();
      }, 500);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting user:", error);
      }
      addNotification(
        error?.response?.data?.detail || "Помилка повного видалення користувача",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="deactivate-modal-overlay fixed inset-0 flex items-center justify-center z-[10001]"
      onClick={onClose}
    >
      <div
        className="deactivate-modal w-[440px] shadow-2xl rounded-xl overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="deactivate-header px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trash2 size={26} />
            <h3 className="text-lg font-semibold">Повне видалення користувача</h3>
          </div>

          <button className="hover:opacity-80 transition" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4 deactivate-body-text">
          <div className="flex items-center gap-3 deactivate-warning-text font-semibold text-red-500">
            <ShieldAlert size={22} />
            Незворотна дія!
          </div>

          <p>
            Ви збираєтеся <strong>повністю видалити</strong> користувача:
            <span className="font-semibold text-red-600 dark:text-red-300 ml-1">
              {user.username}
            </span>
            .
          </p>

          <p>
            Ця дія видаляє акаунт назавжди. Після підтвердження відновити його вже не
            вийде.
          </p>
        </div>

        <div className="deactivate-footer px-6 py-4 flex justify-end gap-3">
          <button
            className="deactivate-btn-cancel px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition shadow-sm"
            onClick={onClose}
            disabled={saving}
          >
            <X size={18} />
            Скасувати
          </button>

          <button
            className="px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition shadow-md disabled:opacity-60 bg-red-600 hover:bg-red-700 text-white"
            onClick={deleteUser}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Видалення...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Видалити назавжди
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
