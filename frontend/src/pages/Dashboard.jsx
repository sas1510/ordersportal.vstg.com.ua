// // import React from "react";

// // export default function Dashboard() {
// //   return (
// //     <div className="min-h-screen bg-white text-gray-800 font-sans">
// //       {/* Hero Section */}
// //       <section className="relative min-h-[900px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/3.jpg')" }}>
// //         <div className="absolute inset-0 bg-[#003d66]/60 flex items-center justify-center">
// //           <h1 className="text-white text-4xl md:text-6xl font-bold text-center px-4">
// //             Вікна Стиль — 18 років на ринку України та Європи
// //           </h1>
// //         </div>
// //       </section>

// //       {/* Про компанію */}
// //       <section className="max-w-6xl mx-auto px-4 py-16">
// //         <h2 className="text-3xl font-bold text-[#003d66] mb-6">Про компанію</h2>
// //         <p className="mb-4">
// //           Наша компанія знаходиться в 5 км від міста Чернівці, в селі Великий Кучурів.
// //           Площа заводу — понад <strong>16 000 м²</strong>. На виробництві працює понад <strong>500 працівників</strong>.
// //         </p>
// //         <p className="mb-4">
// //           Компанія «Вікна Стиль» успішно працює з 2003 року. Це історія успіху, заснована на бажанні бути кращими,
// //           без компромісів щодо якості.
// //         </p>
// //         <p className="mb-4">
// //           Ми використовуємо унікальне програмне забезпечення, що дозволяє контролювати всі етапи виробництва
// //           та відвантаження. Географія продажів охоплює весь захід України, а також Румунію, Німеччину, Італію, Португалію, Канаду, США.
// //         </p>
// //       </section>

// //       {/* Потужності */}
// //       <section className="bg-gray-100 py-12">
// //         <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
// //           <div>
// //             <h3 className="text-2xl font-semibold text-[#003d66]">Виробнича площа</h3>
// //             <p className="text-xl mt-2">5500 м²</p>
// //           </div>
// //           <div>
// //             <h3 className="text-2xl font-semibold text-[#003d66]">ПВХ Вікон</h3>
// //             <p className="text-xl mt-2">35 000 на місяць</p>
// //           </div>
// //           <div>
// //             <h3 className="text-2xl font-semibold text-[#003d66]">ПВХ Дверей</h3>
// //             <p className="text-xl mt-2">9 000 на місяць</p>
// //           </div>
// //         </div>
// //       </section>

// //       {/* Цінності */}
// //       <section className="max-w-6xl mx-auto px-4 py-16">
// //         <h2 className="text-3xl font-bold text-[#003d66] mb-6">Наші цінності</h2>
// //         <div className="grid md:grid-cols-4 gap-6 text-center">
// //           <div>
// //             <div className="text-5xl mb-2">🎨</div>
// //             <p className="font-semibold">Естетика</p>
// //           </div>
// //           <div>
// //             <div className="text-5xl mb-2">✅</div>
// //             <p className="font-semibold">Якість</p>
// //           </div>
// //           <div>
// //             <div className="text-5xl mb-2">💰</div>
// //             <p className="font-semibold">Найкраща ціна</p>
// //           </div>
// //           <div>
// //             <div className="text-5xl mb-2">🏠</div>
// //             <p className="font-semibold">Безпека вашого дому</p>
// //           </div>
// //         </div>
// //       </section>

// //       {/* Завершення */}
// //       <section className="bg-[#f0f4f8] py-12 text-center">
// //         <div className="max-w-4xl mx-auto px-4">
// //           <h2 className="text-2xl md:text-3xl font-bold text-[#003d66] mb-4">
// //             ДВЕРІ, ЯКІ ВІДКРИВАЮТЬ СВІТ УСПІШНОГО ПАРТНЕРСТВА
// //           </h2>
// //           <p className="text-gray-700 text-lg">
// //             “Вікна Стиль” — це не просто бізнес. Це команда, сервіс, стабільність і партнерство.
// //             Надійність нашої продукції — запорука Вашого комфорту і довіри клієнтів.
// //           </p>
// //         </div>
// //       </section>
// //     </div>
// //   );
// // }
// // import React, { useRef, useEffect, useState } from "react";
// // import { motion } from "framer-motion";

// // import './Dashboard.css'

// // const videos = [
// //   "https://www.tiktok.com/@viknastyle/video/7537601329863200005?is_from_webapp=1",
// //   "https://www.tiktok.com/@viknastyle/video/7537322053884497208?is_from_webapp=1",
// //   "https://www.tiktok.com/@viknastyle/video/7536228535598386488?is_from_webapp=1",
// // ];

// // export default function HomePage() {
// //   const containerRef = useRef(null);
// //   const [isPaused, setIsPaused] = useState(false); // стан для паузи

// //   // Автопрокрутка каруселі
// //   useEffect(() => {
// //     const container = containerRef.current;
// //     if (!container) return;

// //     const scrollSpeed = 1.5;
// //     let requestId;

// //     const scroll = () => {
// //       if (!isPaused) {
// //         container.scrollLeft += scrollSpeed;
// //         if (container.scrollLeft >= container.scrollWidth / 2) {
// //           container.scrollLeft = 0;
// //         }
// //       }
// //       requestId = requestAnimationFrame(scroll);
// //     };

// //     requestId = requestAnimationFrame(scroll);

// //     return () => cancelAnimationFrame(requestId);
// //   }, [isPaused]);

// //   // Кнопки прокрутки
// //   const scrollLeft = () => {
// //     setIsPaused(true);
// //     containerRef.current.scrollBy({ left: -320, behavior: "smooth" });
// //     setTimeout(() => setIsPaused(false), 500);
// //   };

// //   const scrollRight = () => {
// //     setIsPaused(true);
// //     containerRef.current.scrollBy({ left: 320, behavior: "smooth" });
// //     setTimeout(() => setIsPaused(false), 500);
// //   };

// //   const loopVideos = [...videos, ...videos]; // безшовний цикл

// //   return (
// //     <div className="min-h-screen bg-white text-gray-800 font-sans">
// //       {/* Hero Section */}
// //       {/* <section
// //         className="relative min-h-[900px] bg-cover bg-center bg-no-repeat"
// //         style={{ backgroundImage: "url('/3.jpg')" }}
// //       >
// //         <div className="absolute inset-0 bg-[#003d66]/60 flex items-center justify-center">
// //           <motion.h1
// //             initial={{ y: -50, opacity: 0 }}
// //             animate={{ y: 0, opacity: 1 }}
// //             transition={{ duration: 1 }}
// //             className="text-white text-4xl md:text-6xl font-bold text-center px-4"
// //           >
// //             Вікна Стиль — 18 років на ринку України та Європи
// //           </motion.h1>
// //         </div>
// //       </section> */}

// //        <section className="dashboard-hero">
// //         <div className="dashboard-hero-overlay" />

// //         <div className="dashboard-hero-content">
// //           <h1 className="font-size-42 text-white text-bold text-center">
// //             Вікна Стиль — 18 років на ринку України та Європи
// //           </h1>
// // {/*
// //           <div className="glass-badge">
// //             <span className="badge-icon">🏭</span>
// //             <span className="badge-text">
// //               Власне виробництво • Європейські стандарти • Надійне партнерство
// //             </span>
// //           </div> */}
// //         </div>
// //       </section>

