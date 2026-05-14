/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */
self.addEventListener('push', function(event) {
    if (process.env.NODE_ENV === "development") {
        console.log('[Service Worker] Сигнал отримано!');
    }
    
    let payload = {};

    if (event.data) {
        try {
 
            payload = event.data.json();
            if (process.env.NODE_ENV === "development") {
                if (process.env.NODE_ENV === "development") {
                    console.log('[Service Worker] Дані отримано:', payload);
                }
            }
        } catch  {

            payload = {
                head: 'Нове повідомлення',
                body: event.data.text()
            };
        }
    }


    const title = payload.head || payload.title || 'Orders Portal';
    const body = payload.body || 'У вас нове сповіщення';

    const options = {
        body: body,
        icon: payload.icon || '/header_logo_small.svg', 
        badge: payload.badge || '/header_logo_small.svg',
        vibrate: [100, 50, 100],
        data: {
            
            url: payload.url || '/dashboard' 
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
  
    const targetUrl = event.notification.data.url;

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(windowClients => {
        
            for (let client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
     
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});