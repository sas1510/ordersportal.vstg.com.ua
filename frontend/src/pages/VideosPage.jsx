import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { FaPlus, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import { useNotification } from '../components/notification/Notifications';
import ConfirmModal from '../components/Orders1/ConfirmModal';
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
  const [videoForm, setVideoForm] = useState({ title: '', url: '', description: '' });

  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';
  const token = localStorage.getItem('access');
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
      const res = await axiosInstance.get('/video/', {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      return addNotification('Заповніть усі обов’язкові поля', 'error');

    setLoadingSave(true);
    try {
      if (editModalOpen) {
        // 🔹 Редагування
        await axiosInstance.put(`/video/${selectedVideo.id}/`, videoForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addNotification('Відео оновлено успішно!', 'success');
      } else {
        // 🔹 Додавання
        await axiosInstance.post('/video/', videoForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addNotification('Відео додано успішно!', 'success');
      }
      setAddModalOpen(false);
      setEditModalOpen(false);
      fetchVideos();
      setVideoForm({ title: '', url: '', description: '' });
    } catch {
      addNotification('Помилка при збереженні відео', 'error');
    } finally { setLoadingSave(false); }
  };

  // ====================== Видалення ======================
  const handleDeleteClick = (video) => { setSelectedVideo(video); setDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/video/${selectedVideo.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVideos();
      addNotification(`Відео "${selectedVideo.title}" видалено`, 'success');
    } catch {
      addNotification('Не вдалося видалити відео', 'error');
    } finally { setDeleteModalOpen(false); }
  };

  const openEditModal = (video) => {
    setSelectedVideo(video);
    setVideoForm({
      title: video.title || '',
      url: video.url || '',
      description: video.description || '',
    });
    setEditModalOpen(true);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Невідомо';
    return new Date(isoString).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  return (
    <div className="videos-body column gap-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-color mt-3 text-4xl font-bold">🎥 Відео</h1>
        {isAdmin && (
          <button
            className="bg-custom-green hover:bg-custom-green-dark text-white font-semibold text-lg px-3 py-2 rounded-lg flex items-center gap-3 mt-5"
            onClick={() => { setAddModalOpen(true); setVideoForm({ title: '', url: '', description: '' }); }}
          >
            <FaPlus size={20} /> Додати відео
          </button>
        )}
      </div>

      {/* Search */}
      <div className="row gap-14 align-center mb-2">
        <div className="row align-center gap-7 search-box"
          style={{ flex: 1, background: 'white', padding: '8px 12px', borderRadius: '10px',
                   border: '1px dashed #ccc', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <FaSearch className="text-grey" style={{ fontSize: '20px' }} />
          <input
            type="text"
            placeholder="Пошук за назвою або описом..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', fontWeight: '400', padding: '8px 0' }}
          />
        </div>
      </div>

      <div style={{ border: '1px dashed #ccc', marginBottom: '5px' }}></div>

      {/* Videos List */}
      {loading ? (
        <div className="align-center" style={{ padding: '50px' }}>
          <div className="loader"></div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="align-center column" style={{ padding: '50px' }}>
          <div className="text-grey">{searchQuery ? 'Відео не знайдено' : 'Відео ще немає'}</div>
        </div>
      ) : (
        <div className="column gap-10">
          {filteredVideos.map(video => (
            <div key={video.id} className="claim-item column gap-3">
              <div className="column gap-2 flex-1">
                <div className="text-info font-semibold text-lg">{video.title}</div>
                {video.description && <p className="text-grey text-sm">{video.description}</p>}
                
                <iframe
                  className="w-full aspect-video rounded-md"
                  src={getEmbedUrl(video.url)}
                  title={video.title}
                  allowFullScreen
                ></iframe>

                <div className="text-sm text-grey mt-1">Дата: {formatDate(video.created_at)}</div>
              </div>

              {/* --- Кнопки під відео --- */}
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

      {/* Confirm Delete */}
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
                <span>Посилання на YouTube</span>
                <input
                  type="url"
                  className="file-input"
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
                <button type="submit" className="file-btn-save">
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
