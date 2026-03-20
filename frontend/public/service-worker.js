self.addEventListener('push', function(event) {
    console.log('[Service Worker] Сигнал отримано!');
    
    let payload = {};

    if (event.data) {
        try {
            // Отримуємо JSON
            payload = event.data.json();
            console.log('[Service Worker] Дані отримано:', payload);
        } catch (e) {
            // Якщо прийшов звичайний текст
            payload = {
                head: 'Нове повідомлення',
                body: event.data.text()
            };
        }
    }

    // Використовуємо дані з бекенду (з вашого Python payload)
    const title = payload.head || payload.title || 'Orders Portal';
    const body = payload.body || 'У вас нове сповіщення';
    
    // ПРІОРИТЕТ: спочатку беремо icon/url з сервера, якщо немає — ставимо дефолт
    const options = {
        body: body,
        icon: payload.icon || '/header_logo_small.svg', 
        badge: payload.badge || '/header_logo_small.svg',
        vibrate: [100, 50, 100],
        data: {
            // Отримуємо URL з бекенду (http://172.17.19.107/dashboard)
            url: payload.url || '/dashboard' 
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Отримуємо URL, який ми поклали в data вище
    const targetUrl = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Якщо вкладка вже відкрита — фокусуємося на ній
            for (let client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Якщо ні — відкриваємо нову
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});