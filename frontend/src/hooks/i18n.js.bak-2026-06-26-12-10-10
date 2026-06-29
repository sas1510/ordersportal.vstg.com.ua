// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import Backend from 'i18next-http-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';

// i18n
//   .use(Backend) // Loads translations from /public/locales
//   .use(LanguageDetector) // Detects user language (browser settings, cookies, etc.)
//   .use(initReactI18next) // Passes i18n down to react-i18next
//   .init({
//     fallbackLng: 'en',
//     debug: false,
//     interpolation: {
//       escapeValue: false, // React already safes from xss
//     }
//   });

// export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
// LanguageDetector можна не імпортувати, якщо ми хочемо фіксовану мову

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'uk', // Встановлюємо українську як поточну
    fallbackLng: 'uk', // Якщо переклад відсутній — теж українська
    supportedLngs: ['uk'], // Обмежуємо список підтримуваних мов
    
    debug: false,
    interpolation: {
      escapeValue: false, 
    },
    // Опціонально: вимикаємо виявлення мови браузером, щоб lng: 'uk' завжди перемагало
    detection: {
      order: ['queryString', 'cookie'], // ігноруємо 'navigator' (налаштування браузера)
      caches: ['cookie'],
    }
  });

export default i18n;