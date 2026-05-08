import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  // Функція перемикання "по колу"
  const toggleLanguage = () => {
    const nextLanguage = i18n.language === 'uk' ? 'en' : 'uk';
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1 border border-zinc-300 rounded-md hover:bg-zinc-100 transition-colors font-semibold text-sm uppercase"
    >
      {/* Показуємо мову, на яку МОЖНА переключитися, або поточну */}
      {i18n.language === 'uk' ? 'EN' : 'UA'}
    </button>
  );
};

export default LanguageSwitcher;