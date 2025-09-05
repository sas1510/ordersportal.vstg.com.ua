import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7019';

export default function FilesPage() {
  const [documents, setDocuments] = useState([]);
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('access');
  const navigate = useNavigate();

  const isAdmin = role === 'Admin';

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axiosInstance.get(`/documents/`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Помилка завантаження документів:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Ви впевнені, що хочете видалити файл?')) return;

    try {
      await axiosInstance.delete(`/documents/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDocuments();
    } catch (error) {
      console.error('Помилка при видаленні:', error);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-md min-h-[80vh] mt-8">
      <h2 className="text-3xl font-bold mb-6 text-[#003d66] border-b border-[#003d66] pb-2">
        📑 Файли
      </h2>

      {isAdmin && (
        <div className="mb-6">
          <Link
            to="/files/add"
            className="inline-block bg-[#003d66] hover:bg-[#00509e] text-white font-semibold px-6 py-3 rounded-md transition-colors duration-300"
          >
            ➕ Додати файл
          </Link>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-gray-600 text-center">Файлів поки що немає.</p>
      ) : (
        <ul className="space-y-6">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="p-5 border border-gray-300 rounded-lg bg-white shadow hover:shadow-lg transition-shadow duration-300 flex justify-between items-start"
            >
              <div className="max-w-[70%]">
                <p className="font-semibold text-[#003d66] text-lg">{doc.title}</p>
                <a
                  href={`${API_URL}/documents/${doc.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Відкрити файл
                </a>
                <p className="text-gray-500 mt-1 text-sm">
                  Автор: {doc.authorUsername || 'Невідомо'}
                </p>
                <p className="text-gray-500 text-sm">
                  Дата: {formatDate(doc.createdAt)}
                </p>
              </div>

              {isAdmin && (
                <div className="flex gap-6 mt-1">
                  <button
                    onClick={() => navigate(`/files/edit/${doc.id}`)}
                    className="text-yellow-600 hover:text-yellow-800 text-sm font-semibold"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    Видалити
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
