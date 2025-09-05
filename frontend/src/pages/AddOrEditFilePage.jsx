import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axios';

const API_URL = (import.meta.env.VITE_API_URL || 'https://localhost:7019') + '/api';

export default function AddOrEditFilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);

  useEffect(() => {
    if (id) fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await axiosInstance.get(`documents/${id}/`);
      setTitle(res.data.title);
      setExistingFileUrl(`${API_URL.replace('/api', '')}/documents/${res.data.filePath}`);
    } catch (err) {
      console.error('Помилка завантаження документа:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) return alert('Введіть назву документа');

    const formData = new FormData();
    formData.append('title', title);
    if (file) formData.append('file', file);

    try {
      if (id) {
        await axiosInstance.put(`documents/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        if (!file) return alert('Оберіть файл для завантаження');
        await axiosInstance.post('documents/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/files');
    } catch (err) {
      console.error('Помилка збереження:', err);
      alert('Помилка збереження. Перевірте консоль.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-50 mt-8 rounded-lg shadow-md ">
      <h2 className="text-3xl font-bold mb-6 text-[#003d66] border-b border-[#003d66] pb-2">
        {id ? 'Редагувати файл' : 'Додати новий файл'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Назва"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />

        {id && existingFileUrl && (
          <div className="text-sm text-gray-700">
            Поточний файл:{' '}
            <a
              href={existingFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Переглянути
            </a>
          </div>
        )}

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />

        {file && (
          <div className="text-sm text-gray-600 mt-1">
            Обраний файл: <strong>{file.name}</strong>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-[#003d66] flex-grow text-white px-6 py-3 rounded-md font-semibold hover:bg-[#00509e] transition-colors duration-300"
          >
            {id ? 'Оновити' : 'Зберегти'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/files')}
            className="bg-gray-400 text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-600 transition-colors duration-300"
          >
            Назад
          </button>
        </div>
      </form>
    </div>
  );
}
