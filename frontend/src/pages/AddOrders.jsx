import { useState, useEffect, useContext } from "react";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function AddOrderPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [clientComment, setClientComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isAuthenticated) {
        setLoadingUser(false);
        return;
      }

      try {
        const response = await axiosInstance.get("/me/");
        setUserId(response.data.user.id);
      } catch (error) {
        console.error("Не вдалося отримати користувача:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchLastOrderNumber = async () => {
      if (!userId) return;

      try {
        const response = await axiosInstance.get("/last-order-number/");
        const lastNumber = response.data?.LastOrderNumber || 0;
        setOrderNumber((lastNumber + 1).toString());
      } catch (error) {
        console.error("Не вдалося отримати останній номер замовлення:", error);
      }
    };

    fetchLastOrderNumber();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      alert("Користувач не знайдений. Будь ласка, увійдіть у систему.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file); // ⚡ правильна назва поля
    formData.append("OrderNumber", orderNumber);
    formData.append("UserId", userId.toString());
    formData.append("ConstructionsCount", quantity.toString());
    formData.append("Comment", clientComment);

    setLoading(true);

    try {
      await axiosInstance.post("/create/", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // ⚡ твій JWT токен
        },
      });
 // ⚡ не вказуємо Content-Type
      alert("Замовлення успішно створене ✅");
      setFile(null);
      setOrderNumber("");
      setQuantity(0);
      setClientComment("");
    } catch (error) {
      console.error(error.response?.data || error);
      alert("Помилка: " + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <p className="text-center mt-8">Будь ласка, увійдіть у систему</p>;
  }

  if (loadingUser) {
    return <p className="text-center mt-8">Завантаження даних користувача...</p>;
  }

  return (
    <div className="max-w-2xl mt-8 mx-auto px-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200"
      >
        <h2 className="text-2xl font-bold text-[#003d66] mb-6 border-b border-[#003d66] pb-2">
          Завантажити замовлення
        </h2>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">Файл:</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zkz,.ZKZ"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </label>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Номер замовлення:
          </span>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Введіть номер замовлення"
          />
        </label>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Кількість конструкцій:
          </span>
          <input
            type="number"
            value={quantity}
            min={0}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="0"
          />
        </label>

        <label className="block mb-6">
          <span className="block mb-1 font-semibold text-gray-700">
            Коментар контрагента:
          </span>
          <textarea
            value={clientComment}
            onChange={(e) => setClientComment(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={4}
            placeholder="Введіть коментар..."
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#003d66] text-white font-semibold py-2 rounded-md shadow-md hover:bg-[#00509e] disabled:opacity-60"
        >
          {loading ? "Завантаження..." : "Завантажити замовлення"}
        </button>
      </form>
    </div>
  );
}
