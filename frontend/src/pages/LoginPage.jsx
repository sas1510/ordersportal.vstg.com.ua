import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { RoleContext } from "../context/RoleContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { setRole } = useContext(RoleContext);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage("");

  try {
    const response = await axiosInstance.post("/login/", { username, password });

    // Збереження токенів
    localStorage.setItem("access", response.data.access);
    // localStorage.setItem("refresh_token", response.data.refresh);

    // Збереження користувача
    localStorage.setItem("user", JSON.stringify(response.data.user));

    // Роль користувача
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
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md max-w-md w-full p-8">
        <h2 className="text-4xl font-extrabold text-blue-900 mb-8 text-center tracking-wide">
          Вхід у систему
        </h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <input
            type="text"
            placeholder="Логін"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="px-5 py-4 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-600 transition"
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-5 py-4 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-600 transition"
          />

          {errorMessage && (
            <div className="text-red-600 text-center font-medium tracking-wide">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="mt-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-4 rounded-lg shadow-md transition duration-300 ease-in-out"
          >
            Увійти
          </button>
        </form>
      </div>
    </div>
  );
}
