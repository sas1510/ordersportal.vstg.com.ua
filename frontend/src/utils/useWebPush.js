import axiosInstance from "../api/axios";

// Функція для конвертації VAPID ключа з рядка в масив байтів
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeToPush = async () => {
    try {
        // 1. Реєструємо Service Worker
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        
        // 2. Запитуємо дозвіл у користувача
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn("Користувач відхилив запит на сповіщення");
            return;
        }

        // 3. Твій публічний ключ (використовуй той, що згенерували раніше для settings.py)
        // ВАЖЛИВО: Використовуй саме цей короткий формат без знаків '+' та '/'
        const publicVapidKey = 'BL9wQus0T21rgqRFcjZhUmiZ6w0nv5siH9AFJBLayIqPbNCNMbsWPfjpNIQ3PH1RtnUuzbA7uGEJfwdgnmpImLY'; 

        const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        };

        // 4. Отримуємо підписку від браузера
        // 4. Отримуємо підписку
        // 4. Отримуємо об'єкт підписки
// Отримуємо об'єкт підписки від браузера
const subscription = await registration.pushManager.subscribe(subscribeOptions);
const subJson = subscription.toJSON();

const payload = {
    subscription: {
        endpoint: subJson.endpoint,
        keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth
        }
    },
    browser: getBrowserName(),
    status: "true"
};

// ВАЖЛИВО: додаємо змінну 'response' і слеш '/' в кінці URL
const response = await axiosInstance.post('/webpush/save_information/', payload);

console.log("Підписка успішно збережена:", response.data);
alert("Сповіщення активовано!");
    } catch (error) {
        console.error("Помилка підписки на пуші:", error);
        throw error;
    }
};

function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "chrome";
    if (ua.includes("Firefox")) return "firefox";
    return "safari";
}