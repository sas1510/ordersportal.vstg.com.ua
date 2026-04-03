import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axios";
import "./ChangePassword.css";
import { useNotification } from "../hooks/useNotification";

const ChangePasswordPage = () => {
  const { addNotification } = useNotification(); // 🔥 використовуємо сповіщення

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const u = JSON.parse(user);
        const name = u.username || u.userName || u.first_last_name || "";
        setUsername(name);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (formData.newPassword !== formData.confirmNewPassword) {
        addNotification(
          "Новий пароль і підтвердження не співпадають.",
          "error",
        );
        return;
      }

      if (formData.newPassword.length < 6) {
        addNotification("Пароль повинен містити не менше 6 символів.", "error");
        return;
      }

      setLoading(true);
      addNotification("Змінюємо пароль...", "info");

      try {
        const response = await axiosInstance.post("/change-password/", {
          old_password: formData.oldPassword,
          new_password: formData.newPassword,
        });

        addNotification(
          response.data.message || "Пароль успішно змінено!",
          "success",
        );

        setFormData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Помилка. Перевірте поточний пароль.";

        addNotification(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
    [formData, addNotification],
  );

  return (
    <div className="cp-body">
      <div className="cp-window">
        <div className="cp-header">Зміна паролю</div>

        <div className="cp-form">
          {username && (
            <p style={{ marginBottom: "-5px", fontSize: "15px" }}>
              Ви зайшли як:{" "}
              <span style={{ color: "var(--info-color)", fontWeight: "600" }}>
                {username}
              </span>
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label className="cp-label">
              Поточний пароль
              <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                className="cp-input"
                disabled={loading}
                onChange={handleChange}
              />
            </label>

            <label className="cp-label">
              Новий пароль
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                className="cp-input"
                disabled={loading}
                onChange={handleChange}
              />
            </label>

            <label className="cp-label">
              Підтвердження нового пароля
              <input
                type="password"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                className="cp-input"
                disabled={loading}
                onChange={handleChange}
              />
            </label>

            <div className="cp-footer">
              <button
                type="submit"
                disabled={loading}
                className="cp-submit-btn"
              >
                {loading ? "Змінюємо..." : "Змінити пароль"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
