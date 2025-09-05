import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

export default function AddClaimPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [claimDate, setClaimDate] = useState("");
  const [reason, setReason] = useState("");
  const [reasonId, setReasonId] = useState(""); // GUID обраної причини
  const [solution, setSolution] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const [reasonOptions, setReasonOptions] = useState([]);
  const [solutionOptions, setSolutionOptions] = useState([]);

  // Підвантаження причин з API
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const res = await axiosInstance.get("/complaints/issues");
        setReasonOptions(res.data); // очікуємо масив { guid, name }
      } catch (error) {
        console.error("Помилка при завантаженні причин:", error);
      }
    };
    fetchReasons();
  }, []);

  // Підвантаження рішень при зміні обраної причини
  useEffect(() => {
    if (!reasonId) {
      setSolutionOptions([]);
      setSolution("");
      return;
    }

    const fetchSolutions = async () => {
      try {
        const res = await axiosInstance.get(`/complaints/solutions/${reasonId}`);
        setSolutionOptions(res.data); // очікуємо масив { guid, name }
      } catch (error) {
        console.error("Помилка при завантаженні рішень:", error);
        setSolutionOptions([]);
      }
    };
    fetchSolutions();
  }, [reasonId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("orderNumber", orderNumber);
    formData.append("deliveryDate", deliveryDate);
    formData.append("claimDate", claimDate);
    formData.append("reason", reason);
    formData.append("solution", solution);
    formData.append("description", description);
    if (photo) formData.append("photo", photo);

    setLoading(true);
    try {
      await axiosInstance.post("/claims/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Рекламація успішно завантажена");
      setOrderNumber("");
      setDeliveryDate("");
      setClaimDate("");
      setReason("");
      setReasonId("");
      setSolution("");
      setSolutionOptions([]);
      setDescription("");
      setPhoto(null);
    } catch (error) {
      alert(
        "Помилка при завантаженні рекламації: " +
          (error.response?.data || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl mx-auto px-4 sm:px-6 mt-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200"
      >
        <h2 className="text-2xl font-bold text-[#003d66] mb-6 border-b border-[#003d66] pb-2">
          Додати рекламацію
        </h2>

        {/* Номер замовлення */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Номер замовлення:
          </span>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
            placeholder="Введіть номер замовлення"
          />
        </label>

        {/* Дата доставки */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Дата доставки замовлення:
          </span>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          />
        </label>

        {/* Дата рекламації */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Дата визначення рекламації:
          </span>
          <input
            type="date"
            value={claimDate}
            onChange={(e) => setClaimDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          />
        </label>

        {/* Причина рекламації */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Причина рекламації:
          </span>
          <select
            value={reason}
            onChange={(e) => {
              const selected = reasonOptions.find((opt) => opt.name === e.target.value);
              setReason(e.target.value);
              setReasonId(selected?.guid || "");
            }}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          >
            <option value="">-- Оберіть причину --</option>
            {reasonOptions.map((opt) => (
              <option key={opt.guid} value={opt.name}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>

        {/* Варіант вирішення */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Варіант вирішення:
          </span>
          <select
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d66]"
            disabled={!solutionOptions.length}
          >
            <option value="">-- Оберіть варіант --</option>
            {solutionOptions.map((opt) => (
              <option key={opt.guid} value={opt.name}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>

        {/* Опис рекламації */}
        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Опис рекламації:
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
            placeholder="Опишіть рекламацію..."
          />
        </label>

        {/* Фото рекламації */}
        <label className="block mb-6">
          <span className="block mb-1 font-semibold text-gray-700">
            Фото рекламації:
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            className="w-full text-sm text-gray-600"
          />
        </label>

        {/* Кнопка відправки */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-[#003d66] text-white font-semibold py-2 rounded-md shadow-md transition-colors duration-300 hover:bg-[#00509e] disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? "Завантаження..." : "Додати рекламацію"}
        </button>
      </form>
    </div>
  );
}
