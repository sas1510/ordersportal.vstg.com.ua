// src/services/translationService.js
const CACHE_PREFIX = 'tr_cache_';

export const translateText = async (text, targetLang) => {
  if (!text || targetLang.startsWith('uk')) return text;

  const cacheKey = `${CACHE_PREFIX}${targetLang}_${text}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const result = data[0].map(item => item[0]).join(''); // Коректна склейка довгих текстів
    
    localStorage.setItem(cacheKey, result);
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
        console.error("Translation error:", error);
    }
    return text; // Повертаємо оригінал, щоб інтерфейс не "падав"
  }
};