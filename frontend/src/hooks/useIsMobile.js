import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 1024;

const useIsMobile = () => {
  // Використовуємо window.matchMedia для ефективного відстеження медіа-запитів
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    // Media query, що спрацьовує, коли ширина менша за 1024px
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const handler = (event) => {
      // Оновлюємо стан лише при перетині порогу (1024px), 
      // а не при кожному зміщенні пікселя.
      setIsMobile(event.matches);
    };

    // Старий addListener/removeListener API використовується тут для сумісності та простоти
    // В новіших браузерах можна використовувати addEventListener('change', handler)
    mediaQuery.addListener(handler);
    
    // Встановлюємо початкове значення на випадок, якщо mounted
    // mediaQuery вже відповідає
    setIsMobile(mediaQuery.matches);

    return () => {
      mediaQuery.removeListener(handler);
    };
  }, []);

  return isMobile;
};

export default useIsMobile;