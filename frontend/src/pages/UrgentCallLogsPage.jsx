import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { useNotification } from "../components/notification/Notifications";
import './UrgentCallLogsPage.css';
import { useNavigate } from "react-router-dom";


export default function EmergencyCallLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);

  const { addNotification } = useNotification();

  // ==================== Модал ====================
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    telegramId: "",
    department: "",
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // ==================== Завантаження логів ====================
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);

    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axiosInstance.get("/urgent-call-list/");
      setLogs(response.data);
    } catch (error) {
      console.error("Помилка при завантаженні журналу SOS:", error);
      addNotification("❌ Не вдалося завантажити журнал SOS-викликів", "error");
    }
  };


  // ==================== Фільтрація ====================
  useEffect(() => {
    filterLogs(logs, startDate, endDate, search);
  }, [logs, startDate, endDate, search]);

  const filterLogs = (logsList, start, end, query) => {
    const lowerSearch = query.toLowerCase();
    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end + "T23:59:59") : null;

    const filtered = logsList.filter((log) => {
      const logDate = new Date(log.create_date);

      const afterStart = startDateObj ? logDate >= startDateObj : true;
      const beforeEnd = endDateObj ? logDate <= endDateObj : true;

      const matchesSearch =
        (log.contact_name?.toLowerCase().includes(lowerSearch) || false) ||
        (log.department?.toLowerCase().includes(lowerSearch) || false) ||
        (log.phone?.toLowerCase().includes(lowerSearch) || false) ||
        (log.email?.toLowerCase().includes(lowerSearch) || false) ||
        (log.telegram_id?.toLowerCase().includes(lowerSearch) || false) ||
        new Date(log.created_at || log.sentAt || log.date).toLocaleString().toLowerCase().includes(lowerSearch);

      return afterStart && beforeEnd && matchesSearch;
    });

    setFilteredLogs(filtered);
  };

  // ==================== Додавання / редагування ====================
  const handleSaveContact = async (e) => {
    e.preventDefault();
    const { name, phone, email, telegramId, department } = newContact;
    if (!name || !phone || !email || !department) {
      return addNotification("Заповніть всі обов'язкові поля", "warning");
    }
    setSaving(true);

    const payload = {
      contact_name: name,
      phone,
      email,
      telegram_id: telegramId,
      department,
    };

    try {
      let updatedContact;
      if (editingLog) {
        const response = await axiosInstance.put(`/contacts/${editingLog.id}/`, payload);
        updatedContact = response.data;
        // Оновлюємо локальний стан замість повторного fetch
        setLogs((prev) => prev.map((log) => log.id === editingLog.id ? updatedContact : log));
        addNotification("✅ Контакт успішно оновлено", "success");
      } else {
        const response = await axiosInstance.post("/contacts/", payload);
        updatedContact = response.data;
        setLogs((prev) => [...prev, updatedContact]);
        addNotification("✅ Контакт успішно додано", "success");
      }

      closeModal();
    } catch (error) {
      console.error("Помилка при збереженні контакту:", error);
      addNotification("❌ Помилка при збереженні контакту", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setNewContact({
      name: log.contact_name,
      phone: log.phone,
      email: log.email,
      telegramId: log.telegram_id || "",
      department: log.department,
    });
    setAddModalOpen(true);
  };

  const openNewModal = () => {
    setEditingLog(null);
    setNewContact({ name: "", phone: "", email: "", telegramId: "", department: "" });
    setAddModalOpen(true);
  };

  const closeModal = () => {
    setAddModalOpen(false);
    setEditingLog(null);
    setNewContact({ name: "", phone: "", email: "", telegramId: "", department: "" });
  };

  return (
    <div className="emergency-log-body">
      <div className="flex justify-between items-center mb-2">
        <h1 className="emergency-log-title text-color mt-3 text-4xl font-bold mb-0">Журнал термінових дзвінків</h1>
        <button
          className="bg-custom-green hover:bg-custom-green-dark text-white px-4 py-2 rounded mt-3 text-semibold"
          onClick={openNewModal}
        >
          + Додати контакт
        </button>
      </div>

      <div style={{ border: '1px dashed #ccc', marginBottom: '5px' }}></div>
      <div className="emergency-log-filters">
        <input
          type="text"
          placeholder="Пошук..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="emergency-log-input"
        />
        <div className="emergency-log-date">
          <label>Від:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="emergency-log-input"
          />
        </div>
        <div className="emergency-log-date">
          <label>До:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="emergency-log-input"
          />
        </div>
        <button
          onClick={() => navigate("/emergency-contacts")}
          className="btn-emergency"
        >
          Сторінка термінових дзвінків
        </button>
      </div>
      <div style={{ border: '1px dashed #ccc', marginBottom: '5px' }}></div>

      <div className="emergency-log-table-wrapper">
        <table className="emergency-log-table">
          <thead>
          <tr>
            <th>Дата</th>
            <th>Дилер</th>
            <th>Номер дилера</th>
            <th>Контакт</th>
            <th>Відділ</th>
            <th>Телефон</th>
            <th>Email</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.length === 0 ? (
            <tr>
              <td colSpan={7} className="emergency-log-empty">Немає записів</td>
            </tr>
          ) : (
            filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.create_date).toLocaleString()}</td>
                <td>{log.full_name || "-"}</td>
                <td>{log.user_phone || "-"}</td>
                <td>{log.contact_name}</td>
                <td>{log.contact_department}</td>
                <td>{log.contact_phone}</td>
                <td>{log.contact_email}</td>
                <td style={{ color: log.success ? "green" : "red" }}>
                  {log.success ? "✅ Успішно" : "❌ Помилка"}
                </td>
              </tr>
            ))
          )}
        </tbody>

        </table>
      </div>

      {/* ==================== Модал ==================== */}
      {addModalOpen && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>{editingLog ? "✏️ Редагування контакту" : "➕ Додати контакт"}</h3>
              <button className="video-close-btn" onClick={closeModal}>✕</button>
            </div>
            <form className="video-form" onSubmit={handleSaveContact}>
              <div className="modal-field">
                <input
                  name="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Ім'я"
                  required
                  className="video-input"
                />
              </div>
              <div className="modal-field">
                <input
                  name="phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Телефон"
                  required
                  className="video-input"
                />
              </div>
              <div className="modal-field">
                <input
                  name="email"
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
                  name="telegramId"
                  value={newContact.telegramId}
                  onChange={(e) => setNewContact({ ...newContact, telegramId: e.target.value })}
                  placeholder="Telegram ID"
                  className="video-input"
                />
              </div>
              <div className="modal-field">
                <input
                  name="department"
                  value={newContact.department}
                  onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                  placeholder="Відділ"
                  required
                  className="video-input"
                />
              </div>
              <div className="video-modal-footer">
                <button type="button" className="video-btn-cancel" onClick={closeModal}>✕ Скасувати</button>
                <button type="submit" className="video-btn-save">
                  {saving ? "Зберігаю..." : editingLog ? "💾 Оновити" : "💾 Додати"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}