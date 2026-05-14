import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { translateText } from "../services/translationService"; // Перевірте шлях до сервісу!

const AutoTranslatedText = ({ text }) => {
  const { i18n } = useTranslation();
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const targetLang = i18n.language ? i18n.language.substring(0, 2) : 'en';

    if (!text || targetLang === 'uk') {
      setTranslated(text);
      return;
    }

    const performTranslation = async () => {
      setLoading(true);
      try {
        const result = await translateText(text, targetLang);
        if (isMounted) {
          setTranslated(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    performTranslation();

    return () => {
      isMounted = false;
    };
  }, [text, i18n.language]);

  return (
    <span className={loading ? "translating" : ""}>
      {translated}
    </span>
  );
};

export default AutoTranslatedText;