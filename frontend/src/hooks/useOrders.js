import axiosInstance from "../api/axios";
import { useState, useEffect } from "react";

export function useOrders(url) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;

    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(url); // через axios
        setOrders(response.data); // дані вже в response.data
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev =>
      prev.map(order =>
        order.Order_ID === orderId ? { ...order, OrderStatus: newStatus } : order
      )
    );
  };

  return { orders, updateOrderStatus, loading };
}