// //       {/* Про компанію */}
// //       <section className="max-w-6xl mx-auto px-4 py-16">
// //         <motion.h2
// //           initial={{ opacity: 0 }}
// //           whileInView={{ opacity: 1 }}
// //           viewport={{ once: true }}
// //           className="text-3xl font-bold text-[#003d66] mb-6"
// //         >
// //           Про компанію
// //         </motion.h2>
// //         <motion.p
// //           initial={{ x: -50, opacity: 0 }}
// //           whileInView={{ x: 0, opacity: 1 }}
// //           viewport={{ once: true }}
// //           className="mb-4"
// //         >
// //           Наша компанія знаходиться в 5 км від міста Чернівці, в селі Великий Кучурів.
// //           Площа заводу — понад <strong>16 000 м²</strong>. На виробництві працює понад <strong>500 працівників</strong>.
// //         </motion.p>
// //         <motion.p
// //           initial={{ x: 50, opacity: 0 }}
// //           whileInView={{ x: 0, opacity: 1 }}
// //           viewport={{ once: true }}
// //           className="mb-4"
// //         >
// //           Компанія «Вікна Стиль» успішно працює з 2003 року. Це історія успіху, заснована на бажанні бути кращими,
// //           без компромісів щодо якості.
// //         </motion.p>
// //         <motion.p
// //           initial={{ y: 50, opacity: 0 }}
// //           whileInView={{ y: 0, opacity: 1 }}
// //           viewport={{ once: true }}
// //           className="mb-4"
// //         >
// //           Ми використовуємо унікальне програмне забезпечення, що дозволяє контролювати всі етапи виробництва
// //           та відвантаження. Географія продажів охоплює весь захід України, а також Румунію, Німеччину, Італію, Португалію, Канаду, США.
// //         </motion.p>
// //       </section>

// //       {/* TikTok Carousel */}
// //       <section className="max-w-6xl mx-auto px-4 py-12 relative">
// //         <h2 className="text-3xl font-bold text-[#003d66] mb-6">Наші відео</h2>

// //         <button
// //           onClick={scrollLeft}
// //           className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow hover:bg-gray-100 z-10"
// //         >
// //           ◀
// //         </button>
// //         <button
// //           onClick={scrollRight}
// //           className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow hover:bg-gray-100 z-10"
// //         >
// //           ▶
// //         </button>

// //         <div
// //           ref={containerRef}
// //           className="flex space-x-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 py-4"
// //           onMouseEnter={() => setIsPaused(true)}   // пауза при hover
// //           onMouseLeave={() => setIsPaused(false)}  // відновлення прокрутки
// //         >
// //           {loopVideos.map((url, index) => {
// //             const videoId = url.split("/video/")[1].split("?")[0];
// //             return (
// //               <motion.iframe
// //                 key={index}
// //                 src={`https://www.tiktok.com/embed/${videoId}`}
// //                 width="300"
// //                 height="533"
// //                 frameBorder="0"
// //                 allowFullScreen
// //                 className="rounded-md shadow-lg flex-shrink-0 hover:scale-105 transition-transform duration-300"
// //                 whileHover={{ scale: 1.05 }}
// //                 onClick={() => setIsPaused(true)} // зупинка прокрутки при кліку
// //                 onBlur={() => setIsPaused(false)}  // продовження після того, як відео "втратило фокус"
// //               ></motion.iframe>

// //             );
// //           })}
// //         </div>
// //       </section>

// //       {/* Потужності */}
// //       <section className="bg-gray-100 py-12">
// //         <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
// //           {[
// //             { title: "Виробнича площа", value: "5500 м²" },
// //             { title: "ПВХ Вікон", value: "35 000 на місяць" },
// //             { title: "ПВХ Дверей", value: "9 000 на місяць" },
// //           ].map((item, idx) => (
// //             <motion.div
// //               key={idx}
// //               className="p-6 bg-white rounded-lg shadow hover:shadow-xl transition-shadow"
// //               whileHover={{ y: -5 }}
// //             >
// //               <h3 className="text-2xl font-semibold text-[#003d66]">{item.title}</h3>
// //               <p className="text-xl mt-2">{item.value}</p>
// //             </motion.div>
// //           ))}
// //         </div>
// //       </section>

// //       {/* Цінності */}
// //       <section className="max-w-6xl mx-auto px-4 py-16">
// //         <h2 className="text-3xl font-bold text-[#003d66] mb-6">Наші цінності</h2>
// //         <div className="grid md:grid-cols-4 gap-6  text-center">
// //           {[
// //             { emoji: "🎨", title: "Естетика" },
// //             { emoji: "✅", title: "Якість" },
// //             { emoji: "💰", title: "Найкраща ціна" },
// //             { emoji: "🏠", title: "Безпека вашого дому" },
// //           ].map((item, idx) => (
// //             <motion.div
// //               key={idx}
// //               className="p-6 bg-gray-100  rounded-lg shadow hover:shadow-2xl transition-shadow"
// //               whileHover={{ y: -5 }}
// //             >
// //               <div className="text-5xl mb-2">{item.emoji}</div>
// //               <p className="font-semibold">{item.title}</p>
// //             </motion.div>
// //           ))}
// //         </div>
// //       </section>

// //       {/* Завершення */}
// //       <section className="bg-[#f0f4f8] py-12 text-center">
// //         <div className="max-w-4xl mx-auto px-4">
// //           <motion.h2
// //             initial={{ opacity: 0, y: 20 }}
// //             whileInView={{ opacity: 1, y: 0 }}
// //             viewport={{ once: true }}
// //             className="text-2xl md:text-3xl font-bold text-[#003d66] mb-4"
// //           >
// //             ДВЕРІ, ЯКІ ВІДКРИВАЮТЬ СВІТ УСПІШНОГО ПАРТНЕРСТВА
// //           </motion.h2>
// //           <motion.p
// //             initial={{ opacity: 0 }}
// //             whileInView={{ opacity: 1 }}
// //             viewport={{ once: true }}
// //             className="text-gray-700 text-lg"
// //           >
// //             “Вікна Стиль” — це не просто бізнес. Це команда, сервіс, стабільність і партнерство.
// //             Надійність нашої продукції — запорука Вашого комфорту і довіри клієнтів.
// //           </motion.p>
// //         </div>
// //       </section>
// //     </div>
// //   );
// // }
// import React, { useRef } from "react";
// import "./HomePage.css";

// import { motion , useScroll, useTransform } from "framer-motion";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faAward,
//   faUsers,
//   faIndustry,
//   faWindowRestore,
//   faGlobe,
//   faMicrochip,
//   faPalette,
//   faShieldHalved,
//   faHandshake,
//   faCheckDouble,
//   faTags,
//   faChevronDown,
//   faChevronLeft,
//   faChevronRight,
// } from "@fortawesome/free-solid-svg-icons";


