import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faAward, faUsers, faIndustry, faWindowRestore, 
  faGlobe, faMicrochip, faPalette, faShieldHalved, 
  faHandshake, faCheckDouble, faTags, faChevronDown,
  faChevronLeft, faChevronRight
} from "@fortawesome/free-solid-svg-icons";

const videos = [
  "https://www.tiktok.com/@viknastyle/video/7537601329863200005",
  "https://www.tiktok.com/@viknastyle/video/7537322053884497208",
  "https://www.tiktok.com/@viknastyle/video/7536228535598386488",
];
export default function HomePage() {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [videoActive, setVideoActive] = useState(false);


  // Цвета из вашей системы
  const colors = {
    bg: "#e9ebee",
    info: "#5e83bf",
    success: "#76b448",
    danger: "#e46321",
    text: "#606060",
    border: "#95959563"
  };

  useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const scrollSpeed = 1.2;
  let requestId;

  const scroll = () => {
    if (!isPaused && !videoActive) {
      container.scrollLeft += scrollSpeed;
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      }
    }
    requestId = requestAnimationFrame(scroll);
  };

  requestId = requestAnimationFrame(scroll);
  return () => cancelAnimationFrame(requestId);
}, [isPaused, videoActive]);


  const stats = [
    { value: "18+", label: "Років досвіду", icon: faAward, color: colors.info },
    { value: "500+", label: "Працівників", icon: faUsers, color: colors.success },
    { value: "16,000м²", label: "Площа заводу", icon: faIndustry, color: colors.text },
    { value: "35,000", label: "Вікон на місяць", icon: faWindowRestore, color: colors.info },
  ];

  const values = [
    { icon: faPalette, title: "Естетика", desc: "Сучасний дизайн", color: colors.info },
    { icon: faCheckDouble, title: "Якість", desc: "Європейські стандарти", color: colors.success },
    { icon: faTags, title: "Найкраща ціна", desc: "Власне виробництво", color: colors.danger },
    { icon: faShieldHalved, title: "Безпека", desc: "Надійний захист", color: colors.info },
  ];

  return (
    <div className="min-h-screen text-[#606060] font-sans overflow-x-hidden" style={{ backgroundColor: colors.bg }}>
      
      {/* Hero Section - Более строгий градиент */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#2d2826]">
        <motion.div style={{ opacity }} className="absolute inset-0 opacity-40">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2d2826]"></div>
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-light text-white mb-4 uppercase tracking-wider">
              Вікна Стиль
            </h1>
            <div className="h-px w-24 bg-white/30 mx-auto mb-8"></div>
            <p className="text-xl text-gray-300 mb-12 font-light">
              ПРОФЕСІЙНІ ВІКОННІ СИСТЕМИ ДЛЯ ЄВРОПЕЙСЬКОГО РИНКУ
            </p>
          </motion.div>

          {/* Stats Grid - Стиль вашей панели (Panel) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded"
              >
                <FontAwesomeIcon icon={stat.icon} className="text-2xl mb-3 opacity-80 text-white" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-xs uppercase tracking-tighter">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mt-20">
            <FontAwesomeIcon icon={faChevronDown} className="text-white/20 text-2xl" />
          </motion.div>
        </div>
      </section>

      {/* About Section - Использование пунктирных границ из CSS */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold uppercase mb-8" style={{ color: colors.text }}>
                Виробничі потужності
              </h2>
              <div className="p-6 bg-white border border-dashed rounded" style={{ borderColor: colors.border }}>
                <div className="flex items-start gap-4">
                  <FontAwesomeIcon icon={faIndustry} className="mt-1" style={{ color: colors.info }} />
                  <p className="text-sm">Завод площею 16 000 м² розташований у с. Великий Кучурів (5 км від Чернівців).</p>
                </div>
              </div>
              <div className="p-6 bg-white border border-dashed rounded" style={{ borderColor: colors.border }}>
                <div className="flex items-start gap-4">
                  <FontAwesomeIcon icon={faGlobe} className="mt-1" style={{ color: colors.success }} />
                  <p className="text-sm">Експортна географія: Німеччина, Італія, Румунія, Канада та США.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 border border-dashed shadow-sm" style={{ borderColor: colors.border }}>
               <h3 className="text-lg font-bold uppercase mb-6" style={{ color: colors.info }}>Технологічний цикл</h3>
               <div className="space-y-6">
                  {[
                    { label: "ПВХ Вікна", val: "35 000 / міс", icon: faWindowRestore },
                    { label: "ПВХ Двері", val: "9 000 / міс", icon: faIndustry },
                    { label: "Інновації", val: "Full Cycle", icon: faMicrochip }
                  ].map((it, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-dashed pb-2" style={{ borderColor: colors.border }}>
                      <span className="text-sm uppercase"><FontAwesomeIcon icon={it.icon} className="mr-3 opacity-50"/> {it.label}</span>
                      <span className="font-bold" style={{ color: colors.success }}>{it.val}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values - Иконки FA */}
      <section className="py-24 bg-white border-t border-b border-dashed" style={{ borderColor: colors.border }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full border border-dashed transition-colors group-hover:bg-gray-50" style={{ borderColor: colors.border }}>
                  <FontAwesomeIcon icon={v.icon} className="text-2xl" style={{ color: v.color }} />
                </div>
                <h3 className="font-bold uppercase text-sm mb-2">{v.title}</h3>
                <p className="text-xs text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     {/* Media Section */}
      <section className="py-24 bg-[#e9ebee]">
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-2xl font-bold uppercase">Медіа-огляд</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => scrollByManual(-320)} 
                className="p-3 bg-white border border-dashed border-[#95959563] hover:text-[#5e83bf] transition-all"
              >
                <FontAwesomeIcon icon={faChevronLeft}/>
              </button>
              <button 
                onClick={() => scrollByManual(320)} 
                className="p-3 bg-white border border-dashed border-[#95959563] hover:text-[#5e83bf] transition-all"
              >
                <FontAwesomeIcon icon={faChevronRight}/>
              </button>
            </div>
          </div>

          <div 
            ref={containerRef}
            className="flex space-x-6 overflow-x-auto scrollbar-hide py-4 snap-x"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {videos.map((url, index) => {
              const videoId = url.split("/video/")[1]?.split("?")[0];
              return (
                <div key={index} className="flex-shrink-0 bg-black rounded shadow-lg overflow-hidden border border-white/10 snap-center">
                  <iframe
                    src={`https://www.tiktok.com/embed/${videoId}`}
                    width="280"
                    height="500"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA - В стиле Footer из вашего CSS */}
      <section className="py-20 bg-[#2d2826] text-white text-center border-t-4" style={{ borderColor: colors.success }}>
        <div className="max-w-3xl mx-auto px-4">
          <FontAwesomeIcon icon={faHandshake} className="text-5xl mb-8 opacity-20" />
          <h2 className="text-3xl font-bold uppercase mb-6 leading-tight">
            Двері, які відкривають світ успішного партнерства
          </h2>
          <p className="text-gray-400 mb-10 font-light">
            Станьте частиною надійної дилерської мережі "Вікна Стиль". 18 років досвіду та європейські стандарти якості для вашого бізнесу.
          </p>
          <button 
            className="uppercase tracking-widest px-10 py-4 font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: colors.success }}
          >
            Стати партнером
          </button>
        </div>
      </section>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        iframe { filter: grayscale(0.2) contrast(1.1); }
      `}</style>
    </div>
  );
}