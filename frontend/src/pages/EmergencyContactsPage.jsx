import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../api/axios";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { useNotification } from "../hooks/useNotification";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslation } from "react-i18next"; // Додано хук перекладу
import AutoTranslatedText from "../components/AutoTranslatedText";
import "./EmergencyContactsPage.css";



const EmergencyContactsPage = () => {
  const { t } = useTranslation(); // Використовуємо t()
  const [contacts, setContacts] = useState([]);
  const { user, role } = useAuthGetRole();
  const { addNotification } = useNotification();
  const [telegramContact, setTelegramContact] = useState(null);

  

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

  const [deleteContactId, setDeleteContactId] = useState(null); 
  const [isSending, setIsSending] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/contacts/");
      setContacts(response.data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching contacts:", error);
      }
      addNotification(t("emergency.notifications.fetch_error"), "error");
    }
  }, [addNotification, t]);

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
    const { name, phone, email, department } = newContact;
    if (!name || !phone || !email || !department) {
      return addNotification(t("emergency.notifications.fill_required"), "warning");
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
        addNotification(t("emergency.notifications.updated"), "success");
      } else {
        const response = await axiosInstance.post("/contacts/", payload);
        updatedContact = response.data;
        setContacts((prev) => [...prev, updatedContact]);
        addNotification(t("emergency.notifications.added"), "success");
      }
      closeModal();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving contact:", error);
      }
      addNotification(t("emergency.notifications.save_error"), "error");
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
      addNotification(t("emergency.notifications.deleted"), "success");
      closeModal();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting contact:", error);
      }
      addNotification(t("emergency.notifications.delete_error"), "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleCallContact = async (contactId) => {
    if (!contactId || isSending) return;
    setIsSending(true);
    addNotification(t("emergency.notifications.sending_call"), "info");
    try {
      const payload = {
        contact_id: contactId,
        client_name:
          user?.full_name || user?.username || t("emergency.unknown_user"),
      };
      await axiosInstance.post("/urgent-call/", payload);
      addNotification(t("emergency.notifications.call_sent"), "success");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error calling contact:", error);
      }
      addNotification(t("emergency.notifications.call_error"), "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="emergency-portal-body items-center ">
      <div className="w-full max-w-[1334px]">
        <h1 className="text-color mt-6 text-4xl font-bold pb-0">
          {t("emergency.page_title")}
        </h1>
        <div style={{ border: "1px dashed #ccc", marginBottom: "5px" }}></div>

        <div className="space-y-6">
          {contacts.length === 0 && (
            <p className="text-center text-gray-500">{t("emergency.no_contacts")}</p>
          )}
          {contacts.map((contact) => (
            <div key={contact.id} className="emergency-contact-item">
              <div className="emergency-column">
                <div className="emergency-text-info">{contact.contact_name}</div>
                <div className="emergency-text-grey flex items-center gap-2">
                  <span className="text-red-500 text-lg"><i className="fa fa-phone" aria-hidden="true"></i></span>
                  {contact.phone || "-"}
                </div>
                <div className="emergency-text-grey flex items-center gap-2">
                  <span className="text-blue-500 text-lg"><i className="fa fa-envelope" aria-hidden="true"></i></span>
                  {contact.email || "-"}
                </div>
                <div className="emergency-text-grey italic text-sm flex items-center gap-2">
                  <span className="text-green-500 text-lg"><i className="fa fa-building" aria-hidden="true"></i> </span>
                  {contact.department ? (
                    <AutoTranslatedText text={contact.department} />
                  ) : (
                    "-"
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCallContact(contact.id)}
                  className="emergency-button-call"
                  disabled={isSending}
                >
                  {t("emergency.actions.call")}
                </button>

                {isAdmin && (
                  <>
                    <button onClick={() => openEditModal(contact)} className="emerg-btn-save">
                      {t("common.edit")}
                    </button>
                    <button onClick={() => openDeleteModal(contact.id)} className="emerg-btn-cancel">
                      {t("common.delete")}
                    </button>
                    <button
                      onClick={() => setTelegramContact(contact)}
                      className="emerg-btn-save"
                      style={{ backgroundColor: '#0088cc', color: '#fff' }}
                    >
                      {t("emergency.actions.connect_telegram")}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Модал додавання/редагування */}
        {isModalOpen && (
          <div className="emergy-modal-overlay" onClick={closeModal}>
            <div className="emergy-modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="emergy-modal-header mb-4">
                <h3>
                  {editingContact ? `✏️ ${t("emergency.modal.edit_title")}` : `➕ ${t("emergency.modal.add_title")}`}
                </h3>
                <button className="emergy-close-btn" onClick={closeModal}>✕</button>
              </div>
              <form className="video-form" onSubmit={handleSaveContact}>
                <div className="modal-field">
                  <input
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder={t("emergency.modal.placeholder_name")}
                    required
                    className="video-input"
                  />
                </div>
                <div className="modal-field">
                  <input
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder={t("emergency.modal.placeholder_phone")}
                    required
                    className="video-input"
                  />
                </div>
                <div className="modal-field">
                  <input
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="Email"
                    type="email"
                    required
                    className="video-input"
                  />
                </div>
                <div className="modal-field">
                  <input
                    value={newContact.telegramId}
                    onChange={(e) => setNewContact({ ...newContact, telegramId: e.target.value })}
                    placeholder="Telegram ID"
                    className="video-input"
                  />
                </div>
                <div className="modal-field">
                  <input
                    value={newContact.department}
                    onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                    placeholder={t("emergency.modal.placeholder_dept")}
                    required
                    className="video-input"
                  />
                </div>
                <div className="emergy-modal-footer">
                  <button type="button" className="emergency-btn-cancel" onClick={closeModal}>
                    ✕ {t("common.cancel")}
                  </button>
                  <button type="submit" className="emergency-btn-confirm ml-4">
                    {isSending ? t("common.saving") : editingContact ? t("common.update") : t("common.add")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Telegram QR Modal */}
        {telegramContact && (
          <div className="emergy-modal-overlay" onClick={() => setTelegramContact(null)}>
            <div className="emergy-modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="emergy-modal-header">
                <h3>{t("emergency.telegram.title")}</h3>
                <button className="video-close-btn" onClick={() => setTelegramContact(null)}>✕</button>
              </div>
              <div className="p-4 flex flex-col items-center gap-4">
                <QRCodeCanvas value={`https://t.me/ViknaStyleNotificationsBot?start=reg${telegramContact.id}`} size={200} />
                <p className="text-center text-sm text-gray-600">{t("emergency.telegram.scan_qr")}</p>
                <a
                  href={`https://t.me/ViknaStyleNotificationsBot?start=reg${telegramContact.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="emerg-btn-save"
                  style={{ textAlign: "center", width: "100%" }}
                >
                  {t("emergency.actions.connect_telegram")}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Модал видалення */}
        {deleteContactId && (
          <div className="emergy-modal-overlay" onClick={closeModal}>
            <div className="emergy-modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="emergy-modal-header">
                <h3>{t("emergency.modal.delete_confirm_title")}</h3>
                <button className="emergy-close-btn" onClick={closeModal}>✕</button>
              </div>
              <p className="p-4 text-center">{t("emergency.modal.delete_confirm_text")}</p>
              <div className="emergy-modal-footer">
                <button className="emergency-btn-cancel" onClick={closeModal} disabled={isSending}>
                  ✕ {t("common.cancel")}
                </button>
                <button className="emergency-btn-confirm ml-4" onClick={handleDeleteContact} disabled={isSending}>
                  {isSending ? t("common.deleting") : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyContactsPage;