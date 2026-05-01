import React, { useEffect, useState, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import { useNotification } from "../hooks/useNotification";
import ConfirmModal from "../components/Orders/ConfirmModal";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { FaEdit, FaTrash } from "react-icons/fa"; // Для кнопок керування
import "./Videos.css";

import InstagramProfileIframe from "./InstagramProfileIframe";
import TikTokWidget from "./TikTokWidget";
import FacebookPageWidget from "./FacebookPageWidget";

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("tech");
  const [loading, setLoading] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  
  // Стани для модалок
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState(null);

  const { role } = useAuthGetRole();
  const isAdmin = role === "admin";
  const { addNotification } = useNotification();

  // Форма для створення/редагування
  const [videoForm, setVideoForm] = useState({
    title: "",
    url: "",
    description: "",
    category: "2",
    resource_type: "youtube"
  });

  // Іконки
  const backgroundImage = "/assets/icons/FileBackground.jpg";
  const searchIcon = "/assets/icons/SearchIcon.png";
  const videoMenuIcon = "/assets/icons/VideoMenuIcon.png";
  const plusIcon = "/assets/icons/PlusIcon.png";
  const closeIcon = "/assets/icons/CloseButton.png";
  const tiktokIcon = "/assets/icons/TikTok.png";
  const facebookIcon = "/assets/icons/Facebook.png";
  const instagramIcon = "/assets/icons/Instagram.png";
  const socialIcon = "/assets/icons/SocialNetwork.png";
  const techLessonIcon = "/assets/icons/TechLessonVideo.png";
  const mediaReviewIcon = "/assets/icons/MediaDescription.png";
  const factoryIcon = "/assets/icons/FactoryVideo.png";
  const installIcon = "/assets/icons/MontazVideo.png";

  const categories = useMemo(() => [
    { id: "tech", label: "Технічні навчання", icon: techLessonIcon },
    { id: "media", label: "Медіа-огляди", icon: mediaReviewIcon },
    { id: "factory", label: "Відео з виробництва", icon: factoryIcon },
    { id: "install", label: "Відео з монтажу", icon: installIcon },
  ], [techLessonIcon, mediaReviewIcon, factoryIcon, installIcon]);

  const currentCategoryLabel = useMemo(() => {
    if (selectedCategory === "social" && selectedSocial) {
      return `Соціальні мережі: ${selectedSocial}`;
    }
    return categories.find(cat => cat.id === selectedCategory)?.label || "Всі відео";
  }, [selectedCategory, selectedSocial, categories]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/media-resources/?types=youtube,tiktok");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setVideos(data);
    } catch {
      addNotification("Помилка завантаження відео", "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification]);


  

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
  // Додаємо скрипт TikTok для ініціалізації віджетів
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const categoryMap = {
    tech: (v) => v.category_name === "Технічні навчання",
    media: (v) => v.category_name === "Медіа-огляди",
    factory: (v) => v.category_name === "Відео з виробництва",
    install: (v) => v.category_name === "Відео з монтажу",
    social: (v) => v.category_name === "Відео з соцмереж",
  };

  useEffect(() => {
    const result = videos.filter((v) => {
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryMap[selectedCategory]?.(v) ?? true;
      return matchesSearch && matchesCategory;
    });
    setFilteredVideos(result);
  }, [searchQuery, selectedCategory, videos]);


const getEmbedUrl = (video) => {
  if (!video?.url) return "";






  try {
    const urlObj = new URL(video.url);
    let videoId = "";

    // 1. Обробка коротких посилань youtu.be
    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1);
    } 
    // 2. Обробка посилань /shorts/
    else if (urlObj.pathname.includes("/shorts/")) {
      videoId = urlObj.pathname.split("/shorts/")[1];
    }
    // 3. Обробка стандартних youtube.com?v=ID
    else if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v");
    }

    // Очищення від зайвих параметрів (наприклад, &t=120s)
    if (videoId) {
      videoId = videoId.split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }



     if (video.resource_type === "tiktok" || urlObj.hostname.includes("tiktok.com")) {
      // Спроба отримати ID відео з посилання типу /video/734...
      const match = video.url.match(/\/video\/(\d+)/);
      if (match && match[1]) {
        return `https://www.tiktok.com/embed/v2/${match[1]}`;
      }
    }
    // Для TikTok або інших ресурсів повертаємо як є (або логіку віджета)
    return video.url;
  } catch {
    return video.url;
  }
};

  // --- ЛОГІКА ЗБЕРЕЖЕННЯ ---
  const handleSaveVideo = async (e) => {
    e.preventDefault();
    setLoadingSave(true);
    try {
      if (selectedVideo) {
        await axiosInstance.patch(`/media-resources/${selectedVideo.id}/`, videoForm);
        addNotification("Відео оновлено", "success");
      } else {
        await axiosInstance.post("/media-resources/", videoForm);
        addNotification("Відео додано", "success");
      }
      setIsModalOpen(false);
      fetchVideos();
    } catch {
      addNotification("Помилка при збереженні", "error");
    } finally {
      setLoadingSave(false);
    }
  };

  

  // --- ЛОГІКА ВИДАЛЕННЯ ---
  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/media-resources/${selectedVideo.id}/`);
      addNotification("Відео видалено", "success");
      setDeleteModalOpen(false);
      fetchVideos();
    } catch {
      addNotification("Помилка при видаленні", "error");
    }
  };

  const openAddModal = () => {
    setSelectedVideo(null);
    setVideoForm({ title: "", url: "", description: "", category: "2", resource_type: "youtube" });
    setIsModalOpen(true);
  };

  const openEditModal = (video) => {
    setSelectedVideo(video);
    setVideoForm({
      title: video.title,
      url: video.url,
      description: video.description || "",
      category: video.category,
      resource_type: video.resource_type
    });
    setIsModalOpen(true);
  };

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const handleSocialClick = (platform) => {
    setSelectedCategory("social");
    setSelectedSocial(platform);
    setIsSidebarOpen(false);
  };

  return (
    <div className="videos-container">
      {/* HERO SECTION */}
      <section className="videos-hero">
        <img src={backgroundImage} className="videos-hero-bg" alt="bg" />
        <div className="videos-hero-overlay" />
        <div className="videos-hero-content w-full max-w-[1440px] mx-auto px-4">
          <h1 className="text-[24px] xl:text-[32px] font-bold uppercase tracking-wider text-center mt-2">Відео</h1>
          <div className={`flex !flex-col md:!flex-row items-center gap-6 ${isAdmin ? 'justify-between' : 'justify-center'}`}>
            <div className="hidden lg:block lg:flex-1" />
            <p className="text-[16px] xl:text-[20px] font-light text-center leading-tight lg:flex-1 max-w-[600px]">
              Корисні відеоматеріали, які допомагають в роботі
            </p>
                    {isAdmin && (
            <div className="w-full max-w-[285px] lg:max-w-[250px] lg:flex-1 flex justify-center lg:justify-end">
              {isAdmin && (
                <button onClick={openAddModal} className="w-full bg-custom-green hover:bg-custom-green-dark text-WS---DarkGrey border border-zinc-300 font-semibold text-lg px-4 py-2 rounded-[5px] flex items-center justify-center gap-3 transition-colors">
                  <img src={plusIcon} alt="add" className="" />
                  <span>Додати відео</span>
                </button>
              )}
            </div>
            )}
          </div>
        </div>
      </section>

      {/* MOBILE TOGGLE */}
      <div className="videos-sidebar-toggle" onClick={() => setIsSidebarOpen((prev) => !prev)}>
        <img src={videoMenuIcon} alt="menu" />
        <span className="ml-2 font-semibold text-sm uppercase tracking-wide">{currentCategoryLabel}</span>
      </div>

      <div className="videos-layout">
        {isSidebarOpen && <div className="sidebar-overlay-videos" onClick={() => setIsSidebarOpen(false)} />}

        <div className="column">
          {selectedCategory !== "social" && (
            <div className="search-wrapper relative !hidden md:!block">
              <img src={searchIcon} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" alt="search" />
              <input
                placeholder="Пошук..."
                value={searchQuery}
                className="search-orders w-full pl-10 pr-4 py-2 border rounded-md"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <aside className={`videos-sidebar ${isSidebarOpen ? "open" : ""}`}>
            <div className="videos-sidebar-mobile-header">
              <span>Категорії</span>
              <button onClick={() => setIsSidebarOpen(false)}><img src={closeIcon} alt="close" /></button>
            </div>

            <div className="videos-categories-nav">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`videos-category-item flex items-center ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSocial(null);
                    setIsSidebarOpen(false);
                  }}
                >
                  {cat.icon && (
                    <img src={cat.icon} className={`mr-2 shrink-0 block ${selectedCategory === cat.id ? "active-icon" : ""}`} alt="" style={{ width: 'auto', height: 'auto' }} />
                  )}
                  <span className="whitespace-nowrap">{cat.label}</span>
                </div>
              ))}
            </div>

            <div className={`row videos-category-item !border-b-0 flex items-center ${selectedCategory === "social" ? "active" : ""}`} onClick={() => setIsSocialOpen(!isSocialOpen)}>
              <img src={socialIcon} className={`mr-3 shrink-0 ${selectedCategory === "social" ? "active-icon" : ""}`} alt="Соціальні мережі" />
              <span>Соціальні мережі {isSocialOpen ? "▲" : "▼"}</span>
            </div>
            {isSocialOpen && (
              <div className="social-submenu">
                <div className="submenu-divider-dashed" />
                <div className="social-icons-row flex p-2 justify-center">
                  <button onClick={() => handleSocialClick('TikTok')}><img src={tiktokIcon} alt="T" className={selectedSocial === 'TikTok' ? 'border-round-active' : ''} /></button>
                  <button onClick={() => handleSocialClick('Facebook')}><img src={facebookIcon} alt="F" className={selectedSocial === 'Facebook' ? 'border-round-active' : ''} /></button>
                  <button onClick={() => handleSocialClick('Instagram')}><img src={instagramIcon} alt="I" className={selectedSocial === 'Instagram' ? 'border-round-active' : ''} /></button>
                </div>
              </div>
            )}
          </aside>
        </div>

