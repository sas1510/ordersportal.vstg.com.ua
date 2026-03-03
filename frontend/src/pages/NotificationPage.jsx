import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
// Додаємо іконки для типів відео
import { FaPlus, FaSearch, FaEdit, FaTrash, FaYoutube, FaTiktok } from 'react-icons/fa';
import { useNotification } from '../components/notification/Notifications';
import ConfirmModal from '../components/Orders/ConfirmModal';
import './Videos.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';

const NotificationPage = () => {
//   const [videos, setVideos] = useState([]);
//   const [filteredVideos, setFilteredVideos] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [addModalOpen, setAddModalOpen] = useState(false);
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [loadingSave, setLoadingSave] = useState(false);
//   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
//   const [selectedVideo, setSelectedVideo] = useState(null);

//   const { user, role } = useAuth();
//   const isAdmin = role === "admin";

//   // Форма тепер містить resource_type
//   const [videoForm, setVideoForm] = useState({ 
//     title: '', 
//     url: '', 
//     description: '', 
//     resource_type: 'youtube' // 'youtube' як тип за замовчуванням
//   });

//   const { theme } = useTheme();
//   const isDark = theme === "dark";

//    const darkStyles = {
//         searchBoxBg: '#333333',
//         searchBoxBorder: '1px dashed #555555',
//         searchBoxShadow: '0 2px 8px rgba(0,0,0,0.4)',
//         iconColor: '#aaaaaa',
//         delimiterBorder: '1px dashed #555',
//         fileItemBg: '#2c2c2c',
//         fileItemBorder: '1px solid #444',
//         fileItemShadow: '0 4px 12px rgba(0,0,0,0.3)',
//         lightTextColor: '#f0f0f0', 
//         lightGreyColor: '#aaa',     
//     };


//   const { addNotification } = useNotification();

//   useEffect(() => { fetchVideos(); }, []);

//   useEffect(() => {
//     if (searchQuery.trim()) {
//       const filtered = videos.filter(v =>
//         v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         v.description?.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//       setFilteredVideos(filtered);
//     } else setFilteredVideos(videos);
//   }, [searchQuery, videos]);

//   const fetchVideos = async () => {
//     setLoading(true);
//     try {
//       // !!! ЗМІНЕНО: Новий URL з фільтром для типів 'youtube' та 'tiktok'
//       const res = await axiosInstance.get('/media-resources/?types=youtube,tiktok');
      
//       // (Видалено явну передачу 'token', оскільки axiosInstance має це робити)
//       const data = Array.isArray(res.data) ? res.data : res.data.results || [];
//       setVideos(data);
//       setFilteredVideos(data);
//     } catch {
//       addNotification('Помилка завантаження відео', 'error');
//     } finally { setLoading(false); }
//   };

//   // ====================== Додавання / Редагування ======================
//   const handleSaveVideo = async (e) => {
//     e.preventDefault();
//     if (!videoForm.title || !videoForm.url)
//       return addNotification('Заповніть поля "Назва" та "Посилання"', 'error');

//     setLoadingSave(true);
    
//     // 'videoForm' вже містить всі дані, включно з resource_type
//     const payload = videoForm; 

//     try {
//       if (editModalOpen) {
//         // 🔹 Редагування (!!! ЗМІНЕНО: URL та метод PUT -> PATCH)
//         await axiosInstance.patch(`/media-resources/${selectedVideo.id}/`, payload);
//         addNotification('Відео оновлено успішно!', 'success');
//       } else {
//         // 🔹 Додавання (!!! ЗМІНЕНО: URL)
//         // 'payload' вже містить 'resource_type' з форми
//         await axiosInstance.post('/media-resources/', payload);
//         addNotification('Відео додано успішно!', 'success');
//       }
//       setAddModalOpen(false);
//       setEditModalOpen(false);
//       fetchVideos();
//       // Скидаємо форму до значень за замовчуванням
//       setVideoForm({ title: '', url: '', description: '', resource_type: 'youtube' });
//     } catch {
//       addNotification('Помилка при збереженні відео', 'error');
//     } finally { setLoadingSave(false); }
//   };

//   // ====================== Видалення ======================
//   const handleDeleteClick = (video) => { setSelectedVideo(video); setDeleteModalOpen(true); };
//   const handleDeleteConfirm = async () => {
//     try {
//       // !!! ЗМІНЕНО: URL
//       await axiosInstance.delete(`/media-resources/${selectedVideo.id}/`);
//       fetchVideos();
//       addNotification(`Відео "${selectedVideo.title}" видалено`, 'success');
//     } catch {
//       addNotification('Не вдалося видалити відео', 'error');
//     } finally { setDeleteModalOpen(false); }
//   };

//   const openEditModal = (video) => {
//     setSelectedVideo(video);
//     // Заповнюємо форму даними з обраного відео
//     setVideoForm({
//       title: video.title || '',
//       url: video.url || '',
//       description: video.description || '',
//       resource_type: video.resource_type // Зберігаємо тип
//     });
//     setEditModalOpen(true);
//   };

//   const openAddModal = () => {
//     // Скидаємо форму до чистих значень
//     setSelectedVideo(null);
//     setVideoForm({ title: '', url: '', description: '', resource_type: 'youtube' });
//     setAddModalOpen(true);
//   }

//   const formatDate = (isoString) => {
//     // Поле 'created_at' з нової моделі
//     if (!isoString) return 'Невідомо';
//     return new Date(isoString).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
//   };

//   const getEmbedUrl = (video) => {
//     // !!! ЗМІНЕНО: Розумна функція, що обробляє YouTube та TikTok
//     if (!video || !video.url) return '';
    
//     try {
//       const url = new URL(video.url);

//       if (video.resource_type === 'youtube') {
//         let videoId;
//         if (url.hostname === 'youtu.be') {
//           videoId = url.pathname.slice(1);
//         } else {
//           videoId = url.searchParams.get('v');
//         }
//         return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
//       }

//       if (video.resource_type === 'tiktok') {
//         const match = video.pathname.match(/video\/(\d+)/);
//         const videoId = match ? match[1] : null;
//         return videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : '';
//       }

//     } catch (e) {
//       console.error("Недійсний URL:", e);
//       return '';
//     }
    
//     return '';
//   };

//   const getVideoIcon = (resourceType) => {
//     if (resourceType === 'youtube') {
//       return <FaYoutube className="text-red-500" />;
//     }
//     if (resourceType === 'tiktok') {
//       return <FaTiktok className="text-black" />;
//     }
//     return '🎥';
//   }

  return (
    <div className="videos-body column gap-14">
    <h2>Notification</h2>
    </div>
  );
};

export default NotificationPage;