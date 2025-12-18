import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

import './Dashboard.css'

const videos = [
  "https://www.tiktok.com/@viknastyle/video/7537601329863200005?is_from_webapp=1",
  "https://www.tiktok.com/@viknastyle/video/7537322053884497208?is_from_webapp=1",
  "https://www.tiktok.com/@viknastyle/video/7536228535598386488?is_from_webapp=1",
];

export default function HomePage() {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false); // стан для паузи

  // Автопрокрутка каруселі
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollSpeed = 1.5;
    let requestId;

    const scroll = () => {
      if (!isPaused) {
        container.scrollLeft += scrollSpeed;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      requestId = requestAnimationFrame(scroll);
    };

    requestId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(requestId);
  }, [isPaused]);

  // Кнопки прокрутки
  const scrollLeft = () => {
    setIsPaused(true);
    containerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    setTimeout(() => setIsPaused(false), 500);
  };

  const scrollRight = () => {
    setIsPaused(true);
    containerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    setTimeout(() => setIsPaused(false), 500);
  };

  const loopVideos = [...videos, ...videos]; // безшовний цикл

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Hero Section */}
      {/* <section
        className="relative min-h-[900px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/3.jpg')" }}
      >
        <div className="absolute inset-0 bg-[#003d66]/60 flex items-center justify-center">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-white text-4xl md:text-6xl font-bold text-center px-4"
          >
            Вікна Стиль — 18 років на ринку України та Європи
          </motion.h1>
        </div>
      </section> */}

       <section className="dashboard-hero">
        <div className="dashboard-hero-overlay" />

        <div className="dashboard-hero-content">
          <h1 className="font-size-42 text-white text-bold text-center">
            Вікна Стиль — 18 років на ринку України та Європи
          </h1>
{/* 
          <div className="glass-badge">
            <span className="badge-icon">🏭</span>
            <span className="badge-text">
              Власне виробництво • Європейські стандарти • Надійне партнерство
            </span>
          </div> */}
        </div>
      </section>

      {/* Про компанію */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-[#003d66] mb-6"
        >
          Про компанію
        </motion.h2>
        <motion.p
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          Наша компанія знаходиться в 5 км від міста Чернівці, в селі Великий Кучурів.
          Площа заводу — понад <strong>16 000 м²</strong>. На виробництві працює понад <strong>500 працівників</strong>.
        </motion.p>
        <motion.p
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          Компанія «Вікна Стиль» успішно працює з 2003 року. Це історія успіху, заснована на бажанні бути кращими,
          без компромісів щодо якості.
        </motion.p>
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          Ми використовуємо унікальне програмне забезпечення, що дозволяє контролювати всі етапи виробництва
          та відвантаження. Географія продажів охоплює весь захід України, а також Румунію, Німеччину, Італію, Португалію, Канаду, США.
        </motion.p>
      </section>

      {/* TikTok Carousel */}
      <section className="max-w-6xl mx-auto px-4 py-12 relative">
        <h2 className="text-3xl font-bold text-[#003d66] mb-6">Наші відео</h2>

        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow hover:bg-gray-100 z-10"
        >
          ◀
        </button>
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow hover:bg-gray-100 z-10"
        >
          ▶
        </button>

        <div
          ref={containerRef}
          className="flex space-x-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 py-4"
          onMouseEnter={() => setIsPaused(true)}   // пауза при hover
          onMouseLeave={() => setIsPaused(false)}  // відновлення прокрутки
        >
          {loopVideos.map((url, index) => {
            const videoId = url.split("/video/")[1].split("?")[0];
            return (
              <motion.iframe
                key={index}
                src={`https://www.tiktok.com/embed/${videoId}`}
                width="300"
                height="533"
                frameBorder="0"
                allowFullScreen
                className="rounded-md shadow-lg flex-shrink-0 hover:scale-105 transition-transform duration-300"
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsPaused(true)} // зупинка прокрутки при кліку
                onBlur={() => setIsPaused(false)}  // продовження після того, як відео "втратило фокус"
              ></motion.iframe>

            );
          })}
        </div>
      </section>

      {/* Потужності */}
      <section className="bg-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
          {[
            { title: "Виробнича площа", value: "5500 м²" },
            { title: "ПВХ Вікон", value: "35 000 на місяць" },
            { title: "ПВХ Дверей", value: "9 000 на місяць" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="p-6 bg-white rounded-lg shadow hover:shadow-xl transition-shadow"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-2xl font-semibold text-[#003d66]">{item.title}</h3>
              <p className="text-xl mt-2">{item.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Цінності */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-[#003d66] mb-6">Наші цінності</h2>
        <div className="grid md:grid-cols-4 gap-6  text-center">
          {[
            { emoji: "🎨", title: "Естетика" },
            { emoji: "✅", title: "Якість" },
            { emoji: "💰", title: "Найкраща ціна" },
            { emoji: "🏠", title: "Безпека вашого дому" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="p-6 bg-gray-100  rounded-lg shadow hover:shadow-2xl transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="text-5xl mb-2">{item.emoji}</div>
              <p className="font-semibold">{item.title}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Завершення */}
      <section className="bg-[#f0f4f8] py-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-[#003d66] mb-4"
          >
            ДВЕРІ, ЯКІ ВІДКРИВАЮТЬ СВІТ УСПІШНОГО ПАРТНЕРСТВА
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-gray-700 text-lg"
          >
            “Вікна Стиль” — це не просто бізнес. Це команда, сервіс, стабільність і партнерство.
            Надійність нашої продукції — запорука Вашого комфорту і довіри клієнтів.
          </motion.p>
        </div>
      </section>
    </div>
  );
}
