import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [contactToDelete, setContactToDelete] = useState(null);
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const canEdit = ["Admin", "керівник", "регіональний менеджер"].includes(role);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = () => {
    axiosInstance
      .get("/contact")
      .then((res) => setContacts(res.data))
      .catch((err) => console.error("Помилка завантаження контактів:", err));
  };

  const confirmDelete = (contact) => {
    setContactToDelete(contact);
  };

  const handleDelete = () => {
    if (!contactToDelete) return;

    axiosInstance
      .delete(`/contact/${contactToDelete.id}`)
      .then(() => {
        setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
        setContactToDelete(null);
      })
      .catch((err) => {
        console.error("Помилка видалення контакту:", err);
        setContactToDelete(null);
      });
  };

  const cancelDelete = () => {
    setContactToDelete(null);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 px-6 py-8 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-[#003d66]  border-b border-[#003d66] pb-2">
        Контакти
      </h2>

      {canEdit && (
        <div className="mb-6">
          <button
            onClick={() => navigate("/contacts/new")}
            className="bg-[#003d66] hover:bg-[#002244] text-white font-semibold py-3 px-6 rounded-md transition-colors duration-300"
          >
            ➕ Додати контакт
          </button>
        </div>
      )}

      <div className="space-y-5">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="p-5 bg-white rounded-lg shadow flex justify-between items-start hover:shadow-lg transition-shadow"
          >
            <div>
              <p className="font-semibold text-lg mb-1">{contact.name}</p>
              <p className="text-sm text-gray-600 mb-1">
                {contact.department || "Інший відділ"}
              </p>
              <p className="text-gray-800 mb-0.5">📞 {contact.phone}</p>
              <p className="text-gray-800 mb-0.5">✉️ {contact.email}</p>
              {contact.telegramId && (
                <p className="text-gray-800">Telegram: {contact.telegramId}</p>
              )}
            </div>

            {canEdit && (
              <div className="flex flex-col gap-2 ml-6">
                <button
                  onClick={() => navigate(`/contacts/${contact.id}/edit`)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-md transition-colors duration-300"
                >
                  Редагувати
                </button>
                <button
                  onClick={() => confirmDelete(contact)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
                >
                  Видалити
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-[#003d66]">
              Підтвердьте видалення
            </h3>
            <p className="mb-6">
              Ви впевнені, що хочете видалити контакт{" "}
              <span className="font-semibold">{contactToDelete.name}</span>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-5 rounded-md transition-colors duration-300"
              >
                Відмінити
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-md transition-colors duration-300"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
