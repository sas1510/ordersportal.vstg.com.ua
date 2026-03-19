self.addEventListener('push', function(event) {
    console.log('[Service Worker] Сигнал отримано!');
    
    let payload = {};

    if (event.data) {
        try {
            // Спробуємо розпарсити як JSON
            payload = event.data.json();
            console.log('[Service Worker] Дані (JSON):', payload);
        } catch (e) {
            // Якщо це просто текст
            payload = {
                title: 'Нове повідомлення',
                body: event.data.text()
            };
            console.log('[Service Worker] Дані (Текст):', payload.body);
        }
    }

    // Бібліотека може надсилати 'head' або 'title'
    const title = payload.head || payload.title || 'Orders Portal';
    const body = payload.body || payload.message || 'У вас нове сповіщення';

    const options = {
        body: body,
        icon: '/header_logo.png',
        badge: '/header_logo_small.png',
        vibrate: [100, 50, 100],
        data: {
            url: payload.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});