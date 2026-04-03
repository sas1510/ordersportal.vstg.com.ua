import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../api/axios";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../hooks/useNotification";
import "./EmergencyContactsPage.css";

const EmergencyContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const { user, role } = useAuthGetRole();
  const { addNotification } = useNotification();

  // const role = localStorage.getItem('role');
  // const isAdmin = role === 'admin';
  const isAdmin = role === "admin";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    telegramId: "",
    department: "",
  });

  const [deleteContactId, setDeleteContactId] = useState(null); // для модалки видалення
  const [isSending, setIsSending] = useState(false);


    const fetchContacts = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/contacts/");
      setContacts(response.data);
    } catch (error) {
      console.error("Помилка при отриманні контактів:", error);
      addNotification("Не вдалося отримати список контактів", "error");
    }
  }, [addNotification]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);



  const openEditModal = (contact) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.contact_name,
      phone: contact.phone,
      email: contact.email,
      telegramId: contact.telegram_id || "",
      department: contact.department,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSending) {
      setEditingContact(null);
      setDeleteContactId(null);
      setIsModalOpen(false);
      setNewContact({
        name: "",
        phone: "",
        email: "",
        telegramId: "",
        department: "",
      });
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    const { name, phone, email, telegramId, department } = newContact;
    if (!name || !phone || !email || !department) {
      return addNotification("Заповніть всі обов'язкові поля", "warning");
    }

    setIsSending(true);
    const payload = {
      contact_name: name,
      phone,
      email,
      telegram_id: telegramId,
      department,
    };

    try {
      let updatedContact;
      if (editingContact) {
        const response = await axiosInstance.put(
          `/contacts/${editingContact.id}/`,
          payload,
        );
        updatedContact = response.data;
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? updatedContact : c)),
        );
        addNotification("✅ Контакт оновлено", "success");
      } else {
        const response = await axiosInstance.post("/contacts/", payload);
        updatedContact = response.data;
        setContacts((prev) => [...prev, updatedContact]);
        addNotification("✅ Контакт додано", "success");
      }
      closeModal();
    } catch (error) {
      console.error("Помилка при збереженні контакту:", error);
      addNotification("❌ Не вдалося зберегти контакт", "error");
    } finally {
      setIsSending(false);
    }
  };

  const openDeleteModal = (contactId) => {
    setDeleteContactId(contactId);
  };

  const handleDeleteContact = async () => {
    if (!deleteContactId) return;
    setIsSending(true);
    try {
      await axiosInstance.delete(`/contacts/${deleteContactId}/`);
      setContacts((prev) => prev.filter((c) => c.id !== deleteContactId));
      addNotification("✅ Контакт видалено", "success");
      closeModal();
    } catch (error) {
      console.error("Помилка при видаленні контакту:", error);
      addNotification("❌ Не вдалося видалити контакт", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleCallContact = async (contactId) => {
    if (!contactId || isSending) return;
    setIsSending(true);
    addNotification("Повідомлення надсилається...", "info");
    try {
      const payload = {
        contact_id: contactId,
        client_name:
          user?.full_name || user?.username || "Невідомий користувач",
      };
      await axiosInstance.post("/urgent-call/", payload);
      addNotification("Повідомлення надіслано", "success");
    } catch (error) {
      console.error("Помилка при надсиланні повідомлення:", error);
      addNotification("Не вдалося надіслати повідомлення", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="emergency-portal-body">
      <h1 className="text-color mt-3 text-4xl font-bold pb-0">
        Контакти для термінового дзвінка
      </h1>
      <div style={{ border: "1px dashed #ccc", marginBottom: "5px" }}></div>

      <div className="space-y-6">
        {contacts.length === 0 && (
          <p className="text-center text-gray-500">Контакти не знайдені.</p>
        )}
        {contacts.map((contact) => (
          <div key={contact.id} className="emergency-contact-item">
            <div className="emergency-column">
              <div className="emergency-text-info">{contact.contact_name}</div>
              <div className="emergency-text-grey flex items-center gap-2">
                <span className="text-red-500 text-lg">📞</span>{" "}
                {contact.phone || "-"}
              </div>
              <div className="emergency-text-grey flex items-center gap-2">
                <span className="text-blue-500 text-lg">✉️</span>{" "}
                {contact.email || "-"}
              </div>
              <div className="emergency-text-grey italic text-sm flex items-center gap-2">
                <span className="text-green-500 text-lg">🧩</span>{" "}
                {contact.department || "-"}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCallContact(contact.id)}
                className="emergency-button-call"
                disabled={isSending}
              >
                Терміново зателефонувати
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => openEditModal(contact)}
                    className="emerg-btn-save"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => openDeleteModal(contact.id)}
                    className="emerg-btn-cancel"
                  >
                    Видалити
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модал додавання/редагування */}
      {isModalOpen && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div
            className="video-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <h3>
                {editingContact
                  ? "✏️ Редагування контакту"
                  : "➕ Додати контакт"}
              </h3>
              <button className="video-close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>
            <form className="video-form" onSubmit={handleSaveContact}>
              <div className="modal-field">
                <input
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  placeholder="Ім'я"
                  required
                  className="video-input"
                />
              </div>
              <div className="modal-field">
                <input
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                  placeholder="Телефон"
                  required
                  className="video-input"
                />
              </div>
              <div className="modal-field">
                <input
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                  placeholder="Email"
                  type="email"
                  required
                  className="video-input"
                />
              </div>
              <div className="modal-field">
                <input
                  value={newContact.telegramId}
                  onChange={(e) =>
                    setNewContact({ ...newContact, telegramId: e.target.value })
                  }
                  placeholder="Telegram ID"
                  className="video-input"
                />
              </div>
              <div className="modal-field">
                <input
                  value={newContact.department}
                  onChange={(e) =>
                    setNewContact({ ...newContact, department: e.target.value })
                  }
                  placeholder="Відділ"
                  required
                  className="video-input"
                />
              </div>
              <div className="video-modal-footer">
                <button
                  type="button"
                  className="video-btn-cancel"
                  onClick={closeModal}
                >
                  ✕ Скасувати
                </button>
                <button type="submit" className="video-btn-save">
                  {isSending
                    ? "Зберігаю..."
                    : editingContact
                      ? "💾 Оновити"
                      : "💾 Додати"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модал видалення */}
      {deleteContactId && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div
            className="video-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <h3>⚠️ Підтвердження видалення</h3>
              <button className="video-close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>
            <p className="p-4 text-center">
              Ви впевнені, що хочете видалити контакт?
            </p>
            <div className="video-modal-footer">
              <button
                className="video-btn-cancel"
                onClick={closeModal}
                disabled={isSending}
              >
                ✕ Відмінити
              </button>
              <button
                className="video-btn-save"
                onClick={handleDeleteContact}
                disabled={isSending}
              >
                {isSending ? "Видаляю..." : "✅ Видалити"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyContactsPage;
