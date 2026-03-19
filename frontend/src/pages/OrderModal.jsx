import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

const OrderModal = ({ order, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  // Завантажити історію коментарів
  const fetchOrderMessages = async () => {
    try {
      const res = await axiosInstance.get(`/orders/${order.PortalOrderId}/messages/`);
      setMessages(res.data); // передбачається, що бекенд повертає список повідомлень
    } catch (err) {
      console.error("Помилка при завантаженні історії:", err);
    }
  };

  useEffect(() => {
    fetchOrderMessages();
  }, [order]);

  // Додавання нового коментаря
  const handleAddMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      await axiosInstance.post(`/orders/${order.PortalOrderId}/add-message/`, {
        message: newMessage,
      });
      setNewMessage("");
      fetchOrderMessages(); // оновити список після додавання
    } catch (err) {
      console.error("Помилка при додаванні коментаря:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Історія замовлення</h2>
        <p><strong>№ замовлення:</strong> {order.CustomerOrderNumber}</p>
        <p><strong>Статус:</strong> {order.Status}</p>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Коментарі:</h3>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">Коментарі відсутні</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {messages.map((msg, idx) => (
                <li key={idx} className="border border-gray-200 rounded p-2 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">
                    [{new Date(msg.created_at).toLocaleString()}]{" "}
                    <span className="font-semibold">{msg.author}</span>
                  </div>
                  <div className="text-sm text-gray-700">{msg.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Додати новий коментар */}
        <div className="mt-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Написати коментар..."
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={3}
          />
          <button
            onClick={handleAddMessage}
            disabled={loading}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "Додаємо..." : "Додати коментар"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full"
        >
          Закрити
        </button>
      </div>
    </div>
  );
};

export default OrderModal;
