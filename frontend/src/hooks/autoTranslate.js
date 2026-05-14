export const autoTranslate = async (text, targetLanguage) => {
  if (!text || targetLanguage === 'uk') return text; // Якщо мова українська, не перекладаємо

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=${targetLanguage}&dt=t&q=${encodeURI(text)}`
    );
    const data = await response.json();
    return data[0][0][0]; // Повертає перекладений рядок
  } catch (error) {
    console.error("Auto-translation error:", error);
    return text; // У разі помилки повертаємо оригінал
  }
};