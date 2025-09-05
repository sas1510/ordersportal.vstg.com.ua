import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";

const ContactFormPage = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    telegramId: "",
    department: "",
  });
  const navigate = useNavigate();
  const { id } = useParams(); // якщо є id — редагування, якщо нема — створення

  useEffect(() => {
    if (id) {
      axiosInstance.get(`/contact/${id}`)
        .then((res) => {
          setForm({
            name: res.data.name,
            phone: res.data.phone,
            email: res.data.email,
            telegramId: res.data.telegramId || "",
            department: res.data.department || "",
          });
        })
        .catch((err) => console.error("Помилка завантаження контакту:", err));
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = id ? axiosInstance.put : axiosInstance.post;
    const url = id ? `/contact/${id}` : "/contact";

    method(url, form)
      .then(() => navigate("/contacts"))
      .catch((err) => console.error("Помилка збереження контакту:", err));
  };

  return (
    <div className="max-w-2xl mt-8 mx-auto px-6 py-8 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold border-b border-[#003d66] mb-6 text-[#003d66] pb-2">
        {id ? "Редагування контакту" : "Додавання контакту"}
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Ім'я"
          required
          className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Телефон"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          type="email"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />
        <input
          name="telegramId"
          value={form.telegramId}
          onChange={handleChange}
          placeholder="Telegram ID"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />
        <input
          name="department"
          value={form.department}
          onChange={handleChange}
          placeholder="Відділ"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-grow bg-[#003d66] hover:bg-[#002244] text-white font-semibold px-5 py-2 rounded-md"
          >
            {id ? "Оновити" : "Додати"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/contacts")}
            className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-md"
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactFormPage;
