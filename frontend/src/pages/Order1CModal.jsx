import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

const Order1CModal = ({ numbers, onClose }) => {
  const [modalData, setModalData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrderStatus = async () => {
    if (!numbers || numbers.length === 0) return;
    setLoading(true);
    try {
      const numbersStr = numbers.join(",");
      const res = await axiosInstance.get(
        `/get_order_payment_status/?numbers=${numbersStr}`
      );
      setModalData(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
  }, [numbers]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-6xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          ✖
        </button>
        <h2 className="text-xl font-bold mb-4">Статус замовлень</h2>

        {loading ? (
          <p>Завантаження...</p>
        ) : modalData.length === 0 ? (
          <p className="text-gray-500">Немає даних</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">OrderNumber</th>
                <th className="border px-2 py-1">ApproveDate</th>
                <th className="border px-2 py-1">UpdateDate</th>
                <th className="border px-2 py-1">OrderSum</th>
                <th className="border px-2 py-1">TotalPayments</th>
                <th className="border px-2 py-1">LastPaymentDate</th>
                <th className="border px-2 py-1">PaymentStatus</th>
                <th className="border px-2 py-1">OrderStatus</th>
                <th className="border px-2 py-1">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {modalData.map((item, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{item.OrderNumber}</td>
                  <td className="border px-2 py-1">
                    {item.ApproveDate
                      ? new Date(item.ApproveDate).toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="border px-2 py-1">
                    {item.UpdateDate
                      ? new Date(item.UpdateDate).toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="border px-2 py-1">{Number(item.OrderSum).toLocaleString("uk-UA", { minimumFractionDigits: 2 })}</td>
                  <td className="border px-2 py-1">{Number(item.TotalPayments).toLocaleString("uk-UA", { minimumFractionDigits: 2 })}</td>
                  <td className="border px-2 py-1">
                    {item.LastPaymentDate
                      ? new Date(item.LastPaymentDate).toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="border px-2 py-1">{item.PaymentStatus}</td>
                  <td className="border px-2 py-1">{item.OrderStatus}</td>
                  <td className="border px-2 py-1">{Number(item.Quantity).toLocaleString("uk-UA", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Order1CModal;