// const statsData = [
//   { 
//     id: 1, 
//     image: "/assets/icons/award-icon.png",
//     value: "18+", 
//     label: "років досвіду", 
//     isJSX: false 
//   },
//   { 
//     id: 2, 
//     image: "/assets/icons/people-icon.png", 
//     value: "500+", 
//     label: "працівників", 
//     isJSX: false 
//   },
//   { 
//     id: 3, 
//     image: "/assets/icons/factory-icon.png", 
//     value: "16 000 м²", 
//     label: "площа заводу", 
//     isJSX: true 
//   },
//   { 
//     id: 4, 
//     image: "/assets/icons/window-icon.png", 
//     value: "35 000", 
//     label: "вікон на місяць", 
//     isJSX: false 
//   },
// ];








// const videos = [
//   "https://www.tiktok.com/@viknastyle/video/7624534122479947028?embed_source=121374463%2C121468991%2C121439635%2C121749182%2C121433650%2C121404359%2C121497414%2C122221973%2C122122240%2C121351166%2C121811500%2C121960941%2C122122244%2C122122243%2C122122242%2C121487028%2C122258714%2C121331973%2C120811592%2C120810756%2C121885509%3Bnull%3Bembed_head&refer=embed&referer_url=172.17.19.107%2F&referer_video_id=7536228535598386488",
//   "https://www.tiktok.com/@viknastyle/video/7623016569790024981",
//   "https://www.tiktok.com/@viknastyle/video/7536228535598386488",
//   "https://www.tiktok.com/@viknastyle/video/7621226321510681877",
//   "https://www.tiktok.com/@viknastyle/video/7618147133090286869",
// ];

// export default function Dashboard() {
//   const containerRef = useRef(null);
//   const { scrollYProgress } = useScroll();
//   const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
//   const bellIcon = "/assets/icons/bell-icon.png"; 
//   const Polygon = "/assets/icons/Polygon.png";

  
//   const cicleIcon = "/assets/icons/CicleIcon.png";
//   const doorIcon = "/assets/icons/DoorIcon.png";
//   const exportIcon = "/assets/icons/ExportIcon.png";
//   const plantIcon = "/assets/icons/PlantIcon.png";
//   const windowIcon = "/assets/icons/WindowIcon.png";
//   const handshake = "/assets/icons/Handshake.png";

//     const statCards = [
//     {
//       id: "window",
//       bgLeft: "left-[427px]",
//       icon: windowIcon,
//       iconClass: "absolute top-[274px] left-[542px] w-[50px] h-[50px] aspect-[1] object-cover z-10",
//       iconAlt: "Window icon",
//       value: "35 000",
//       valueClass: "left-[427px] absolute top-[337px] w-[279px] font-['Inter'] font-black text-[#44403E] text-[40px] text-center tracking-[0] leading-normal z-10",
//       label: "ПВХ вікон на місяць",
//       labelClass: "top-[390px] left-[427px] w-[279px] font-['Inter'] font-normal text-[22px] text-center absolute text-[#44403E] tracking-[0] leading-normal z-10",
//       bgClass: "absolute top-[247px] left-[427px] w-[279px] h-[180px] bg-white rounded-sm shadow-sm",
//     },
//     {
//       id: "door",
//       bgLeft: "left-[734px]",
//       icon: doorIcon,
//       iconClass: "absolute top-[274px] left-[862px] w-[24px] h-[50px] aspect-[0.47] object-cover z-10",
//       iconAlt: "Door icon",
//       value: "9 000",
//       valueClass: "left-[734px] absolute top-[337px] w-[279px] font-['Inter'] font-black text-[#44403E] text-[40px] text-center tracking-[0] leading-normal z-10",
//       label: "ПВХ дверей на місяць",
//       labelClass: "top-[390px] left-[734px] w-[279px] font-['Inter'] font-normal text-[22px] text-center absolute text-[#44403E] tracking-[0] leading-normal z-10",
//       bgClass: "absolute top-[247px] left-[734px] w-[279px] h-[180px] bg-white rounded-sm shadow-sm",
//     },
//     {
//       id: "cycle",
//       bgLeft: "left-[1041px]",
//       icon: cicleIcon,
//       iconClass: "absolute top-[274px] left-[1156px] w-[49px] h-[50px] aspect-[0.97] object-cover z-10",
//       iconAlt: "Cicle icon",
//       value: "Full Cycle",
//       valueClass: "absolute top-[337px] left-[1041px] w-[279px] font-['Inter'] font-black text-[#44403E] text-[40px] text-center tracking-[0] leading-normal z-10",
//       label: "Інновації",
//       labelClass: "top-[390px] left-[1041px] w-[279px] font-['Inter'] font-normal text-[22px] text-center absolute text-[#44403E] tracking-[0] leading-normal z-10",
//       bgClass: "absolute top-[247px] left-[1041px] w-[279px] h-[180px] bg-white rounded-sm shadow-sm",
//     },
//   ];

//   const infoItems = [
//   {
//     icon: plantIcon,
//     iconAlt: "Plant icon",
//     iconClass: "absolute top-[150px] left-[202px] w-[49px] h-[50px] aspect-[0.99] object-cover",
//     textClass: "top-[152px] left-[269px] w-[478px] font-['Inter'] font-normal text-xl absolute text-[#44403E] tracking-[0] leading-tight",
//     text: (
//       <>
//         Завод площею 16 000 м² розташований <br />у с. Великий Кучурів (5 км від Чернівців).
//       </>
//     ),
//   },
//   {
//     icon: exportIcon,
//     iconAlt: "Export icon",
//     iconClass: "absolute top-[151px] left-[765px] w-[50px] h-[50px] aspect-[1] object-cover",
//     textClass: "top-[152px] left-[844px] w-[367px] font-['Inter'] font-normal text-xl absolute text-[#44403E] tracking-[0] leading-tight",
//     text: "Експортна географія: Німеччина, Італія, Румунія, Канада та США.",
//   },
// ];


//   const scrollByManual = (offset) => {
//     const el = containerRef.current;
//     if (!el) return;
//     el.scrollBy({ left: offset, behavior: "smooth" });
//   };

//   const stats = [
//     {
//       value: "18+",
//       label: "Років досвіду",
//       icon: faAward,
//       className: "text-info",
//     },
//     {
//       value: "500+",
//       label: "Працівників",
//       icon: faUsers,
//       className: "text-success",
//     },
//     {
//       value: "16,000м²",
//       label: "Площа заводу",
//       icon: faIndustry,
//       className: "text-main",
//     },
//     {
//       value: "35,000",
//       label: "Вікон на місяць",
//       icon: faWindowRestore,
//       className: "text-info",
//     },
//   ];

//   const values = [
//     {
//       icon: faPalette,
//       title: "Естетика",
//       desc: "Сучасний дизайн",
//       colorClass: "text-info",
//     },
//     {
//       icon: faCheckDouble,
//       title: "Якість",
//       desc: "Європейські стандарти",
//       colorClass: "text-success",
//     },
//     {
//       icon: faTags,
//       title: "Найкраща ціна",
//       desc: "Власне виробництво",
//       colorClass: "text-danger",
//     },
//     {
//       icon: faShieldHalved,
//       title: "Безпека",
//       desc: "Надійний захист",
//       colorClass: "text-info",
//     },
//   ];


