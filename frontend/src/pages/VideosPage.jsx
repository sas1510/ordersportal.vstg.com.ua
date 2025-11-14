import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
// Додаємо іконки для типів відео
import { FaPlus, FaSearch, FaEdit, FaTrash, FaYoutube, FaTiktok } from 'react-icons/fa';
import { useNotification } from '../components/notification/Notifications';
import ConfirmModal from '../components/Orders/ConfirmModal';
import './Videos.css';

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Форма тепер містить resource_type
  const [videoForm, setVideoForm] = useState({ 
    title: '', 
    url: '', 
    description: '', 
    resource_type: 'youtube' // 'youtube' як тип за замовчуванням
  });

  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';
  const { addNotification } = useNotification();

  useEffect(() => { fetchVideos(); }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = videos.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVideos(filtered);
    } else setFilteredVideos(videos);
  }, [searchQuery, videos]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      // !!! ЗМІНЕНО: Новий URL з фільтром для типів 'youtube' та 'tiktok'
      const res = await axiosInstance.get('/media-resources/?types=youtube,tiktok');
      
      // (Видалено явну передачу 'token', оскільки axiosInstance має це робити)
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setVideos(data);
      setFilteredVideos(data);
    } catch {
      addNotification('Помилка завантаження відео', 'error');
    } finally { setLoading(false); }
  };

  // ====================== Додавання / Редагування ======================
  const handleSaveVideo = async (e) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.url)
      return addNotification('Заповніть поля "Назва" та "Посилання"', 'error');

    setLoadingSave(true);
    
    // 'videoForm' вже містить всі дані, включно з resource_type
    const payload = videoForm; 

    try {
      if (editModalOpen) {
        // 🔹 Редагування (!!! ЗМІНЕНО: URL та метод PUT -> PATCH)
        await axiosInstance.patch(`/media-resources/${selectedVideo.id}/`, payload);
        addNotification('Відео оновлено успішно!', 'success');
      } else {
        // 🔹 Додавання (!!! ЗМІНЕНО: URL)
        // 'payload' вже містить 'resource_type' з форми
        await axiosInstance.post('/media-resources/', payload);
        addNotification('Відео додано успішно!', 'success');
      }
      setAddModalOpen(false);
      setEditModalOpen(false);
      fetchVideos();
      // Скидаємо форму до значень за замовчуванням
      setVideoForm({ title: '', url: '', description: '', resource_type: 'youtube' });
    } catch {
      addNotification('Помилка при збереженні відео', 'error');
    } finally { setLoadingSave(false); }
  };

  // ====================== Видалення ======================
  const handleDeleteClick = (video) => { setSelectedVideo(video); setDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    try {
      // !!! ЗМІНЕНО: URL
      await axiosInstance.delete(`/media-resources/${selectedVideo.id}/`);
      fetchVideos();
      addNotification(`Відео "${selectedVideo.title}" видалено`, 'success');
    } catch {
      addNotification('Не вдалося видалити відео', 'error');
    } finally { setDeleteModalOpen(false); }
  };

  const openEditModal = (video) => {
    setSelectedVideo(video);
    // Заповнюємо форму даними з обраного відео
    setVideoForm({
      title: video.title || '',
      url: video.url || '',
      description: video.description || '',
      resource_type: video.resource_type // Зберігаємо тип
    });
    setEditModalOpen(true);
  };

  const openAddModal = () => {
    // Скидаємо форму до чистих значень
    setSelectedVideo(null);
    setVideoForm({ title: '', url: '', description: '', resource_type: 'youtube' });
    setAddModalOpen(true);
  }

  const formatDate = (isoString) => {
    // Поле 'created_at' з нової моделі
    if (!isoString) return 'Невідомо';
    return new Date(isoString).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getEmbedUrl = (video) => {
    // !!! ЗМІНЕНО: Розумна функція, що обробляє YouTube та TikTok
    if (!video || !video.url) return '';
    
    try {
      const url = new URL(video.url);

      if (video.resource_type === 'youtube') {
        let videoId;
        if (url.hostname === 'youtu.be') {
          videoId = url.pathname.slice(1);
        } else {
          videoId = url.searchParams.get('v');
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
      }

      if (video.resource_type === 'tiktok') {
        const match = video.pathname.match(/video\/(\d+)/);
        const videoId = match ? match[1] : null;
        return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : '';
      }

    } catch (e) {
      console.error("Недійсний URL:", e);
      return '';
    }
    
    return '';
  };

  const getVideoIcon = (resourceType) => {
    if (resourceType === 'youtube') {
      return <FaYoutube className="text-red-500" />;
    }
    if (resourceType === 'tiktok') {
      return <FaTiktok className="text-black" />;
    }
    return '🎥';
  }

  return (
    <div className="videos-body column gap-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-color mt-3 text-4xl font-bold">🎥 Відео</h1>
        {isAdmin && (
          <button
            className="bg-custom-green hover:bg-custom-green-dark text-white font-semibold text-lg px-3 py-2 rounded-lg flex items-center gap-3 mt-5"
            onClick={openAddModal} // Використовуємо нову функцію
          >
            <FaPlus size={20} /> Додати відео
          </button>
        )}
      </div>

      {/* ... (Search bar залишається без змін) ... */}
      <div className="row gap-14 align-center mb-2">
        <div className="row align-center gap-7 search-box"
          style={{ flex: 1, padding: '8px 12px', borderRadius: '10px',
                   border: '1px dashed #666666ff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <FaSearch className="text-grey" style={{ fontSize: '20px' }} />
          <input
            type="text"
            placeholder="Пошук за назвою або описом..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none',  outline: 'none', fontSize: '16px', fontWeight: '400', padding: '8px 0', background: 'transparent' }}
          />
        </div>
      </div>
      <div style={{ border: '1px dashed #666666ff', marginBottom: '5px' }}></div>


      {/* Videos List */}
      {loading ? (
        <div className="align-center" style={{ padding: '50px' }}><div className="loader"></div></div>
      ) : filteredVideos.length === 0 ? (
        <div className="align-center column" style={{ padding: '50px' }}>
          <div className="text-grey">{searchQuery ? 'Відео не знайдено' : 'Відео ще немає'}</div>
        </div>
      ) : (
        <div className="column gap-10">
          {filteredVideos.map(video => (
            <div key={video.id} className="claim-item column gap-3">
              <div className="column gap-2 flex-1">
              <div className="text-info font-semibold text-lg row align-center gap-5">
                {/* Додаємо іконку типу */}
                {getVideoIcon(video.resource_type)}
                <span>{video.title}</span>
              </div>
                {video.description && <p className="text-grey text-sm">{video.description}</p>}
                
                <iframe
                  className="w-full aspect-video rounded-md"
                  src={getEmbedUrl(video)} // Передаємо весь об'єкт
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>

              {/* Використовуємо 'created_at' з нової моделі */}
                <div className="text-sm text-grey mt-1">Дата: {formatDate(video.created_at)}</div>
              </div>

              {/* ... (Кнопки Edit/Delete залишаються без змін) ... */}
              {isAdmin && (
                <div className="row gap-7 align-center mt-2 justify-end">
                  <button
                    className="button background-warning row gap-5 align-center"
                    onClick={() => openEditModal(video)}
                  >
                    <FaEdit /> Редагувати
                  </button>
                  <button
                    className="button background-danger row gap-5 align-center"
                    onClick={() => handleDeleteClick(video)}
                  >
                    <FaTrash /> Видалити
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ... (Confirm Delete Modal залишається без змін) ... */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        type="danger"
        title="Видалення відео"
        message={`Ви дійсно хочете видалити відео "${selectedVideo?.title}"?`}
        confirmText="Видалити"
        cancelText="Скасувати"
      />

      {/* Add/Edit Video Modal */}
      {(addModalOpen || editModalOpen) && (
        <div className="file-modal-overlay" onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}>
          <div className="file-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <div className="header-content">
                <div className="file-icon">🎬</div>
                <h3>{editModalOpen ? 'Редагувати відео' : 'Додати відео'}</h3>
              </div>
              <button className="file-close-btn" onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}>✕</button>
            </div>

            <form onSubmit={handleSaveVideo} className="claim-form">
              
              {/* !!! ЗМІНЕНО: Поле вибору типу */}
              <label className="file-label">
                <span>Тип відео</span>
                <select 
                  className="file-input"
                  value={videoForm.resource_type}
                  // Дозволяємо змінювати тип тільки при додаванні
                  disabled={editModalOpen} 
                  onChange={(e) => setVideoForm({ ...videoForm, resource_type: e.target.value })}
                >
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </label>

              <label className="file-label">
                <span>Назва відео</span>
                <input
                  type="text"
                  className="file-input"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                />
              </label>

              <label className="file-label">
                {/* !!! ЗМІНЕНО: Узагальнена назва */}
                <span>Посилання (URL)</span>
                <input
                  type="url"
                  className="file-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoForm.url}
                  onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                />
              </label>

              <label className="file-label">
                <span>Опис</span>
                <textarea
                  className="file-input"
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                />
              </label>

              <div className="file-modal-footer">
                <button type="button" className="file-btn-cancel" onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}>✕ Скасувати</button>
                <button type="submit" className="file-btn-save" disabled={loadingSave}>
                  {loadingSave ? <div className="loader-small"></div> : '💾 Зберегти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideosPage;