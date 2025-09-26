import { useState, useEffect } from "react";
import {
  FaFileUpload,
  FaUserAlt,
  FaHashtag,
  FaClipboardList,
  FaCommentAlt,
} from "react-icons/fa";
import axiosInstance from "../api/axios";

export default function AddOrderPage() {
  const [file, setFile] = useState(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [clientComment, setClientComment] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const role = localStorage.getItem("role");
  const managerRoles = ["manager", "region_manager"];
  const isManager = managerRoles.includes(role);

  // ✅ Підтягуємо останній номер замовлення
useEffect(() => {
  const fetchLastOrderNumber = async () => {
    try {
      const response = await axiosInstance.get("/last-order-number/");
      const lastNumber = response.data?.LastOrderNumber || 0;
      setOrderNumber((lastNumber + 1).toString());
    } catch (error) {
      console.error("Не вдалося отримати останній номер замовлення:", error);
    }
  };
  fetchLastOrderNumber();
}, []);

  // ✅ Підтягуємо клієнтів, якщо менеджер
  useEffect(() => {
    if (isManager) {
      axiosInstance
        .get("/customers/")
        .then((res) => setCustomers(res.data))
        .catch((err) => console.error(err));
    }
  }, [isManager]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("OrderNumber", orderNumber);
    formData.append("ConstructionsCount", quantity.toString());
    formData.append("Comment", clientComment);

    if (isManager) {
      if (!customerId) {
        alert("Будь ласка, оберіть клієнта для замовлення");
        return;
      }
      formData.append("CustomerId", customerId);
    }

    setLoading(true);
    try {
      await axiosInstance.post("/create/", formData);
      alert("Замовлення успішно створене ✅");
      // Скидаємо форму
      setFile(null);
      setOrderNumber("");
      setQuantity(0);
      setClientComment("");
      setCustomerId("");
    } catch (error) {
      console.error(error.response?.data || error);
      alert("Помилка: " + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 px-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-8"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
          <FaFileUpload className="text-gray-600" /> Завантажити замовлення
        </h2>

        {isManager && (
          <label className="block mb-5">
            <span className="block mb-1 font-semibold text-gray-700 flex items-center gap-2">
              <FaUserAlt className="text-gray-600" /> Клієнт:
            </span>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring focus:ring-gray-300"
            >
              <option value="">Оберіть клієнта</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <FaFileUpload className="text-gray-600" /> Файл:
          </span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zkz,.ZKZ"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
          />
        </label>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <FaHashtag className="text-gray-600" /> Номер замовлення:
          </span>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-gray-300"
          />
        </label>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <FaClipboardList className="text-gray-600" /> Кількість конструкцій:
          </span>
          <input
            type="number"
            value={quantity}
            min={0}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-gray-300"
          />
        </label>

        <label className="block mb-6">
          <span className="block mb-1 font-semibold text-gray-700 flex items-center gap-2">
            <FaCommentAlt className="text-gray-600" /> Коментар контрагента:
          </span>
          <textarea
            value={clientComment}
            onChange={(e) => setClientComment(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-gray-300"
            rows={4}
            placeholder="Введіть коментар..."
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white font-semibold py-3 rounded-md shadow-md hover:bg-green-400 disabled:opacity-60 transition"
        >
          {loading ? "Завантаження..." : "Завантажити замовлення"}
        </button>
      </form>
    </div>
  );
}