<main className="videos-grid-container w-full">
  {loading ? (
    <div className="loader" />
  ) : (
    <>
      {/* 1. Сітка для звичайних відео з бази даних (відображається завжди, якщо є відео) */}
      {filteredVideos.length > 0 && (
        <div className="videos-grid">
  {filteredVideos.map((video) => (
    <div
      key={video.id}
      className={`video-card-display ${
        video.resource_type === "tiktok" ? "tiktok-big" : ""
      }`}
    >
      <div className="video-thumbnail">
        {video.resource_type === "tiktok" ? (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${video.url.match(/\/video\/(\d+)/)?.[1]}`}
            allowFullScreen
          />
        ) : (
          <iframe src={getEmbedUrl(video)} allowFullScreen />
        )}
      </div>
                <div className="video-card-footer flex justify-between items-start">
  <div className="flex flex-col">
    <div className="font-bold text-[14px] line-clamp-2">
      {video.title}
    </div>

    <div className="text-[12px] text-gray-500 mt-1">
      {formatDate(video.created_at)}
    </div>
  </div>

  {isAdmin && (
    <div className="flex gap-2 shrink-0">
      <FaEdit
        className="cursor-pointer text-orange-400"
        onClick={() => openEditModal(video)}
      />
      <FaTrash
        className="cursor-pointer text-red-500"
        onClick={() => {
          setSelectedVideo(video);
          setDeleteModalOpen(true);
        }}
      />
    </div>
  )}
</div>
    </div>
  ))}
</div>
      )}

      {/* 2. Контейнер БЕЗ СІТКИ для соціальних віджетів */}
      {selectedCategory === "social" && (
        <div className="social-widgets-flex-container" style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '30px', marginTop: filteredVideos.length > 0 ? '40px' : '0' }}>
          {(!selectedSocial || selectedSocial === "TikTok") && (
            <div className="social-widget-no-grid">
               <div className="widget-header" style={{width: '100%', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>TikTok Стрічка</div>
               <TikTokWidget />
            </div>
          )}
          {(!selectedSocial || selectedSocial === "Facebook") && (
            <div className="social-widget-no-grid">
               <div className="widget-header" style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Facebook Сторінка</div>
               <FacebookPageWidget />
            </div>
          )}
          {(!selectedSocial || selectedSocial === "Instagram") && (
            <div className="social-widget-no-grid">
               <div className="widget-header" style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Instagram Профіль</div>
               <InstagramProfileIframe />
            </div>
          )}
        </div>
      )}
    </>
  )}
</main>

      </div>

      {/* МОДАЛЬНЕ ВІКНО ДОДАВАННЯ/РЕДАГУВАННЯ */}
      {isModalOpen && (
        <div className="file-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="file-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h3>{selectedVideo ? "Редагувати відео" : "Додати відео"}</h3>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveVideo} className="claim-form p-4 flex flex-col gap-4">
              <input className="file-input border p-2 rounded" placeholder="Назва відео" value={videoForm.title} onChange={(e) => setVideoForm({...videoForm, title: e.target.value})} required />
              <input className="file-input border p-2 rounded" placeholder="URL (YouTube/TikTok)" value={videoForm.url} onChange={(e) => setVideoForm({...videoForm, url: e.target.value})} required />
              <textarea className="file-input border p-2 rounded h-24" placeholder="Опис (необов'язково)" value={videoForm.description} onChange={(e) => setVideoForm({...videoForm, description: e.target.value})} />
              
              <div className="flex gap-4">
                <select className="file-input border p-2 rounded flex-1" value={videoForm.category} onChange={(e) => setVideoForm({...videoForm, category: e.target.value})}>
                  <option value="2">Технічні навчання</option>
                  <option value="3">Медіа-огляди</option>
                  <option value="4">Відео з виробництва</option>
                  <option value="5">Відео з монтажу</option>
                  <option value="6">Відео з соцмереж</option>
                </select>
                <select className="file-input border p-2 rounded flex-1" value={videoForm.resource_type} onChange={(e) => setVideoForm({...videoForm, resource_type: e.target.value})}>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>

              <button type="submit" className="file-btn-save max-w-[200px] bg-custom-green py-2 rounded font-bold" disabled={loadingSave}>
                {loadingSave ? "Збереження..." : "Зберегти"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Видалення"
        message={`Ви впевнені, що хочете видалити відео "${selectedVideo?.title}"?`}
        type = "danger"
      />
    </div>
  );
};

export default VideosPage;