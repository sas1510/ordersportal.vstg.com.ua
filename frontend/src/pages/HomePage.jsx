import React, { useRef } from "react";
import "./HomePage.css";
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
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const scrollByManual = (offset) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  const stats = [
    { value: "18+", label: "Років досвіду", icon: faAward, className: "text-info" },
    { value: "500+", label: "Працівників", icon: faUsers, className: "text-success" },
    { value: "16,000м²", label: "Площа заводу", icon: faIndustry, className: "text-main" },
    { value: "35,000", label: "Вікон на місяць", icon: faWindowRestore, className: "text-info" },
  ];

  const values = [
    { icon: faPalette, title: "Естетика", desc: "Сучасний дизайн", colorClass: "text-info" },
    { icon: faCheckDouble, title: "Якість", desc: "Європейські стандарти", colorClass: "text-success" },
    { icon: faTags, title: "Найкраща ціна", desc: "Власне виробництво", colorClass: "text-danger" },
    { icon: faShieldHalved, title: "Безпека", desc: "Надійний захист", colorClass: "text-info" },
  ];

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div style={{ opacity }} className="hero-overlay">
          <div className="hero-gradient"></div>
        </motion.div>

        <div className="hero-content">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <h1 className="hero-title">Вікна Стиль</h1>
            <div className="hero-divider"></div>
            <p className="hero-subtitle">ПРОФЕСІЙНІ ВІКОННІ СИСТЕМИ ДЛЯ ЄВРОПЕЙСЬКОГО РИНКУ</p>
          </motion.div>

          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <motion.div key={idx} className="stat-card">
                <FontAwesomeIcon icon={stat.icon} className="stat-icon" />
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="scroll-indicator">
            <FontAwesomeIcon icon={faChevronDown} />
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-4">
            <h2 className="section-title">Виробничі потужності</h2>
            <div className="info-box border-info">
              <div className="flex items-start gap-4">
                <FontAwesomeIcon icon={faIndustry} className="text-info mt-1" />
                <p className="text-sm">Завод площею 16 000 м² розташований у с. Великий Кучурів (5 км від Чернівців).</p>
              </div>
            </div>
            <div className="info-box border-success">
              <div className="flex items-start gap-4">
                <FontAwesomeIcon icon={faGlobe} className="text-success mt-1" />
                <p className="text-sm">Експортна географія: Німеччина, Італія, Румунія, Канада та США.</p>
              </div>
            </div>
          </div>

          <div className="tech-cycle-card">
            <h3 className="tech-title">Технологічний цикл</h3>
            <div className="space-y-6">
              {[
                { label: "ПВХ Вікна", val: "35 000 / міс", icon: faWindowRestore },
                { label: "ПВХ Двері", val: "9 000 / міс", icon: faIndustry },
                { label: "Інновації", val: "Full Cycle", icon: faMicrochip }
              ].map((it, i) => (
                <div key={i} className="tech-item">
                  <span className="tech-label">
                    <FontAwesomeIcon icon={it.icon} className="mr-3 opacity-50" /> {it.label}
                  </span>
                  <span className="tech-value">{it.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          {values.map((v, i) => (
            <div key={i} className="value-card group">
              <div className="value-icon-container">
                <FontAwesomeIcon icon={v.icon} className={`text-2xl ${v.colorClass}`} />
              </div>
              <h3 className="value-title">{v.title}</h3>
              <p className="value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Media Section */}
      <section className="media-section">
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="media-header">
            <h2 className="section-title mb-0">Медіа-огляд</h2>
            <div className="flex gap-2">
              <button onClick={() => scrollByManual(-320)} className="nav-btn">
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button onClick={() => scrollByManual(320)} className="nav-btn">
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>

          <div ref={containerRef} className="media-slider scrollbar-hide">
            {videos.map((url, index) => {
              const videoId = url.split("/video/")[1]?.split("?")[0];
              return (
                <div key={index} className="video-card">
                  <iframe
                    src={`https://www.tiktok.com/embed/${videoId}`}
                    className="tiktok-iframe"
                    title={`tiktok-video-${index}`}
                  ></iframe>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="max-w-3xl mx-auto px-4">
          <FontAwesomeIcon icon={faHandshake} className="cta-icon" />
          <h2 className="cta-title">Двері, які відкривають світ успішного партнерства</h2>
          <p className="cta-desc">
            Станьте частиною надійної дилерської мережі "Вікна Стиль". 18 років досвіду та європейські стандарти якості для вашого бізнесу.
          </p>
          <button className="cta-button">Стати партнером</button>
        </div>
      </section>
    </div>
  );
}