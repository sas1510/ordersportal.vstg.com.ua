export const autoTranslate = async (text, targetLanguage) => {
  if (!text || targetLanguage === 'uk') return text; 

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=${targetLanguage}&dt=t&q=${encodeURI(text)}`
    );
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {

    return text; 
  }
};