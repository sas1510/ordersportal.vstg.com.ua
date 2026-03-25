import axiosInstance from "../api/axios";

// Конвертація ключа (Base64 -> Uint8Array)
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

function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "chrome";
    if (ua.includes("Firefox")) return "firefox";
    return "safari";
}

export const subscribeToPush = async () => {
    console.log("--- Спроба підписки на Push ---");

    try {
        // 1. Перевірка оточення
        if (!('serviceWorker' in navigator)) {
            throw new Error("Браузер не підтримує Service Workers");
        }
        if (!('PushManager' in window)) {
            throw new Error("Браузер не підтримує Push API");
        }

        // 2. Реєстрація воркера
        console.log("Крок 1: Реєстрація Service Worker...");
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
        });
        console.log("Service Worker зареєстровано:", registration);

        // 3. Запит дозволу (Ось тут має з'явитися вікно!)
        console.log("Крок 2: Запит дозволу (Notification.requestPermission)...");
        
        // Скидаємо стан, якщо він default, щоб змусити браузер спитати
        const permission = await Notification.requestPermission();
        console.log("Результат запиту дозволу:", permission);

        if (permission !== 'granted') {
            throw new Error("Користувач відхилив запит на сповіщення");
        }

        // 4. Підписка на Push Service (Google/Mozilla)
        console.log("Крок 3: Отримання підписки від Push Service...");
        const publicVapidKey = 'BL9wQus0T21rgqRFcjZhUmiZ6w0nv5siH9AFJBLayIqPbNCNMbsWPfjpNIQ3PH1RtnUuzbA7uGEJfwdgnmpImLY';
        
        const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        };

        const subscription = await registration.pushManager.subscribe(subscribeOptions);
        const subJson = subscription.toJSON();
        console.log("Підписка отримана:", subJson);

        // 5. Відправка на бекенд (Django)
        console.log("Крок 4: Відправка на сервер...");
        const payload = {
            subscription: subJson,
            browser: getBrowserName(),
            status: "true"
        };

        const response = await axiosInstance.post('/webpush/save_information/', payload);
        console.log("Сервер зберіг підписку:", response.data);

        return true;
    } catch (error) {
        console.error("Помилка підписки:", error.message);
        alert("Помилка: " + error.message);
        throw error;
    }
};


export const unsubscribeFromPush = async () => {
    console.log("--- Спроба відписки від Push ---");
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;


        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {

            const subJson = subscription.toJSON();
            
            try {

                await axiosInstance.post('/webpush/save_information/', {
                    subscription: subJson,
                    status: "false" 
                });
                console.log("Бекенд: підписку видалено");
            } catch (apiError) {
                console.warn("Не вдалося видалити підписку з сервера, але продовжуємо відписку в браузері", apiError);
            }

            const successful = await subscription.unsubscribe();
            console.log("Браузер: відписка успішна?", successful);
        }

        return true;
    } catch (error) {
        console.error("Помилка при відписці:", error);
        throw error;
    }
};