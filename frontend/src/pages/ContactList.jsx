import React, { useEffect, useState } from 'react';
import axiosInstance from "../api/axios";
import UrgentCallButton from './UrgentCallButton';

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('access');
        const response = await axiosInstance.get('/api/contact/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setContacts(response.data);
      } catch (err) {
        console.error(err);
        setError('Не вдалося завантажити контакти');
      }
    };

    fetchContacts();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Контакти</h2>
      {error && <p className="text-red-500">{error}</p>}
      {contacts.map(contact => (
        <div
          key={contact.id}
          className="border rounded p-4 mb-4 shadow flex items-center justify-between"
        >
          <div>
            <p className="font-semibold">{contact.name}</p>
            <p className="text-sm text-gray-600">{contact.phone}</p>
            <p className="text-sm text-gray-600">{contact.email}</p>
          </div>
          <UrgentCallButton contactId={contact.id} />
        </div>
      ))}
    </div>
  );
};

export default ContactList;
