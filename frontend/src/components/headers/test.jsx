import React, { useEffect, useState, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import { useNotification } from "../hooks/useNotification";
import ConfirmModal from "../components/Orders/ConfirmModal";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { FaEdit, FaTrash } from "react-icons/fa"; 
import { useTranslation } from 'react-i18next';
import "./Videos.css";

import InstagramProfileIframe from "./InstagramProfileIframe";
import TikTokWidget from "./TikTokWidget";
import FacebookPageWidget from "./FacebookPageWidget";

const VideosPage = () => {
  const { t, i18n } = useTranslation();
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("tech");
  const [loading, setLoading] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState(null);

  const { role } = useAuthGetRole();
  const isAdmin = role === "admin";
  const { addNotification } = useNotification();

  // Стан форми з підтримкою мов
  const [videoForm, setVideoForm] = useState({
    title_ua: "", title_en: "", title_it: "",
    url_ua: "", url_en: "", url_it: "",
    description_ua: "", description_en: "", description_it: "",
    category: "2",
    resource_type: "youtube"
  });

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
    { id: "tech", label: t('videos.categories.tech'), icon: techLessonIcon },
    { id: "media", label: t('videos.categories.media'), icon: mediaReviewIcon },
    { id: "factory", label: t('videos.categories.factory'), icon: factoryIcon },
    { id: "install", label: t('videos.categories.install'), icon: installIcon },
  ], [t, techLessonIcon, mediaReviewIcon, factoryIcon, installIcon]);

  const currentCategoryLabel = useMemo(() => {
    if (selectedCategory === "social" && selectedSocial) {
      return `${t('videos.categories.social')}: ${selectedSocial}`;
    }
    return categories.find(cat => cat.id === selectedCategory)?.label || t('videos.all_videos');
  }, [selectedCategory, selectedSocial, categories, t]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/media-resources/?types=youtube,tiktok,instagram,facebook");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setVideos(data);
    } catch {
      addNotification(t('videos.errors.load'), "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification, t]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const categoryMap = {
    tech: (v) => v.category_name === "Технічні навчання",
    media: (v) => v.category_name === "Медіа-огляди",
    factory: (v) => v.category_name === "Відео з виробництва",
    install: (v) => v.category_name === "Відео з монтажу",
    social: (v) => v.category_name === "Відео з соцмереж",
  };

  useEffect(() => {
    const result = videos.filter((v) => {
      // Пошук по всіх мовних версіях назви
      const titleValues = Object.values(v.titles || {}).join(" ").toLowerCase();
      const matchesSearch = titleValues.includes(searchQuery.toLowerCase());
      const matchesCategory = categoryMap[selectedCategory]?.(v) ?? true;
      return matchesSearch && matchesCategory;
    });
    setFilteredVideos(result);
  }, [searchQuery, selectedCategory, videos]);

  const getEmbedUrl = (video) => {
    // Беремо URL для поточної мови або запасний (fallback)
    const rawUrl = video.urls?.[i18n.language] || video.urls?.ua || video.urls?.en || "";
    if (!rawUrl) return "";

    try {
      const urlObj = new URL(rawUrl);
      let videoId = "";

      if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.includes("/shorts/")) {
        videoId = urlObj.pathname.split("/shorts/")[1];
      } else if (urlObj.hostname.includes("youtube.com")) {
        videoId = urlObj.searchParams.get("v");
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId.split(/[?&]/)[0]}`;
      }

      if (video.resource_type === "tiktok" || urlObj.hostname.includes("tiktok.com")) {
        const match = rawUrl.match(/\/video\/(\d+)/);
        if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
      }
      
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    setLoadingSave(true);
    try {
      if (selectedVideo) {
        await axiosInstance.patch(`/media-resources/${selectedVideo.id}/`, videoForm);
        addNotification(t('videos.feedback.updated'), "success");
      } else {
        await axiosInstance.post("/media-resources/", videoForm);
        addNotification(t('videos.feedback.added'), "success");
      }
      setIsModalOpen(false);
      fetchVideos();
    } catch {
      addNotification(t('videos.errors.save'), "error");
    } finally {
      setLoadingSave(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/media-resources/${selectedVideo.id}/`);
      addNotification(t('videos.feedback.deleted'), "success");
      setDeleteModalOpen(false);
      fetchVideos();
    } catch {
      addNotification(t('videos.errors.delete'), "error");
    }
  };

  const openAddModal = () => {
    setSelectedVideo(null);
    setVideoForm({ 
      title_ua: "", title_en: "", title_it: "",
      url_ua: "", url_en: "", url_it: "",
      description_ua: "", description_en: "", description_it: "",
      category: "2", resource_type: "youtube" 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (video) => {
    setSelectedVideo(video);
    setVideoForm({
      title_ua: video.titles?.ua || "",
      title_en: video.titles?.en || "",
      title_it: video.titles?.it || "",
      url_ua: video.urls?.ua || "",
      url_en: video.urls?.en || "",
      url_it: video.urls?.it || "",
      description_ua: video.descriptions?.ua || "",
      description_en: video.descriptions?.en || "",
      description_it: video.descriptions?.it || "",
      category: video.category,
      resource_type: video.resource_type
    });
    setIsModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(i18n.language === 'en' ? "en-US" : "uk-UA", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  return (
    <div className="videos-container">
      <section className="videos-hero">
        <img src={backgroundImage} className="videos-hero-bg" alt="bg" />
        <div className="videos-hero-overlay" />
        <div className="videos-hero-content w-full max-w-[1440px] mx-auto px-4">
          <h1 className="text-[24px] xl:text-[32px] font-bold uppercase tracking-wider text-center pt-[100px]">
            {t('videos.header.title')}
          </h1>
          <div className={`flex !flex-col md:!flex-row items-center gap-6 ${isAdmin ? 'justify-between' : 'justify-center'}`}>
            <div className="hidden lg:block lg:flex-1" />
            <p className="text-[16px] xl:text-[20px] font-light text-center leading-tight lg:flex-1 max-w-[600px]">
              {t('videos.header.subtitle')}
            </p>
            {isAdmin && (
              <div className="w-full max-w-[285px] lg:max-w-[250px] lg:flex-1 flex justify-center lg:justify-end">
                <button onClick={openAddModal} className="w-full bg-custom-green hover:bg-custom-green-dark text-WS---DarkGrey border border-zinc-300 font-semibold text-lg px-4 py-2 rounded-[5px] flex items-center justify-center gap-3 transition-colors">
                  <img src={plusIcon} alt="add" />
                  <span>{t('videos.buttons.add')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

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
                placeholder={t('videos.search_placeholder')}
                value={searchQuery}
                className="search-orders w-full pl-10 pr-4 py-2 border rounded-md"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <aside className={`videos-sidebar ${isSidebarOpen ? "open" : ""}`}>
            <div className="videos-sidebar-mobile-header">
              <span>{t('videos.sidebar.categories')}</span>
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
                    <img src={cat.icon} className={`mr-2 shrink-0 block ${selectedCategory === cat.id ? "active-icon" : ""}`} alt="" />
                  )}
                  <span className="whitespace-nowrap">{cat.label}</span>
                </div>
              ))}
            </div>

            <div className={`row videos-category-item !border-b-0 flex items-center ${selectedCategory === "social" ? "active" : ""}`} onClick={() => setIsSocialOpen(!isSocialOpen)}>
              <img src={socialIcon} className={`mr-3 shrink-0 ${selectedCategory === "social" ? "active-icon" : ""}`} alt="" />
              <span>{t('videos.categories.social')} {isSocialOpen ? "▲" : "▼"}</span>
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
              {filteredVideos.length > 0 && (
                <div className="videos-grid">
                  {filteredVideos.map((video) => (
                    <div key={video.id} className={`video-card-display ${video.resource_type === "tiktok" ? "tiktok-big" : ""}`}>
                      <div className="video-thumbnail">
                        <iframe src={getEmbedUrl(video)} allowFullScreen title="video" />
                      </div>
                      <div className="video-card-footer flex justify-between items-start">
                        <div className="flex flex-col">
                          <div className="font-bold text-[14px] line-clamp-2">
                            {video.titles?.[i18n.language] || video.titles?.ua}
                          </div>
                          <div className="text-[12px] text-gray-500 mt-1">
                            {formatDate(video.created_at)}
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex gap-2 shrink-0">
                            <FaEdit className="cursor-pointer text-orange-400" onClick={() => openEditModal(video)} />
                            <FaTrash className="cursor-pointer text-red-500" onClick={() => { setSelectedVideo(video); setDeleteModalOpen(true); }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCategory === "social" && (
                <div className="social-widgets-flex-container" style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '30px', marginTop: filteredVideos.length > 0 ? '40px' : '0' }}>
                  {(!selectedSocial || selectedSocial === "TikTok") && (
                    <div className="social-widget-no-grid">
                       <div className="widget-header" style={{width: '100%', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>TikTok</div>
                       <TikTokWidget />
                    </div>
                  )}
                  {(!selectedSocial || selectedSocial === "Facebook") && (
                    <div className="social-widget-no-grid">
                       <div className="widget-header" style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Facebook</div>
                       <FacebookPageWidget />
                    </div>
                  )}
                  {(!selectedSocial || selectedSocial === "Instagram") && (
                    <div className="social-widget-no-grid">
                       <div className="widget-header" style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Instagram</div>
                       <InstagramProfileIframe />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Модалка додавання/редагування */}
      {isModalOpen && (
        <div className="file-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="file-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h3>{selectedVideo ? t('videos.modals.edit_title') : t('videos.modals.add_title')}</h3>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveVideo} className="claim-form p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              {/* Поля Назв */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input className="file-input border p-2 rounded" placeholder="Назва (UA) *" value={videoForm.title_ua} onChange={(e) => setVideoForm({...videoForm, title_ua: e.target.value})} required />
                <input className="file-input border p-2 rounded" placeholder="Title (EN)" value={videoForm.title_en} onChange={(e) => setVideoForm({...videoForm, title_en: e.target.value})} />
                <input className="file-input border p-2 rounded" placeholder="Titolo (IT)" value={videoForm.title_it} onChange={(e) => setVideoForm({...videoForm, title_it: e.target.value})} />
              </div>

      
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input className="file-input border p-2 rounded" placeholder="URL (UA) *" value={videoForm.url_ua} onChange={(e) => setVideoForm({...videoForm, url_ua: e.target.value})} required />
                <input className="file-input border p-2 rounded" placeholder="URL (EN)" value={videoForm.url_en} onChange={(e) => setVideoForm({...videoForm, url_en: e.target.value})} />
                <input className="file-input border p-2 rounded" placeholder="URL (IT)" value={videoForm.url_it} onChange={(e) => setVideoForm({...videoForm, url_it: e.target.value})} />
              </div>
              
          
              <textarea className="file-input border p-2 rounded h-20" placeholder="Опис (UA)" value={videoForm.description_ua} onChange={(e) => setVideoForm({...videoForm, description_ua: e.target.value})} />
              
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
                {loadingSave ? t('videos.buttons.saving') : t('videos.buttons.save')}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('videos.modals.delete_confirm')}
        message={`${t('videos.modals.delete_message')} "${selectedVideo?.titles?.[i18n.language] || selectedVideo?.titles?.ua}"?`}
        type="danger"
      />
    </div>
  );
};

export default VideosPage;