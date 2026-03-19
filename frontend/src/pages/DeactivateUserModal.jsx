import { useState } from "react";
import axiosInstance from "../api/axios";
import { useNotification } from "../components/notification/Notifications";
import { UserX, X, ShieldAlert, Loader2 } from "lucide-react";

import "../pages/DeactivateUserModal.css"; // 👈 CSS ПІДКЛЮЧЕНО

export default function DeactivateUserModal({ user, onClose, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotification();

  const deactivate = async () => {
    setSaving(true);

    try {
      await axiosInstance.put(`/users/${user.id}/deactivate/`);

      addNotification(
        `Користувача ${user.username} успішно деактивовано`,
        "success"
      );

      setTimeout(() => {
        onUpdated();
        onClose();
      }, 700);
    } catch (e) {
      addNotification("Помилка деактивації користувача", "error");
    }

    setSaving(false);
  };

  return (
    <div
      className="deactivate-modal-overlay fixed inset-0 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="deactivate-modal w-[420px] shadow-2xl rounded-xl overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="deactivate-header px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserX size={26} />
            <h3 className="text-lg font-semibold">Деактивація користувача</h3>
          </div>

          <button
            className="hover:opacity-80 transition"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 deactivate-body-text">
          <div className="flex items-center gap-3 deactivate-warning-text font-semibold">
            <ShieldAlert size={22} />
            Увага!
          </div>

          <p>
            Ви збираєтеся <strong>деактивувати</strong> користувача:
            <span className="font-semibold text-blue-700 dark:text-blue-300 ml-1">
              {user.username}
            </span>
            .
          </p>

          <p>
            Після деактивації користувач <strong>не зможе увійти</strong> в портал,
            доки його не активують знову.
          </p>
        </div>

        {/* FOOTER */}
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
            className="deactivate-btn-submit px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition shadow-md disabled:opacity-60"
            onClick={deactivate}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Виконується...
              </>
            ) : (
              <>
                <UserX size={18} />
                Деактивувати
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
