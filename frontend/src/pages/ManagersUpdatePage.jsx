import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7019';

export default function ManagersUpdatePage() {
  const navigate = useNavigate();
  const [organization, setOrganization] = useState('');
  const [updateManagers, setUpdateManagers] = useState(true);
  const [updateRegionalManagers, setUpdateRegionalManagers] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      organization,
      updateManagers,
      updateRegionalManagers
    };

    try {
      await axiosInstance.post(`${API_URL}/api/managers/update`, payload);
      alert('Менеджери успішно оновлені!');
      navigate('/dashboard'); // або куди треба
    } catch (error) {
      console.error('Помилка при оновленні менеджерів:', error);
      alert('Сталася помилка при оновленні менеджерів. Перевірте консоль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-50 mt-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-[#003d66] border-b border-[#003d66] pb-2">
        🔄 Оновлення менеджерів з 1С
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Організація"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d66]"
        />

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="updateManagers"
            checked={updateManagers}
            onChange={(e) => setUpdateManagers(e.target.checked)}
            className="h-5 w-5 text-[#003d66] focus:ring-[#003d66] border-gray-300 rounded"
          />
          <label htmlFor="updateManagers" className="text-gray-700 font-medium">
            Оновити менеджерів
          </label>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="updateRegionalManagers"
            checked={updateRegionalManagers}
            onChange={(e) => setUpdateRegionalManagers(e.target.checked)}
            className="h-5 w-5 text-[#003d66] focus:ring-[#003d66] border-gray-300 rounded"
          />
          <label htmlFor="updateRegionalManagers" className="text-gray-700 font-medium">
            Оновити регіональних менеджерів та їх зв'язки
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#003d66] flex-grow text-white px-6 py-3 rounded-md font-semibold hover:bg-[#00509e] transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? 'Оновлення...' : 'Запустити оновлення'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="bg-gray-400 text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-600 transition-colors duration-300"
          >
            Назад
          </button>
        </div>
      </form>
    </div>
  );
}
