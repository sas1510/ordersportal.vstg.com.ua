import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddReorderForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [noOrder, setNoOrder] = useState(false);
  const [element, setElement] = useState("");
  const [impost, setImpost] = useState("");
  const [reason, setReason] = useState("");
  const [customerPaysHardware, setCustomerPaysHardware] = useState(false);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);

  const navigate = useNavigate();

  const reasonOptions = [
    "Пошкодження на об'єкті",
    "Не той елемент",
    "Брак при монтажі",
    "Інше",
  ];

  const elementOptions = [
    "Стулка",
    "Імпост",
    "Штапик",
    "Склопакет",
    "Ручка",
    "Інше",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("orderNumber", orderNumber);
    formData.append("noOrder", noOrder);
    formData.append("element", element);
    formData.append("impost", impost);
    formData.append("reason", reason);
    formData.append("customerPaysHardware", customerPaysHardware);
    formData.append("comment", comment);
    if (file) {
      formData.append("file", file);
    }

    console.log("Дозамовлення надіслано");
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-2xl mt-8 mx-auto px-6">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-gray-50 rounded-xl shadow-md border border-gray-200"
      >
        <h2 className="text-2xl font-bold text-[#003d66] mb-6 border-b border-[#003d66] pb-2">
          Додати дозамовлення
        </h2>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Номер замовлення:
          </span>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            disabled={noOrder}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66] disabled:bg-gray-100"
            placeholder="Введіть номер замовлення"
          />
        </label>

        <div className="flex items-center gap-2 mb-5">
          <input
            type="checkbox"
            checked={noOrder}
            onChange={(e) => setNoOrder(e.target.checked)}
            className="h-4 w-4 text-[#003d66] focus:ring-[#003d66]"
          />
          <label className="text-gray-700">Без замовлення</label>
        </div>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Елемент на дозамовлення:
          </span>
          <select
            value={element}
            onChange={(e) => setElement(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          >
            <option value="">-- Оберіть елемент --</option>
            {elementOptions.map((el) => (
              <option key={el} value={el}>
                {el}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Причина дозамовлення:
          </span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          >
            <option value="">-- Оберіть причину --</option>
            {reasonOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-5">
          <span className="block mb-1 font-semibold text-gray-700">
            Коментар контрагента:
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
            placeholder="Введіть коментар..."
          />
        </label>

        <label className="block mb-6">
          <span className="block mb-1 font-semibold text-gray-700">
            Фото / файл:
          </span>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
          />
        </label>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 bg-[#003d66] text-white font-semibold py-2 rounded-md shadow-md transition-colors duration-300 hover:bg-[#00509e]"
          >
            ➕ Додати дозамовлення
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-md shadow-md transition-colors duration-300"
          >
            ✖️ Відмінити
          </button>
        </div>
      </form>
    </div>
  );
}
