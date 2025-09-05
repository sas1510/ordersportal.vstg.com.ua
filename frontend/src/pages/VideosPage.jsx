import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7019';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('access');
  const navigate = useNavigate();

  const isAdmin = role === 'Admin';

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axiosInstance.get(`/videos/`);
      setVideos(res.data);
    } catch (error) {
      console.error('Помилка завантаження відео:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Ви впевнені, що хочете видалити відео?')) return;

    try {
      await axiosInstance.delete(`/videos/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVideos();
    } catch (error) {
      console.error('Помилка при видаленні відео:', error);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-md mt-8">
      <h2 className="text-3xl font-bold mb-6 text-[#003d66] border-b border-[#003d66] pb-2">
        🎥 Відео
      </h2>

      {isAdmin && (
        <div className="mb-6">
          <Link
            to="/videos/add"
            className="inline-block bg-[#003d66] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#00509e] transition-colors duration-300"
          >
            ➕ Додати відео
          </Link>
        </div>
      )}

      <ul className="space-y-6">
        {videos.map((video) => (
          <li
            key={video.id}
            className="p-4 border border-gray-300 rounded-lg bg-white shadow flex flex-col gap-4"
          >
            <p className="font-semibold text-lg">{video.title}</p>

            <iframe
              className="w-full aspect-video rounded-md"
              src={getEmbedUrl(video.youtubeUrl)}
              title={video.title}
              allowFullScreen
            ></iframe>

            <p className="text-sm text-gray-600">Дата: {formatDate(video.createdAt)}</p>

            {isAdmin && (
              <div className="flex gap-6">
                <button
                  onClick={() => navigate(`/videos/edit/${video.id}`)}
                  className="text-yellow-600 hover:underline text-sm font-semibold"
                >
                  ✏️ Редагувати
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="text-red-600 hover:underline text-sm font-semibold"
                >
                  🗑 Видалити
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
