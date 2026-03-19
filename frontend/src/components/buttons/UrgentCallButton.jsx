import React, { useState } from 'react';
import axiosInstance from "../../api/axios";

const UrgentCallButton = ({ contactId }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleUrgentCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access'); // Токен авторизації
      await axiosInstance.post(
        '/urgent-call-request/',
        { contact_id: contactId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSent(true);
    } catch (err) {
      console.error(err);
      setError('Не вдалося надіслати запит');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2">
      <button
        onClick={handleUrgentCall}
        disabled={loading || sent}
        className="bg-red-600 text-white font-semibold py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
      >
        {sent ? 'Запит надіслано' : '📞 Терміново зателефонувати'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default UrgentCallButton;
