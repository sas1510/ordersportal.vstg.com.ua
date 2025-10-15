import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../components/notification/Notifications'; // підключаємо твій NotificationProvider
import './EmergencyContactsPage.css';

const EmergencyContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const { user } = useAuth();
  const { addNotification } = useNotification(); // хук для повідомлень

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axiosInstance.get('/contacts/');
      setContacts(response.data);
    } catch (error) {
      console.error('Помилка при отриманні контактів:', error);
      addNotification('Не вдалося отримати список контактів', 'error');
    }
  };

  const openModal = (contactId) => {
    setSelectedContactId(contactId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSending) {
      setSelectedContactId(null);
      setIsModalOpen(false);
    }
  };

  const handleConfirmCall = async () => {
    if (!selectedContactId || isSending) return;

    setIsSending(true);
    addNotification('Повідомлення надсилається...', 'info');

    try {
      const payload = {
        contact_id: selectedContactId,
        client_name: user?.full_name || user?.username || 'Невідомий користувач',
      };

      await axiosInstance.post('/urgent-call/', payload);

      addNotification('Повідомлення надіслано', 'success');
      closeModal();
    } catch (error) {
      console.error('Помилка при надсиланні повідомлення:', error);
      addNotification('Не вдалося надіслати повідомлення', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="emergency-portal-body">
      <h1 className="text-color mt-3 text-4xl font-bold pb-0">
        Контакти для термінового дзвінка
      </h1>
      <div style={{ border: '1px dashed #ccc', marginBottom: '5px' }}></div>
      <div className="space-y-6">
        {contacts.length === 0 && (
          <p className="text-center text-gray-500">Контакти не знайдені.</p>
        )}
        {contacts.map((contact) => (
          <div key={contact.id} className="emergency-contact-item">
            <div className="emergency-column">
              <div className="emergency-text-info">{contact.contact_name}</div>
              <div className="emergency-text-grey flex items-center gap-2">
                <span className="text-red-500 text-lg">📞</span> {contact.phone || '-'}
              </div>
              <div className="emergency-text-grey flex items-center gap-2">
                <span className="text-blue-500 text-lg">✉️</span> {contact.email || '-'}
              </div>
              <div className="emergency-text-grey italic text-sm flex items-center gap-2">
                <span className="text-green-500 text-lg">🧩</span> {contact.department || '-'}
              </div>
            </div>
            <button
              onClick={() => openModal(contact.id)}
              className="emergency-button-call"
              disabled={isSending}
            >
              Терміново зателефонувати
            </button>
          </div>
        ))}
      </div>

      {/* Модальне вікно */}
      {isModalOpen && (
        <div className="emergency-modal-overlay" onClick={closeModal}>
          <div className="emergency-modal-window" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4 text-center text-[#003d66]">
              Підтвердження
            </h2>
            <p className="mb-6 text-center">
              Ви впевнені, що хочете терміново зателефонувати?
            </p>
            <div className="emergency-modal-footer">
              <button
                onClick={handleConfirmCall}
                className="emergency-btn-confirm"
                disabled={isSending}
              >
                {isSending ? 'Надсилається...' : 'Так, підтверджую'}
              </button>
              <button
                onClick={closeModal}
                className="emergency-btn-cancel"
                disabled={isSending}
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

export default EmergencyContactsPage;