//   const aesteticIcon = "/assets/icons/AesteticIcon.png";
//   const costIcon = "/assets/icons/CostIcon.png";
//   const qualityIcon = "/assets/icons/QualityIcon.png";
//   const safetyIcon = "/assets/icons/SafetyIcon.png";

//   const features = [
//     {
//       id: 1,
//       icon: aesteticIcon,
//       iconAlt: "Aestetic icon",
//       iconClass: "absolute top-4 left-[93px] w-[93px] h-[80px]  object-contain",
//       title: "ЕСТЕТИКА",
//       titleLeft: "left-0",
//       description: "Сучасний дизайн",
//       descLeft: "left-0",
//     },
//     {
//       id: 2,
//       icon: qualityIcon,
//       iconAlt: "Quality icon",
//       iconClass: "absolute top-0 left-[404px] w-[85px] h-[100px] object-contain",
//       title: "ЯКІСТЬ",
//       titleLeft: "left-[307px]",
//       description: "Європейські стандарти",
//       descLeft: "left-[307px]",
//     },
//     {
//       id: 3,
//       icon: costIcon,
//       iconAlt: "Cost icon",
//       iconClass: "absolute top-2.5 left-[709px] w-[90px] h-[80px] object-contain",
//       title: "НАЙКРАЩА ЦІНА",
//       titleLeft: "left-[614px]",
//       description: "Власне виробництво",
//       descLeft: "left-[614px]",
//     },
//     {
//       id: 4,
//       icon: safetyIcon,
//       iconAlt: "Safety icon",
//       iconClass: "absolute top-0 left-[1019px] w-[86px] h-[100px] object-contain",
//       title: "БЕЗПЕКА",
//       titleLeft: "left-[922px]",
//       description: "Надійний захист",
//       descLeft: "left-[922px]",
//     },
//   ];

//   const fadeUp = {
//       hidden: { 
//         opacity: 0, 
//         y: 50 
//       },
//       visible: (idx) => ({
//         opacity: 1,
//         y: 0,
//         transition: {
//           duration: 1.2, // Тривалість анімації (було 0.6-0.8)
//           delay: idx * 0.3, // Затримка між кожною карткою (0.3 сек)
//           ease: [0.25, 0.1, 0.25, 1], // Плавний "cubic-bezier" вихід
//         },
//       }),
//     };

//   return (
//     <div className="homepage-container">
//       {/* Hero Section */}
//       <section className="hero-section">
//       {/* 1. ФОНОВЕ ВІДЕО */}
//       <video
//         autoPlay
//         loop
//         muted
//         playsInline
//         className="hero-video-bg"
//         poster="/assets/video/hero-poster.jpg"
//       >
//         <source src="/assets/video/hero-background-1.mp4" type="video/mp4" />
//       </video>

//       {/* 2. ОВЕРЛЕЙ */}
//       <motion.div style={{ opacity }} className="hero-overlay">
//         <div className="hero-gradient"></div>
//       </motion.div>

//       {/* 3. КОНТЕНТ */}
//       <div className="hero-content">
//         <motion.div
//           initial={{ y: 30, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.8 }}
//           className="hero-text-block"
//         >
//           <div className="hero-welcome">Вітаємо на порталі замовлень</div>
//           <h1 className="font-['Inter'] font-[1000] text-[40px] leading-[100%] tracking-normal text-center w-full max-w-[627px] mx-auto text-white">
//             Професійні Віконні Системи <br />
//             для Європейського Ринку
//           </h1>
//           <div className="hero-divider"></div>
//         </motion.div>

//         {/* СІТКА СТАТИСТИКИ */}
//         <div className="stats-grid">
//           {statsData.map((stat, idx) => (
//              <motion.div 
//               key={stat.id}
//               className="stat-card"
//               variants={fadeUp}
//               initial="hidden"
//               whileInView="visible"
//               viewport={{ once: true }}
//               custom={idx}
//             >
//               {/* Ваша картинка замість іконки */}
//               <div className="stat-image-wrapper">
//                 <img src={stat.image} alt={stat.label} className="stat-custom-img" />
//               </div>
              
//               <div className="stat-value">
//                 {stat.isJSX ? (
//                   <span>
//                     16 000 <small className="text-[20px]">м²</small>
//                   </span>
//                 ) : (
//                   stat.value
//                 )}
//               </div>
//               <div className="stat-label">{stat.label}</div>
//             </motion.div>
//           ))}
//         </div>

//         {/* СТРІЛКА ВНИЗ */}
//         <motion.div
//           animate={{ y: [0, 10, 0] }}
//           transition={{ repeat: Infinity, duration: 2 }}
//           /* Додаємо класи для центрування: 
//             flex (робимо флекс-контейнером)
//             justify-center (горизонтально по центру)
//             w-full (на всю ширину, щоб було від чого центрувати)
//           */
//           className="scroll-indicator flex justify-center w-full mb-15 "
//         >
//           <img 
//             src={Polygon} 
//             alt="Стрілка" 
//             className="w-[55px] h-[27px] object-contain" 
//             /* inline-style тут вже не потрібні, якщо є класи зверху */
//           />
//         </motion.div>
//       </div>
//     </section>

//     <section className="relative w-full flex justify-center bg-[#F0F4DB] overflow-hidden">
    
//       <div className="relative w-[1440px] h-[514px] flex-shrink-0">

//         <div className="top-[68px] left-[427px] w-[586px] font-['Inter'] font-[900]  text-[32px] text-center text-variable-collection-WS-darkgrey whitespace-nowrap absolute text-[#44403E] tracking-[0] leading-normal" 
//            style={{ WebkitTextStroke: '1px #44403E' }}>
//           Виробничі Потужності
//         </div>



//         <div className="top-[299px] left-[120px] w-[279px] font-['Inter'] font-black text-[32px] text-center absolute text-[#44403E] tracking-[0] leading-tight" 
//            style={{ WebkitTextStroke: '1px #44403E' }}>
//           Технологічний <br /> Цикл
//         </div>

//         {/* Картки статистики */}
//         {statCards.map((card, index) => (
//   <motion.div
//     key={card.id}
//     variants={fadeUp}
//     initial="hidden"
//     whileInView="visible"
//     viewport={{ once: true }}
//     custom={index}
//   >
//     <div className={card.bgClass} />
//     <img
//       className={card.iconClass}
//       alt={card.iconAlt}
//       src={card.icon}
//     />
//     <div className={card.valueClass}>{card.value}</div>
//     <div className={card.labelClass}>{card.label}</div>
//   </motion.div>
// ))}

//         {/* Інформаційні блоки (Завод та Географія) */}
//        {infoItems.map((item, index) => (
//         <motion.div
//           key={item.iconAlt}
//           variants={fadeUp}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true }}
//           custom={index}
//         >
//           <img
//             className={item.iconClass}
//             alt={item.iconAlt}
//             src={item.icon}
//           />
//           <p className={item.textClass}>{item.text}</p>
//         </motion.div>
//       ))}
//       </div>
//     </section>

//       {/* Values Section */}
//       <section className="w-full py-20 flex justify-center bg-white">
//   {/* Центруючий контейнер згідно з макетом */}
//   <div className="relative max-w-[1201px] w-full h-[198px] flex-shrink-0">

