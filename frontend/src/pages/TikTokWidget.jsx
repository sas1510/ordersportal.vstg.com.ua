import React, { useEffect, useState } from 'react';

const TikTokWidget = ({ username = 'viknastyle' }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let script;
    const scriptId = 'tiktok-embed-script';
const initTikTok = () => {
  // Перевіряємо, чи скрипт вже завантажений глобально
  if (window.tiktok && typeof window.tiktok.render === 'function') {
    window.tiktok.render();
    setIsLoaded(true);
    return;
  }

  // Якщо скрипта ще немає в DOM взагалі
  if (!document.getElementById(scriptId)) {
    script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    script.onload = () => {
        // Даємо невелику паузу після завантаження скрипта
        setTimeout(() => {
            if (window.tiktok) window.tiktok.render();
            setIsLoaded(true);
        }, 100);
    };
    document.body.appendChild(script);
  }
};

    // Затримка ініціалізації на 200мс, щоб дати React завершити рендер сторінки
    const timeout = setTimeout(initTikTok, 200);

    return () => {
      clearTimeout(timeout);
      // Ми не видаляємо скрипт з body, щоб при повторному переході він не вантажився знову,
      // але ми зупиняємо таймер, якщо користувач швидко пішов зі сторінки.
    };
  }, [username]);

  

  return (
    <div className=" min-h-[400px] relative flex flex-col w-full ">
        <div className="flex flex-col items-center justify-center  bg-white rounded-lg shadow-sm w-full  min-h-[400px] relative">
      {/* Скелетон/Заглушка: поки скрипт вантажиться, показуємо гарний блок */}
      {!isLoaded && (
        <div className="absolute inset-0 flex  !mt-0 !mb-0 flex-col items-center justify-center bg-slate-50 rounded-xl animate-pulse">
           <div className="w-16 h-16 bg-slate-200 rounded-full mb-4"></div>
           <div className="w-48 h-4 bg-slate-200 rounded"></div>
           <p className=" text-slate-400 text-sm">Завантаження стрічки TikTok...</p>
        </div>
      )}

      <blockquote
          className="tiktok-embed !mt-0 !mb-0 !w-full !rounded-lg"
        cite={`https://www.tiktok.com/@${username}`}
        data-unique-id={username}
        data-embed-type="creator"
         style={{
    width: '100%',
    maxWidth: '1200px',
    minWidth: '320px',
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.5s ease'
  }}
      >
        <section>
          <a 
            target="_blank" 
            rel="noreferrer"
            href={`https://www.tiktok.com/@${username}?refer=creator_embed`}
          >
            @{username}
          </a>
        </section>
      </blockquote>
    </div>
    </div>
  );
};

export default TikTokWidget;