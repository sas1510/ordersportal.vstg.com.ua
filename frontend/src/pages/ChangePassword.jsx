import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("text-black bg-red-100");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userObj = JSON.parse(user);
        setUsername(userObj.username || userObj.userName || userObj.first_last_name || "");
      } catch {
        setUsername("");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmNewPassword) {
      setMessage("Новий пароль і підтвердження не співпадають");
      setMessageColor("text-black bg-red-100");
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      setMessage(response.data || "Пароль успішно змінено!");
      setMessageColor("text-black bg-green-100");
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setMessage(err.response?.data || "Помилка при зміні пароля");
      setMessageColor("text-black bg-red-100");
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-2xl bg-gray-50 shadow-md mt-12">
      <h2 className="text-3xl font-bold text-[#003d66] mb-1 text-center">
        Зміна паролю
      </h2>
      {username && (
        <p className="text-center text-gray-600 mb-6 select-none">
          Управління обліковим записом.<br />
          Ви зайшли як користувач: <span className="font-semibold">{username}</span>
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="password"
          name="oldPassword"
          placeholder="Поточний пароль"
          value={formData.oldPassword}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003d66] transition"
        />
        <input
          type="password"
          name="newPassword"
          placeholder="Новий пароль"
          value={formData.newPassword}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003d66] transition"
        />
        <input
          type="password"
          name="confirmNewPassword"
          placeholder="Підтвердження нового пароля"
          value={formData.confirmNewPassword}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003d66] transition"
        />
        <button
          type="submit"
          className="w-full bg-[#003d66] hover:bg-[#002244] text-white font-semibold py-3 rounded-lg shadow-md transition-colors duration-300"
        >
          Змінити пароль
        </button>
      </form>
      {message && (
        <p
          className={`${messageColor} mt-6 text-center font-semibold text-lg px-4 py-2 rounded-md shadow-md select-none`}
          role="alert"
          style={{ textShadow: "0 0 2px rgba(0,0,0,0.2)" }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default ChangePassword;
