import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { RoleContext } from "../context/RoleContext";
import { useTheme } from "../context/ThemeContext"; 

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);   // 🔥 БЛОКУЄМО ДУБЛІ ЗАПИТІВ

  const navigate = useNavigate();
  const { setRole } = useContext(RoleContext);
  const { theme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;        // 🔥 БЛОКУВАННЯ ПОВТОРНОГО НАТИСКАННЯ
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axiosInstance.post("/login/", { username, password });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      const role = response.data.role;
      localStorage.setItem("role", role);
      setRole(role);

      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          const message =
            typeof error.response.data === "string"
              ? error.response.data
              : error.response.data?.message || "Невірний логін або пароль";

          setErrorMessage(message);
        } else {
          setErrorMessage("Помилка авторизації: " + error.response.status);
        }
      } else if (error.request) {
        setErrorMessage("Сервер недоступний. Перевірте підключення.");
      } else {
        setErrorMessage("Сталася помилка: " + error.message);
      }
    }

    setLoading(false);
  };

  const isDark = theme === "dark";

  /* === Динамічні стилі === */

  const bgClasses = isDark
    ? "min-h-screen bg-gray-950 flex items-center justify-center px-4"
    : "min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center px-4";

  const cardClasses = isDark
    ? "relative bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-10 transition duration-500 hover:scale-[1.01]"
    : "bg-white rounded-xl shadow-md max-w-md w-full p-8";

  const headerClasses = isDark
    ? "text-4xl font-extrabold text-blue-400 mb-8 text-center tracking-wider"
    : "text-4xl font-extrabold text-blue-800 mb-8 text-center tracking-wide";

  const inputClasses = isDark
    ? "px-5 py-4 border border-gray-700 bg-gray-700/70 text-white rounded-lg shadow-inner shadow-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-400/50 focus:border-blue-400 transition placeholder-gray-500"
    : "px-5 py-4 border border-blue-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-700 transition";

  const buttonClasses = isDark
    ? "mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-lg shadow-md shadow-blue-500/30 transition duration-300 transform hover:scale-[1.02]"
    : "mt-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-4 rounded-lg shadow-md transition duration-300";

  const errorClasses = isDark
    ? "text-red-400 text-center font-medium tracking-wide bg-red-900/30 p-2 rounded-lg border border-red-500/50"
    : "text-red-600 text-center font-medium tracking-wide";


  return (
    <div className={bgClasses}>
      {isDark && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-blue-950 opacity-90"></div>
      )}

      <div className={cardClasses}>
        <h2 className={headerClasses}>Вхід у систему</h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

          <input
            type="text"
            placeholder="Логін"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={inputClasses}
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClasses}
          />

          {errorMessage && (
            <div className={errorClasses}>{errorMessage}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={
              buttonClasses +
              (loading
                ? " opacity-60 cursor-not-allowed pointer-events-none"
                : "")
            }
          >
            {loading ? "Зачекайте..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}