//     {features.map((feature, index) => (
//       <motion.div
//         key={feature.id}
//         variants={fadeUp}
//         initial="hidden"
//         whileInView="visible"
//         viewport={{ once: true }}
//         custom={index}
//       >
//         {/* Іконка */}
//         <img
//           className={`${feature.iconClass} 
//           max-md:scale-75 
//           max-sm:scale-65`}
//           alt={feature.iconAlt}
//           src={feature.icon}
//         />

//         {/* Заголовок */}
//         <div
//           className={`
//             absolute 
//             top-[131px] 
//             ${feature.titleLeft} 
//             w-[279px] 
//             font-['Inter'] 
//             font-[900] 
//             text-3xl 
//             max-md:text-xl 
//             max-sm:text-lg
//             text-[#44403E] 
//             text-center 
//             uppercase 
//             tracking-tight
//           `}
//         >
//           {feature.title}
//         </div>

//         {/* Опис */}
//         <div
//           className={`
//             absolute 
//             top-[171px] 
//             ${feature.descLeft} 
//             w-[279px] 
//             font-['Inter'] 
//             font-normal 
//             text-[22px] 
//             max-md:text-[16px]
//             max-sm:text-[14px]
//             text-[#44403E] 
//             text-center
//           `}
//         >
//           {feature.description}
//         </div>

//       </motion.div>
//     ))}

//   </div>
// </section>
//       {/* Media Section */}
//       <section className="media-section py-20 bg-[#3D3834]">
//         <div className="max-w-8xl mx-auto px-12 relative"> 
          
//           <div className="text-center mb-10">
//             <h2 className="text-3xl font-['Inter'] font-bold text-white">Медіа-Огляд</h2>
//           </div>
      
//           {/* Кнопки навігації (залишаємо вашу логіку) */}
//           {/* Кнопка вліво */}
//           <button 
//             onClick={() => scrollByManual(-340)} 
//             className="absolute left-0 top-[60%] -translate-y-1/2 z-20 p-2 transition-all hover:scale-110 active:opacity-70"
//           >
//             <img 
//               src="/assets/icons/chevron-left.png" 
//               alt="Назад" 
//               className="w-[25px] h-[54px] object-contain opacity-50 hover:opacity-100 transition-opacity" 
//             />
//           </button>

//           {/* Кнопка вправо */}
//           <button 
//             onClick={() => scrollByManual(340)} 
//             className="absolute right-0 top-[60%] -translate-y-1/2 z-20 p-2 transition-all hover:scale-110 active:opacity-70"
//           >
//             <img 
//               src="/assets/icons/chevron-right.png" 
//               alt="Вперед" 
//               className="w-[25px] h-[54px] object-contain opacity-50 hover:opacity-100 transition-opacity" 
//             />
//           </button>
      
//           {/* Слайдер з прихованим скролбаром */}
//           <div 
//             ref={containerRef} 
//             className="media-slider flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
//             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
//           >
//             {videos.map((url, index) => {
//               const videoId = url.split("/video/")[1]?.split("?")[0];
//               return (
//                 <div 
//                   key={index} 
//                   className="flex-shrink-0 w-[320px] sm:w-[335px] snap-start"
//                 >
//                   {/* Контейнер з фіксованим співвідношенням 9:16 */}
//                   <div className="aspect-[9/16] w-full  overflow-hidden ">
//                     <iframe
//                       src={`https://www.tiktok.com/embed/${videoId}`}
//                       className="w-full h-full border-0"
//                       title={`tiktok-video-${index}`}
//                       allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                       allowFullScreen
//                     ></iframe>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
      
//         {/* Додайте цей стиль у ваш глобальний CSS або через Tailwind плагін */}
//         <style jsx>{`
//           .no-scrollbar::-webkit-scrollbar {
//             display: none;
//           }
//         `}</style>
//       </section>

//       {/* CTA Section */}
//       {/* <section className="cta-section">
//         <div className="max-w-3xl mx-auto px-4">
//           <FontAwesomeIcon icon={faHandshake} className="cta-icon" />
//           <h2 className="cta-title">
//             Двері, які відкривають світ успішного партнерства
//           </h2>
//           <p className="cta-desc">
//             Станьте частиною надійної дилерської мережі "Вікна Стиль". 18 років
//             досвіду та європейські стандарти якості для вашого бізнесу.
//           </p>
          
//         </div>
//       </section> */}
//      <motion.section 
//   className="w-full pt-[60px] pb-[140px] flex justify-center bg-white"
//   style={{borderTop: '4px solid #B4D947'}}
//   initial={{ opacity: 0 }}
//   whileInView={{ opacity: 1 }}
//   viewport={{ once: true }}
//   transition={{ duration: 0.6 }}
// >
//   {/* Центруючий контейнер макета */}
//   <div className="relative max-w-[1203px] w-full h-[250px] flex flex-col items-center flex-shrink-0 px-4">
    
//     {/* Іконка рукостискання */}
//     <motion.img
//       initial={{ opacity: 0, y: 40 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true }}
//       transition={{ delay: 0.1, duration: 0.6 }}
//       className="w-[120px] h-[88px] object-cover aspect-[1.37] 
//       max-md:w-[90px] 
//       max-sm:w-[70px]"
//       alt="Партнерство"
//       src={handshake}
//     />

//     {/* Головний слоган */}
//     <motion.h2
//       initial={{ opacity: 0, y: 40 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true }}
//       transition={{ delay: 0.2, duration: 0.6 }}
//       className="mt-[23px] 
//       font-['Inter'] 
//       font-[900] 
//       text-[32px] 
//       max-md:text-[24px]
//       max-sm:text-[20px]
//       text-[#44403E] 
//       text-center 
//       uppercase 
//       tracking-tight 
//       leading-tight"
//     >
//       Двері, які відкривають світ <br />
//       успішного партнерства
//     </motion.h2>

//     {/* Опис */}
//     <motion.p
//       initial={{ opacity: 0, y: 40 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true }}
//       transition={{ delay: 0.3, duration: 0.6 }}
//       className="mt-4 
//       w-full 
//       font-['Inter'] 
//       font-normal 
//       text-[22px] 
//       max-md:text-[18px]
//       max-sm:text-[16px]
//       text-[#44403E] 
//       text-center 
//       leading-tight"
//     >
//       Станьте частиною надійної дилерської мережі "Вікна Стиль". <br />
//       18 років досвіду та європейські стандарти якості для вашого бізнесу.
//     </motion.p>

//   </div>
// </motion.section>
//     </div>
//   );
// }
import React, { useRef, useState, useEffect } from "react";
import "./HomePage.css";

import { motion , useScroll, useTransform } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAward,
  faUsers,
  faIndustry,
  faWindowRestore,
  faGlobe,
  faMicrochip,
  faPalette,
  faShieldHalved,
  faHandshake,
  faCheckDouble,
  faTags,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";


