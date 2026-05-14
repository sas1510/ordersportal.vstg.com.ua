import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { autoTranslate } from "../../hooks/autoTranslate";

const AutoTranslatedText = ({ text }) => {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (!text || i18n.language.startsWith('uk')) {
       setTranslatedText(text);
       return;
    }

    const translate = async () => {
      const lang = i18n.language.substring(0, 2);
      const cacheKey = `tr_${lang}_${text}`;
      
      // Перевірка кешу
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setTranslatedText(cached);
        return;
      }

      const res = await autoTranslate(text, lang);
      localStorage.setItem(cacheKey, res);
      setTranslatedText(res);
    };

    translate();
  }, [text, i18n.language]);

  return <span>{translatedText}</span>;
};

export default AutoTranslatedText;