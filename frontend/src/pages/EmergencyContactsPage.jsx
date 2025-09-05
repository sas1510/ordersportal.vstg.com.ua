import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const EmergencyContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const { user } = useAuth();

  // Для модального вікна
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axiosInstance.get('/contact/');
      setContacts(response.data);
    } catch (error) {
      console.error('Помилка при отриманні контактів:', error);
      toast.error('Не вдалося отримати список контактів');
    }
  };

  const openModal = (contactId) => {
    setSelectedContactId(contactId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedContactId(null);
    setIsModalOpen(false);
  };

  const handleConfirmCall = async () => {
    if (!selectedContactId) return;

    try {
      const payload = {
        contactId: selectedContactId,
        clientName: user?.first_last_name || user?.username || 'Невідомий користувач',
        clientPhone: user?.phone || 'Номер не вказано',
      };

      await axiosInstance.post('/UrgentCall/', payload);
      toast.success('Повідомлення надіслано');
      closeModal();
    } catch (error) {
      console.error('Помилка при надсиланні повідомлення:', error);
      toast.error('Не вдалося надіслати повідомлення');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      <h1 className="text-3xl font-extrabold text-[#003d66] mb-8 border-b-2 border-blue-300 pb-2">
        Контакти для термінового дзвінка
      </h1>

      <div className="space-y-6">
        {contacts.length === 0 && (
          <p className="text-center text-gray-500">Контакти не знайдені.</p>
        )}
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="bg-white shadow-md rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center transition-transform hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="mb-4 md:mb-0 space-y-1">
              <div className="text-xl font-semibold text-[#003d66]">{contact.name}</div>
              <div className="text-gray-700 flex items-center gap-2">
                <span className="text-red-500 text-lg">📞</span> {contact.phone}
              </div>
              <div className="text-gray-700 flex items-center gap-2">
                <span className="text-blue-500 text-lg">✉️</span> {contact.email}
              </div>
              <div className="text-gray-600 italic text-sm flex items-center gap-2">
                <span className="text-green-500 text-lg">🧩</span> {contact.department}
              </div>
            </div>
            <button
              onClick={() => openModal(contact.id)}
              className="self-stretch md:self-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-300"
            >
              Терміново зателефонувати
            </button>
          </div>
        ))}
      </div>

      {/* Модальне вікно */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal} // закриття при кліку поза модалом
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()} // щоб клік в модалі не закривав її
          >
            <h2 className="text-xl font-semibold mb-4 text-center text-[#003d66]">Підтвердження</h2>
            <p className="mb-6 text-center">Ви впевнені, що хочете терміново зателефонувати?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleConfirmCall}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Так, підтверджую
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Відмінити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// const departmentName = (key) => {
//   const map = {
//     sales: 'Відділ продажів',
//     service: 'Відділ сервісу',
//     logistics: 'Відділ логістики',
//   };
//   return map[key] || 'Інший відділ';
// };

export default EmergencyContactsPage;
