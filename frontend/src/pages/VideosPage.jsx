import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTimes, FaSearch } from 'react-icons/fa';
import { useNotification } from '../components/notification/Notifications';
import ConfirmModal from '../components/Orders1/ConfirmModal';
import './Videos.css';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: '', url: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const role = localStorage.getItem('role');
  const token = localStorage.getItem('access');
  const isAdmin = role === 'admin';
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = videos.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVideos(filtered);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchQuery, videos]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/video/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideos(res.data);
      setFilteredVideos(res.data);
    } catch (error) {
      console.error('Помилка завантаження відео:', error);
      addNotification('Помилка завантаження відео', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!newVideo.title || !newVideo.url) return addNotification('Заповніть всі поля', 'error');

    setLoadingAdd(true);
    try {
      await axiosInstance.post('/video/', newVideo, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddModalOpen(false);
      setNewVideo({ title: '', url: '', description: '' });
      fetchVideos();
      addNotification('Відео успішно додано!', 'success');
    } catch (error) {
      console.error('Помилка при додаванні відео:', error);
      addNotification('Не вдалося додати відео', 'error');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleDeleteClick = (video) => {
    setSelectedVideo(video);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/video/${selectedVideo.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVideos();
      addNotification(`Відео "${selectedVideo.title}" видалено`, 'success');
    } catch (error) {
      console.error('Помилка при видаленні відео:', error);
      addNotification('Не вдалося видалити відео', 'error');
    } finally {
      setDeleteModalOpen(false);
    }
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
    <div className="portal-body column gap-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-color mt-3 text-4xl font-bold">🎥 Відео</h2>
        {isAdmin && (
          <button
            className="bg-custom-green mt-5 hover:bg-custom-green-dark text-white font-semibold text-lg px-3 py-2 rounded-lg flex items-center gap-3"
            onClick={() => setAddModalOpen(true)}
          >
            <FaPlus size={20} /> Додати відео
          </button>
        )}
      </div>

      {/* Search */}
      <div className="row gap-14 align-center" style={{ marginBottom: '5px' }}>
        <div className="row align-center gap-7 search-box" style={{
          flex: 1,
          background: 'white',
          padding: '8px 12px',
          borderRadius: '10px',
          border: '1px dashed #ccc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <FaSearch className="text-grey" style={{ fontSize: '20px' }} />
          <input
            type="text"
            placeholder="Пошук за назвою або описом..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontWeight: '400',
              padding: '8px 0'
            }}
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ border: '1px dashed #ccc', marginBottom: '10px' }}></div>

      {/* Videos List */}
      {loading ? (
        <div className="align-center column" style={{ padding: '50px' }}>
          <div className="loader"></div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="align-center column" style={{ padding: '50px' }}>
          <div className="text-grey">{searchQuery ? 'Відео не знайдено' : 'Відео ще немає'}</div>
        </div>
      ) : (
        <div className="column gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id} className="claim-item row align-center space-between p-4 border rounded-lg shadow-sm bg-white">
              <div className="flex-1 column gap-2">
                <p className="font-semibold text-lg">{video.title}</p>
                {video.description && <p className="text-gray-700 text-sm">{video.description}</p>}
                <iframe
                  className="w-full aspect-video rounded-md"
                  src={getEmbedUrl(video.url)}
                  title={video.title}
                  allowFullScreen
                ></iframe>
                <p className="text-sm text-gray-600 mt-1">Дата: {formatDate(video.created_at)}</p>
              </div>

              {isAdmin && (
                <div className="row gap-4 align-center">
                  <button
                    onClick={() => navigate(`/videos/edit/${video.id}`)}
                    className="button background-warning row gap-2 align-center text-sm"
                  >
                    ✏️ Редагувати
                  </button>
                  <button
                    onClick={() => handleDeleteClick(video)}
                    className="button background-danger row gap-2 align-center text-sm"
                  >
                    🗑 Видалити
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
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

      {/* Add Video Modal */}
      {addModalOpen && (
        <div className="file-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="file-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Додати відео</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                <FaTimes />
              </button>
            </div>

            <form className="column gap-4" onSubmit={handleAddVideo}>
              <label className="column gap-1">
                <span>Назва відео</span>
                <input
                  type="text"
                  className="file-input p-2 border rounded"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                />
              </label>

              <label className="column gap-1">
                <span>Посилання на YouTube</span>
                <input
                  type="url"
                  className="file-input p-2 border rounded"
                  value={newVideo.url}
                  onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                />
              </label>

              <label className="column gap-1">
                <span>Опис (необов'язково)</span>
                <textarea
                  className="file-input p-2 border rounded"
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                />
              </label>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  className="file-btn-cancel px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  onClick={() => setAddModalOpen(false)}
                >
                  ✕ Скасувати
                </button>
                <button
                  type="submit"
                  className="file-btn-save px-4 py-2 rounded bg-[#76b448] hover:bg-[#5f9037] text-white font-semibold"
                >
                  {loadingAdd ? <div className="loader-small"></div> : '💾 Додати'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