const statsData = [
  { 
    id: 1, 
    image: "/assets/icons/award-icon.png",
    value: "18+", 
    label: "років досвіду", 
    isJSX: false 
  },
  { 
    id: 2, 
    image: "/assets/icons/people-icon.png", 
    value: "500+", 
    label: "працівників", 
    isJSX: false 
  },
  { 
    id: 3, 
    image: "/assets/icons/factory-icon.png", 
    value: "16 000 м²", 
    label: "площа заводу", 
    isJSX: true 
  },
  { 
    id: 4, 
    image: "/assets/icons/window-icon.png", 
    value: "35 000", 
    label: "вікон на місяць", 
    isJSX: false 
  },
];








const videos = [
  "https://www.tiktok.com/@viknastyle/video/7624534122479947028?embed_source=121374463%2C121468991%2C121439635%2C121749182%2C121433650%2C121404359%2C121497414%2C122221973%2C122122240%2C121351166%2C121811500%2C121960941%2C122122244%2C122122243%2C122122242%2C121487028%2C122258714%2C121331973%2C120811592%2C120810756%2C121885509%3Bnull%3Bembed_head&refer=embed&referer_url=172.17.19.107%2F&referer_video_id=7536228535598386488",
  "https://www.tiktok.com/@viknastyle/video/7623016569790024981",
  "https://www.tiktok.com/@viknastyle/video/7536228535598386488",
  "https://www.tiktok.com/@viknastyle/video/7621226321510681877",
  "https://www.tiktok.com/@viknastyle/video/7618147133090286869",
];

