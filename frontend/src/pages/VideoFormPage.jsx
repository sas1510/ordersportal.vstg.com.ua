import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7019';

export default function VideoFormPage() {
  const { id } = useParams(); // якщо id є — редагування
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchVideo(id);
    }
  }, [id]);

  const fetchVideo = async (videoId) => {
    try {
      const res = await axiosInstance.get(`${API_URL}/api/videos/${videoId}/`);
      setTitle(res.data.title);
      setUrl(res.data.youtubeUrl);
    } catch (error) {
      console.error('Помилка при завантаженні відео:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { title, youtubeUrl: url };

    try {
      if (isEditMode) {
        await axiosInstance.put(`${API_URL}/api/videos/${id}/`, payload);
      } else {
        await axiosInstance.post(`${API_URL}/api/videos/`, payload);
      }
      navigate('/videos');
    } catch (error) {
      console.error('Помилка при збереженні відео:', error);
      alert('Сталася помилка при збереженні відео. Перевірте консоль.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-50 mt-8 rounded-lg shadow-md ">
      <h2 className="text-3xl font-bold mb-6 text-[#003d66] border-b border-[#003d66] pb-2">
        {isEditMode ? '✏️ Редагувати відео' : '➕ Додати відео'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="YouTube URL"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-[#003d66] flex-grow text-white px-6 py-3 rounded-md font-semibold hover:bg-[#00509e] transition-colors duration-300"
          >
            {isEditMode ? 'Зберегти зміни' : 'Додати відео'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/videos')}
            className="bg-gray-400 text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-600 transition-colors duration-300"
          >
            Назад
          </button>
        </div>
      </form>
    </div>
  );
}
