import { useEffect } from 'react';

export const useCacheBuster = () => {
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Запит до version.json з унікальним параметром, щоб обійти кеш
        const response = await fetch(`/version.json?v=${Date.now()}`, {
          cache: 'no-store' // Додаткова вказівка браузеру не кешувати
        });
        
        if (!response.ok) return;

        const data = await response.json();
        const latestVersion = data.version;
        // Отримуємо версію, яка була збережена в браузері минулого разу
        const currentVersion = localStorage.getItem('app_version');

        if (currentVersion && currentVersion !== latestVersion) {
          console.log(`Нова версія (${latestVersion}) доступна. Оновлюємо...`);
          localStorage.setItem('app_version', latestVersion);
          
          // Примусове перезавантаження сторінки
          window.location.reload(); 
        } else {
          // Якщо версії збігаються або це перший візит — просто записуємо поточну
          localStorage.setItem('app_version', latestVersion);
        }
      } catch (error) {
        console.error('Не вдалося перевірити версію:', error);
      }
    };

    // Перевірка при завантаженні
    checkVersion();

    // Перевірка кожні 10 хвилин (можна змінити час)
    const interval = setInterval(checkVersion, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
};