export default function Dashboard() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const bellIcon = "/assets/icons/bell-icon.png"; 
  const Polygon = "/assets/icons/Polygon.png";

  
  const cicleIcon = "/assets/icons/CicleIcon.png";
  const doorIcon = "/assets/icons/DoorIcon.png";
  const exportIcon = "/assets/icons/ExportIcon.png";
  const plantIcon = "/assets/icons/PlantIcon.png";
  const windowIcon = "/assets/icons/WindowIcon.png";
  const handshake = "/assets/icons/Handshake.png";

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Функція для перевірки ширини екрана
    const handleResize = () => {
      setIsMobile(window.innerWidth < 850); // 768px - це стандартний поріг 'md' у Tailwind
    };

    // Викликаємо при монтуванні
    handleResize();

    // Додаємо слухача подій
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    const statCards = [
    {
      id: "window",
      bgLeft: "left-[427px]",
      icon: windowIcon,
      iconClass: "absolute top-[274px] left-[542px] w-[50px] h-[50px] aspect-[1] object-cover z-10",
      iconAlt: "Window icon",
      value: "35 000",
      valueClass: "left-[427px] absolute top-[337px] w-[279px] font-['Inter'] font-black text-[#44403E] text-[40px] text-center tracking-[0] leading-normal z-10",
      label: "ПВХ вікон на місяць",
      labelClass: "top-[390px] left-[427px] w-[279px] font-['Inter'] font-normal text-[22px] text-center absolute text-[#44403E] tracking-[0] leading-normal z-10",
      bgClass: "absolute top-[247px] left-[427px] w-[279px] h-[180px] bg-white rounded-sm shadow-sm",
    },
    {
      id: "door",
      bgLeft: "left-[734px]",
      icon: doorIcon,
      iconClass: "absolute top-[274px] left-[862px] w-[24px] h-[50px] aspect-[0.47] object-cover z-10",
      iconAlt: "Door icon",
      value: "9 000",
      valueClass: "left-[734px] absolute top-[337px] w-[279px] font-['Inter'] font-black text-[#44403E] text-[40px] text-center tracking-[0] leading-normal z-10",
      label: "ПВХ дверей на місяць",
      labelClass: "top-[390px] left-[734px] w-[279px] font-['Inter'] font-normal text-[22px] text-center absolute text-[#44403E] tracking-[0] leading-normal z-10",
      bgClass: "absolute top-[247px] left-[734px] w-[279px] h-[180px] bg-white rounded-sm shadow-sm",
    },
    {
      id: "cycle",
      bgLeft: "left-[1041px]",
      icon: cicleIcon,
      iconClass: "absolute top-[274px] left-[1156px] w-[49px] h-[50px] aspect-[0.97] object-cover z-10",
      iconAlt: "Cicle icon",
      value: "Full Cycle",
      valueClass: "absolute top-[337px] left-[1041px] w-[279px] font-['Inter'] font-black text-[#44403E] text-[40px] text-center tracking-[0] leading-normal z-10",
      label: "Інновації",
      labelClass: "top-[390px] left-[1041px] w-[279px] font-['Inter'] font-normal text-[22px] text-center absolute text-[#44403E] tracking-[0] leading-normal z-10",
      bgClass: "absolute top-[247px] left-[1041px] w-[279px] h-[180px] bg-white rounded-sm shadow-sm",
    },
  ];

  const infoItems = [
  {
    icon: plantIcon,
    iconAlt: "Plant icon",
    iconClass: "absolute top-[150px] left-[202px] w-[49px] h-[50px] aspect-[0.99] object-cover",
    textClass: "top-[152px] left-[269px] w-[478px] font-['Inter'] font-normal text-xl absolute text-[#44403E] tracking-[0] leading-tight",
    text: (
      <>
        Завод площею 16 000 м² розташований <br />у с. Великий Кучурів (5 км від Чернівців).
      </>
    ),
  },
  {
    icon: exportIcon,
    iconAlt: "Export icon",
    iconClass: "absolute top-[151px] left-[765px] w-[50px] h-[50px] aspect-[1] object-cover",
    textClass: "top-[152px] left-[844px] w-[367px] font-['Inter'] font-normal text-xl absolute text-[#44403E] tracking-[0] leading-tight",
    text: "Експортна географія: Німеччина, Італія, Румунія, Канада та США.",
  },
];


  const scrollByManual = (offset) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  const stats = [
    {
      value: "18+",
      label: "Років досвіду",
      icon: faAward,
      className: "text-info",
    },
    {
      value: "500+",
      label: "Працівників",
      icon: faUsers,
      className: "text-success",
    },
    {
      value: "16,000м²",
      label: "Площа заводу",
      icon: faIndustry,
      className: "text-main",
    },
    {
      value: "35,000",
      label: "Вікон на місяць",
      icon: faWindowRestore,
      className: "text-info",
    },
  ];

  const values = [
    {
      icon: faPalette,
      title: "Естетика",
      desc: "Сучасний дизайн",
      colorClass: "text-info",
    },
    {
      icon: faCheckDouble,
      title: "Якість",
      desc: "Європейські стандарти",
      colorClass: "text-success",
    },
    {
      icon: faTags,
      title: "Найкраща ціна",
      desc: "Власне виробництво",
      colorClass: "text-danger",
    },
    {
      icon: faShieldHalved,
      title: "Безпека",
      desc: "Надійний захист",
      colorClass: "text-info",
    },
  ];


  const aesteticIcon = "/assets/icons/AesteticIcon.png";
  const costIcon = "/assets/icons/CostIcon.png";
  const qualityIcon = "/assets/icons/QualityIcon.png";
  const safetyIcon = "/assets/icons/SafetyIcon.png";

  const features = [
  {
    id: 1,
    icon: aesteticIcon,
    iconAlt: "Aestetic icon",
    iconClass: "w-[93px] h-[80px]", 
    title: "ЕСТЕТИКА",
    mdLeft: "md:left-0",
    description: "Сучасний дизайн",
    mobileOrder: "max-md:order-1",
  },
  {
    id: 2,
    icon: qualityIcon,
    iconAlt: "Quality icon",
    iconClass: "w-[85px] h-[100px]",
    title: "ЯКІСТЬ",
    mdLeft: "md:left-[25.5%]", 
    description: "Європейські стандарти",
    mobileOrder: "max-md:order-3",
  },
  {
    id: 3,
    icon: costIcon,
    iconAlt: "Cost icon",
    iconClass: "w-[90px] h-[80px]",
    title: "НАЙКРАЩА ЦІНА",
    mdLeft: "md:left-[51.1%]", 
    description: "Власне виробництво",
    mobileOrder: "max-md:order-4",
  },
  {
    id: 4,
    icon: safetyIcon,
    iconAlt: "Safety icon",
    iconClass: "w-[86px] h-[100px]",
    title: "БЕЗПЕКА",
    mdLeft: "md:left-[76.7%]", 
    description: "Надійний захист",
    mobileOrder: "max-md:order-2",
  },
];
  const fadeUp = {
      hidden: { 
        opacity: 0, 
        y: 50 
      },
      visible: (idx) => ({
        opacity: 1,
        y: 0,
        transition: {
          duration: 1.2, // Тривалість анімації (було 0.6-0.8)
          delay: idx * 0.3, // Затримка між кожною карткою (0.3 сек)
          ease: [0.25, 0.1, 0.25, 1], // Плавний "cubic-bezier" вихід
        },
      }),
    };

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero-section">
      {/* 1. ФОНОВЕ ВІДЕО */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="hero-video-bg"
        poster="/assets/video/hero-poster.jpg" // Обов'язково додайте "заглушку"
        preload="auto"
      >
        <source src="/assets/video/hero-background-1.webm" type="video/webm" />
        <source src="/assets/video/hero-background-1.mp4" type="video/mp4" />
      </video>

      {/* 2. ОВЕРЛЕЙ */}
      <motion.div style={{ opacity }} className="hero-overlay">
        <div className="hero-gradient"></div>
      </motion.div>

      {/* 3. КОНТЕНТ */}
      <div className="hero-content">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="hero-text-block"
        >
          <div className="hero-welcome">Вітаємо на порталі замовлень</div>
          <h1 className="font-['Inter'] font-[1000] text-[24px] md:text-[40px] leading-[100%] tracking-normal text-center w-full max-w-[627px] mx-auto text-white">
            Професійні Віконні Системи <br />
            для Європейського Ринку
          </h1>
   
        </motion.div>

        {/* СІТКА СТАТИСТИКИ */}
       {/* СІТКА СТАТИСТИКИ */}
<div className="stats-grid grid grid-cols-2 md:flex md:flex-row md:justify-center gap-4 md:gap-10 px-4">
  {statsData.map((stat, idx) => (
    <motion.div 
      key={stat.id}
      className="stat-card flex flex-col items-center justify-center text-center"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={idx}
    >
      {/* Обгортка іконки */}
      <div className="stat-image-wrapper mb-2 md:mb-4">
        <img 
          src={stat.image} 
          alt={stat.label} 
          className="stat-custom-img w-[50px] h-[50px] md:w-[80px] md:h-[80px] object-contain" 
        />
      </div>
      
      {/* Значення */}
      <div className="stat-value font-black text-[24px] md:text-[40px] text-white leading-none">
        {stat.isJSX ? (
          <span className="flex items-baseline justify-center gap-1">
            16 000 <small className="text-[14px] md:text-[20px]">м²</small>
          </span>
        ) : (
          stat.value
        )}
      </div>

      {/* Підпис */}
      <div className="stat-label font-['Inter'] font-normal text-[12px] md:text-[18px] text-white opacity-90 mt-1 md:mt-2">
        {stat.label}
      </div>
    </motion.div>
  ))}
</div>

        {/* СТРІЛКА ВНИЗ */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          /* Додаємо класи для центрування: 
            flex (робимо флекс-контейнером)
            justify-center (горизонтально по центру)
            w-full (на всю ширину, щоб було від чого центрувати)
          */
          className="scroll-indicator flex justify-center w-full mb-15 "
        >
          <img 
            src={Polygon} 
            alt="Стрілка" 
            className="w-[55px] h-[27px] object-contain" 
            /* inline-style тут вже не потрібні, якщо є класи зверху */
          />
        </motion.div>
      </div>
    </section>

{isMobile ? (
      /* 1. МОБІЛЬНА ВЕРСІЯ */
      <section className="w-full bg-[#F0F4DB] py-12 px-4 overflow-hidden">
  <motion.div 
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    className="w-full flex flex-col items-center"
  >
    {/* Заголовок з появою зверху */}
    <motion.h2 
      variants={{
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.6 }}
      className="font-['Inter'] font-[900] text-[24px] text-[#44403E] text-center mb-8 uppercase"
      style={{ WebkitTextStroke: '1px #44403E' }}
    >
      Виробничі Потужності
    </motion.h2>
    
    {/* Список інфо-елементів з каскадною появою зліва */}
    <div className="w-full flex flex-col gap-6 mb-10">
      {infoItems.map((item, index) => (
        <motion.div 
          key={`mob-info-${index}`} 
          variants={{
            hidden: { opacity: 0, x: -30 },
            visible: { opacity: 1, x: 0 }
          }}
          transition={{ delay: index * 0.2, duration: 0.5 }}
          className="flex items-start gap-4"
        >
          <img src={item.icon} alt="" className="w-10 h-10 mr-2 shrink-0 object-contain" />
          <p className="font-['Inter'] text-[16px] text-[#44403E] leading-tight">{item.text}</p>
        </motion.div>
      ))}
    </div>

    {/* Другий заголовок */}
    <motion.h3 
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
      }}
      className="font-['Inter'] font-[900] text-[24px] text-[#44403E] mb-6 uppercase" 
      style={{ WebkitTextStroke: '1px #44403E' }}
    >
      Технологічний Цикл
    </motion.h3>

    {/* Картки статистики з ефектом "спливання" знизу */}
    <div className="flex flex-col gap-6 w-full">
      {statCards.map((card, index) => (
        <motion.div 
          key={`mob-card-${card.id}`} 
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: index * 0.15, duration: 0.5 }}
          whileTap={{ scale: 0.98 }} // Ефект натискання для мобілки
          className="bg-white p-4 rounded-sm shadow-sm flex items-center gap-4"
        >
          <img src={card.icon} alt="" className="w-10 mr-3 h-10 object-contain" />
          <div>
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: index * 0.2 + 0.3 }}
              className="font-black text-[22px] text-[#44403E]"
            >
              {card.value}
            </motion.div>
            <div className="text-[12px] opacity-70 uppercase">{card.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
</section>
    ) : (
      /* 2. ДЕСКТОП ВЕРСІЯ */
      <section className="relative w-full flex justify-center bg-[#F0F4DB] overflow-hidden py-20 min-h-[600px]">
        <div className="w-full flex justify-center">
          <div className="relative w-[1440px] flex-shrink-0 origin-top scale-[0.7] lg:scale-[0.8] xl:scale-100">
            
            <div className="absolute top-[68px] left-[427px] w-[586px] font-['Inter'] font-[900] text-[32px] text-center text-[#44403E] uppercase"
                 style={{ WebkitTextStroke: '1px #44403E' }}>
              Виробничі Потужності
            </div>

            <div className="absolute top-[299px] left-[120px] w-[279px] font-['Inter'] font-black text-[32px] text-center text-[#44403E] leading-tight uppercase"
                 style={{ WebkitTextStroke: '1px #44403E' }}>
              Технологічний <br /> Цикл
            </div>

            {statCards.map((card, index) => (
              <motion.div key={`desk-card-${card.id}`} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={index}>
                <div className={card.bgClass} />
                <img className={card.iconClass} alt={card.iconAlt} src={card.icon} />
                <div className={card.valueClass}>{card.value}</div>
                <div className={card.labelClass}>{card.label}</div>
              </motion.div>
            ))}

            {infoItems.map((item, index) => (
              <motion.div key={`desk-info-${index}`} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={index}>
                <img className={item.iconClass} alt={item.iconAlt} src={item.icon} />
                <div className={item.textClass}>{item.text}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )}

<section className="w-full py-10 md:py-24 flex justify-center bg-white px-4 overflow-hidden">
  <div className="relative max-w-[1201px] w-full grid grid-cols-2 gap-y-16 gap-x-4 md:block md:h-[200px]">
    
    {features.map((feature, index) => (
      <motion.div
        key={feature.id}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={index}
        className={`
          relative flex flex-col items-center 
          ${feature.mobileOrder} 
          md:absolute md:top-0 ${feature.mdLeft} 
          md:w-[23.2%]
        `}
      >
        {/* Контейнер для іконки - тепер він жорстко центруючий */}
        <div className="flex items-end justify-center w-full h-[100px] mb-4 md:mb-0">
          <img
            className={`
              ${feature.iconClass} 
              scale-75 sm:scale-90 md:scale-100 
              object-contain
            `}
            alt={feature.iconAlt}
            src={feature.icon}
          />
        </div>

        {/* Заголовок */}
        <div className="
          md:absolute md:top-[135px] w-full 
          font-['Inter'] font-black /* Використовуємо стандартний Tailwind клас для 900+ */
          text-base sm:text-lg md:text-[clamp(1.1rem,1.7vw,1.875rem)] 
          text-[#44403E] text-center uppercase tracking-tighter leading-none
        " style={{ WebkitTextStroke: '0.5px #44403E' }}>
          {feature.title}
        </div>

        {/* Опис */}
        <div className="
          md:absolute md:top-[175px] w-full 
          font-['Inter'] font-normal 
          text-sm sm:text-base md:text-[clamp(0.9rem,1.2vw,1.375rem)] 
          text-[#44403E] text-center mt-1 md:mt-0 opacity-90
        ">
          {feature.description}
        </div>
      </motion.div>
    ))}
  </div>
</section>
      {/* Media Section */}
      <section className="media-section py-20 bg-[#3D3834]">
        <div className="max-w-8xl mx-auto px-12 relative"> 
          
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-3xl font-['Inter'] font-bold text-white">Медіа-Огляд</h2>
          </div>
      
          {/* Кнопки навігації (залишаємо вашу логіку) */}
          {/* Кнопка вліво */}
          <button 
            onClick={() => scrollByManual(-340)} 
            className="absolute left-0 top-[60%] -translate-y-1/2 z-20 p-2 transition-all hover:scale-110 active:opacity-70"
          >
            <img 
              src="/assets/icons/chevron-left.png" 
              alt="Назад" 
              className="w-[25px] h-[54px] object-contain opacity-50 hover:opacity-100 transition-opacity" 
            />
          </button>

          {/* Кнопка вправо */}
          <button 
            onClick={() => scrollByManual(340)} 
            className="absolute right-0 top-[60%] -translate-y-1/2 z-20 p-2 transition-all hover:scale-110 active:opacity-70"
          >
            <img 
              src="/assets/icons/chevron-right.png" 
              alt="Вперед" 
              className="w-[25px] h-[54px] object-contain opacity-50 hover:opacity-100 transition-opacity" 
            />
          </button>
      
          {/* Слайдер з прихованим скролбаром */}
          <div 
            ref={containerRef} 
            className="media-slider flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {videos.map((url, index) => {
              const videoId = url.split("/video/")[1]?.split("?")[0];
              return (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-[320px] sm:w-[335px] snap-start"
                >
                  {/* Контейнер з фіксованим співвідношенням 9:16 */}
                  <div className="aspect-[9/16] w-full  overflow-hidden ">
                     <iframe
            // 2. Використовуємо v2 та посилання без зайвих параметрів
            src={`https://www.tiktok.com/embed/v2/${videoId}`}
            className="w-full h-full border-0"
            title={`tiktok-video-${index}`}
            // 3. Повний набір дозволів
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; visibility"
            allowFullScreen
            // 4. ПРАВИЛЬНИЙ sandbox (без allow-all-origin)
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          ></iframe>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      
        {/* Додайте цей стиль у ваш глобальний CSS або через Tailwind плагін */}
        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* CTA Section */}
      {/* <section className="cta-section">
        <div className="max-w-3xl mx-auto px-4">
          <FontAwesomeIcon icon={faHandshake} className="cta-icon" />
          <h2 className="cta-title">
            Двері, які відкривають світ успішного партнерства
          </h2>
          <p className="cta-desc">
            Станьте частиною надійної дилерської мережі "Вікна Стиль". 18 років
            досвіду та європейські стандарти якості для вашого бізнесу.
          </p>
          
        </div>
      </section> */}
     <motion.section 
className="w-full lg:pt-[60px] md:pt-[40px] pt-[20px] lg:pb-[140px] md:pb-[100px] pb-[80px] flex justify-center bg-white"
  style={{borderTop: '4px solid #B4D947'}}
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  {/* Центруючий контейнер макета */}
  <div className="relative max-w-[1203px] w-full h-[250px] flex flex-col items-center flex-shrink-0 px-4">
    
    {/* Іконка рукостискання */}
    <motion.img
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className="w-[120px] h-[88px] object-cover aspect-[1.37] "
      alt="Партнерство"
      src={handshake}
    />

    {/* Головний слоган */}
    {/* Головний слоган */}
<motion.h2
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ delay: 0.2, duration: 0.6 }}
  className="mt-[23px] font-['Inter'] font-[900] text-[20px] sm:text-[24px] md:text-[32px] text-[#44403E] text-center uppercase tracking-tight leading-[1.1]"
  style={{ WebkitTextStroke: '0.5px #44403E' }}
>
  Двері, які відкривають світ <br className="max-sm:hidden" />
  успішного партнерства
</motion.h2>

{/* Опис */}
<motion.p
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ delay: 0.3, duration: 0.6 }}
  className="mt-4 w-full font-['Inter'] font-normal text-[15px] md:text-[18px] lg:text-[22px] text-[#44403E] text-center leading-tight"
>
  Станьте частиною надійної дилерської мережі "Вікна Стиль". <br className="max-sm:hidden" />
  18 років досвіду та європейські стандарти якості для вашого бізнесу.
</motion.p>

  </div>
</motion.section>
    </div>
  );
}
