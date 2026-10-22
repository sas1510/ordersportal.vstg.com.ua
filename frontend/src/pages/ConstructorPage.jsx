import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './ConstructorPage.css';

const SUPPORTED_LANGUAGES = ['en', 'de', 'pl', 'it', 'fr', 'ro'];

export default function ConstructorPage() {
  const { i18n } = useTranslation();
  const pageRef = useRef(null);
  const language = (i18n.resolvedLanguage || i18n.language || 'uk').split(/[-_]/)[0].toLowerCase();
  const prefix = SUPPORTED_LANGUAGES.includes(language) ? `${language}/` : '';

  useLayoutEffect(() => {
    const header = document.querySelector('[data-portal-header]');
    const headerContent = header?.firstElementChild;
    const updateBounds = () => {
      if (!pageRef.current) return;
      const top = Math.max(0, header?.getBoundingClientRect().bottom || 0);
      pageRef.current.style.top = `${top}px`;
      const bounds = (headerContent || header)?.getBoundingClientRect();
      if (bounds) {
        pageRef.current.style.left = `${bounds.left}px`;
        pageRef.current.style.width = `${bounds.width}px`;
      }
    };
    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    if (header) observer.observe(header);
    if (headerContent) observer.observe(headerContent);
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, []);

  return <section ref={pageRef} className="constructor-page">
    <iframe
      className="constructor-page-frame"
      src={`https://viknastyle.com.ua/${prefix}frame/constructor`}
      title="Конструктор дверей Вікна Стиль"
      sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  </section>;
}
