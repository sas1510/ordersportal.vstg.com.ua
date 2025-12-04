import { useState } from "react";
import axiosInstance from "../api/axios";
import { useNotification } from "../components/notification/Notifications";
import { KeyRound, X, Save, Eraser, Loader2 } from "lucide-react";

import "../pages/ChangeUserPasswordModal.css"; 

export default function ChangeUserPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const { addNotification } = useNotification();

  const submit = async () => {
    if (!password.trim()) return;
    setSaving(true);

    try {
      await axiosInstance.post(`/users/${user.id}/change-password/`, {
        password,
      });

      addNotification(`Пароль для ${user.username} успішно оновлено!`, "success");

      setTimeout(onClose, 700);
    } catch (e) {
      addNotification("Помилка зміни паролю", "error");
    }

    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/60 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="change-pass-modal rounded-xl w-[420px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="change-pass-header px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <KeyRound size={26} />
            <h3 className="text-lg font-semibold">Змінити пароль</h3>
          </div>

          <button
            className="hover:opacity-80 transition text-white"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          <div className="change-pass-label text-base">
            Встановити новий пароль для:
            <span className="font-semibold ml-1 text-blue-700 dark:text-blue-200">
              {user.username}
            </span>
          </div>

          <input
            type="password"
            className="change-pass-input w-full p-3 rounded-lg text-base outline-none transition"
            placeholder="Новий пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* FOOTER */}
        <div className="change-pass-footer px-6 py-4 flex justify-end gap-3">
          <button
            className="change-pass-btn-cancel px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition"
            onClick={onClose}
            disabled={saving}
          >
            <Eraser size={18} />
            Скасувати
          </button>

          <button
            className="change-pass-btn-save px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition disabled:opacity-60"
            onClick={submit}
            disabled={saving || !password.trim()}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
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
