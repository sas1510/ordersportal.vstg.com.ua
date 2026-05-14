import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axios";
import "./ChangePassword.css";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next"; // Імпортуємо хук перекладу

const ChangePasswordPage = () => {
  const { t } = useTranslation(); // Використовуємо хук
  const { addNotification } = useNotification();

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
        addNotification(t("change_password.error_mismatch"), "error");
        return;
      }

      if (formData.newPassword.length < 6) {
        addNotification(t("change_password.error_length"), "error");
        return;
      }

      setLoading(true);
      addNotification(t("change_password.info_changing"), "info");

      try {
        const response = await axiosInstance.post("/change-password/", {
          old_password: formData.oldPassword,
          new_password: formData.newPassword,
        });

        addNotification(
          response.data.message || t("change_password.success_message"),
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
          t("change_password.error_general");

        addNotification(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
    [formData, addNotification, t],
  );

  return (
    <div className="cp-body">
      <div className="cp-window">
        <div className="cp-header">{t("change_password.header")}</div>

        <div className="cp-form">
          {username && (
            <p style={{ marginBottom: "-5px", fontSize: "15px" }}>
              {t("change_password.logged_in_as")}{" "}
              <span style={{ color: "var(--info-color)", fontWeight: "600" }}>
                {username}
              </span>
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label className="cp-label">
              {t("change_password.old_password_label")}
              <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                className="cp-input"
                disabled={loading}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </label>

            <label className="cp-label">
              {t("change_password.new_password_label")}
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                className="cp-input"
                disabled={loading}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </label>

            <label className="cp-label">
              {t("change_password.confirm_password_label")}
              <input
                type="password"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                className="cp-input"
                disabled={loading}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </label>

            <div className="cp-footer">
              <button
                type="submit"
                disabled={loading}
                className="cp-submit-btn"
              >
                {loading ? t("change_password.btn_loading") : t("change_password.btn_submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;