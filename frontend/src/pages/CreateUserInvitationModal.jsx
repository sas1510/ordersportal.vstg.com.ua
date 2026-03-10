import React, { useState } from "react";
import axiosInstance from "../api/axios";
import { Loader2, Copy, Check, X, ShieldCheck } from "lucide-react";

export default function CreateUserInvitationModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "", // 🔥 Додано телефон
    role: "admin",
    expireDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
  });

  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState(null); 
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post("/users/create-admin-direct/", formData);
      setCreatedData(res.data);
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Помилка при створенні адміністратора");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = `Логін: ${createdData.username}\nПароль: ${createdData.temporaryPassword}\nТелефон: ${createdData.phoneNumber || "не вказано"}`;
    
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e2227] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-blue-500" /> Створити адміністратора
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!createdData ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Логін (Username) *</label>
                <input
                  required
                  className="w-full p-2.5 bg-gray-100 border rounded-lg  dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Повне ім'я</label>
                <input
                  className="w-full p-2.5  bg-gray-100 border rounded-lg  dark:border-gray-700 dark:text-white"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Прізвище Ім'я"
                />
              </div>

              {/* 🔥 Нове поле для телефону */}
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Номер телефону</label>
                <input
                  type="tel"
                  className="w-full p-2.5  bg-gray-100 border rounded-lg  dark:border-gray-700 dark:text-white"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+380..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  className="w-full p-2.5  bg-gray-100 border rounded-lg  dark:border-gray-700 dark:text-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@vstg.com.ua"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">
                  Скасувати
                </button>
                <button
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-md"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Створити акаунт
                </button>
              </div>
            </form>
          ) : (
            <div className="py-4 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">Акаунт активовано!</h3>
              <p className="text-sm text-gray-500 mb-6">Дані нового адміністратора:</p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-left mb-6 space-y-2 relative group">
                <p className="text-sm dark:text-gray-400">Логін: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{createdData.username}</span></p>
                <p className="text-sm dark:text-gray-400">Пароль: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{createdData.temporaryPassword}</span></p>
                {/* Показуємо телефон, якщо він був введений */}
                {formData.phoneNumber && (
                  <p className="text-sm dark:text-gray-400">Телефон: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formData.phoneNumber}</span></p>
                )}
                
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 shadow-sm border rounded-md hover:text-blue-500 transition-colors"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              
              <p className="text-xs text-orange-600 dark:text-orange-400 mb-6 italic">
                * Рекомендуйте користувачу змінити пароль після першого входу.
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
              >
                Закрити
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}