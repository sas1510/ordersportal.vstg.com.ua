// hooks/useGlobalNotifications.js
import { useEffect } from 'react';
import { useNotification } from "../components/notification/Notifications.jsx";

export const useGlobalNotifications = () => {
    const { addNotification } = useNotification();

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (!token) return;

        const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
        const socket = new WebSocket(`${ws_scheme}://${window.location.host}/ws/notifications/?token=${token}`);

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === "initial_notifications") {
                console.log(`У вас ${data.unread_count} непрочитаних повідомлень`);
                // Можна зберегти в Redux/State для відображення цифри на дзвонику
            }

            if (data.type === "new_notification") {
                addNotification(
                    `Нове повідомлення: ${data.message}`, 
                    "info", 
                    5000 // тривалість 5 сек
                );
                // Оновити лічильник у хедері
            }
        };

        return () => socket.close();
    }, [addNotification]);
};