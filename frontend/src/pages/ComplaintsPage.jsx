import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";
import './ComplaintsPage.css';
import { FaFileCircleExclamation } from "react-icons/fa6";
import AddClaimModal from '../components/Orders1/AddClaimModal';
import ClaimItemSummary from '../components/Complaints/ClaimItemSummary';

const getStatusClass = (statusName) => {
  switch (statusName) {
    case "Новий": return "text-dark";
    case "Відвантажений": 
    case "Вирішено": return "text-success";
    case "Готовий (на складі)": 
    case "Виробництво": 
    case "На складі": return "text-info";
    case "В роботі": return "text-warning";
    case "Відмова": return "text-danger";
    default: return "text-dark";
  }
};

const getStatusIcon = (statusName) => {
  if (statusName === "Всі") return <FaFileCircleExclamation />;
  switch (statusName) {
    case "Відвантажений": return "icon-check";
    case "Вирішено": return "icon-thumbs-up";
    case "Готовий (на складі)": return "icon-layers2";
    case "В роботі": return "icon-clipboard";
    case "Виробництво": return "icon-cog";
    case "На складі": return "icon-box";
    case "Відмова": return "icon-circle-with-cross";
    case "Новий": return "icon-info";
    case "Потребує уваги": return "icon-warning";
    case "В очікуванні": return "icon-hourglass";
    case "Пріоритетна": return "icon-star";
    case "Повернення": return "icon-rotate-left";
    default: return "icon-question";
  }
};

const ComplaintsPage = () => {
  const [complaintsData, setComplaintsData] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [filter, setFilter] = useState({ status: 'Всі', month: 0, search: '' });
  const [selectedYear, setSelectedYear] = useState('2025');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [photosMap, setPhotosMap] = useState({}); // { complaintId: [base64,...] }
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const isDealer = role === "customer";

  // Завантаження рекламацій
  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/complaints/complaints-full/", {
        params: { with_dealer: isDealer, year: selectedYear },
      });
      if (Array.isArray(res.data)) {
        setComplaintsData(res.data);
        setFilteredComplaints(res.data);
      } else {
        setError("Невірний формат даних від сервера");
      }
    } catch (err) {
      console.error(err);
      setError("Помилка при завантаженні рекламацій");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [isDealer, selectedYear]);

  // Підвантаження фото у Base64 після отримання рекламацій
  useEffect(() => {
    const fetchPhotosForComplaints = async () => {
      const map = {};
      await Promise.all(
        filteredComplaints.map(async (complaint) => {
          try {
            const res = await axiosInstance.get(`/complaints/${complaint.id}/photos/`);
            if (res.data && Array.isArray(res.data.photos)) {
              map[complaint.id] = res.data.photos.map(p => p.photo_base64);
            } else {
              map[complaint.id] = [];
            }
          } catch {
            map[complaint.id] = [];
          }
        })
      );
      setPhotosMap(map);
    };

    if (filteredComplaints.length) {
      fetchPhotosForComplaints();
    }
  }, [filteredComplaints]);

  // Оновлення після додавання рекламації
  const handleSaveComplaint = () => fetchComplaints();

  // Підрахунок статусів
  const getStatusSummary = () => {
    const allStatuses = ["Новий", "Вирішено", "Готовий (на складі)", "В роботі", "Виробництво", "На складі", "Відмова", "Відвантажений"];
    const summary = { Всі: complaintsData.length };
    allStatuses.forEach(status => summary[status] = 0);
    complaintsData.forEach(c => {
      if (c.StatusName) summary[c.StatusName] += 1;
    });
    return summary;
  };
  const statusSummary = getStatusSummary();

  // Підрахунок по місяцях
  const getMonthSummary = () => {
    const summary = {};
    for (let i = 1; i <= 12; i++) summary[i] = 0;
    complaintsData.forEach(c => {
      if (!c.ComplaintDate) return;
      const month = new Date(c.ComplaintDate).getMonth() + 1;
      summary[month] += 1;
    });
    return summary;
  };
  const monthSummary = getMonthSummary();

  // Фільтрація
  const applyFilters = (statusFilter, monthFilter, searchQuery) => {
    let filtered = [...complaintsData];
    if (statusFilter !== 'Всі') filtered = filtered.filter(c => c.StatusName === statusFilter);
    if (monthFilter !== 0) filtered = filtered.filter(c => new Date(c.ComplaintDate).getMonth() + 1 === monthFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.OrderNumber?.toLowerCase().includes(query) ||
        c.FullName?.toLowerCase().includes(query) ||
        c.DescriptionComplaint?.toLowerCase().includes(query)
      );
    }
    setFilteredComplaints(filtered);
  };

  const handleFilterClick = (statusKey) => {
    setFilter(prev => ({ ...prev, status: statusKey }));
    applyFilters(statusKey, filter.month, filter.search);
  };

  const handleMonthClick = (month) => {
    const newMonth = filter.month === month ? 0 : month;
    setFilter(prev => ({ ...prev, month: newMonth }));
    applyFilters(filter.status, newMonth, filter.search);
  };

  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilter(prev => ({ ...prev, search }));
    applyFilters(filter.status, filter.month, search);
  };

  const handleClearSearch = () => {
    setFilter(prev => ({ ...prev, search: '' }));
    applyFilters(filter.status, filter.month, '');
  };

  if (loading) return (
    <div className="loading-spinner-wrapper">
      <div className="loading-spinner"></div>
      <div className="loading-text">Завантаження...</div>
    </div>
  );

  if (error) return (
    <div className="column complaints-portal-body">
      <div className="complaints-content-wrapper row w-100 h-100 align-center">
        <div className="column align-center gap-14">
          <span className="icon icon-warning font-size-58 text-danger"></span>
          <div className="font-size-24 text-danger text-bold">{error}</div>
          <button 
            className="button background-info"
            onClick={() => window.location.reload()}
          >
            <span className="icon icon-refresh"></span> Спробувати знову
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="column complaints-portal-body">
      {/* Рік та місяці */}
      <div className="complaints-content-summary row w-100">
        <div className="complaints-year-selector row gap-14">
          <span>Звітний рік:</span>
          <span className="icon icon-calendar2 font-size-24 text-info"></span>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
        <div className="complaints-month-pagination">
          <ul className="gap-7 row no-wrap">
            <li className={`complaints-pagination-item ${filter.month === 0 ? 'active' : ''}`} onClick={() => handleMonthClick(0)}>Весь рік</li>
            {Array.from({ length: 12 }, (_, i) => {
              const num = i + 1;
              const labels = ['Січ.', 'Лют.', 'Бер.', 'Квіт.', 'Трав.', 'Черв.', 'Лип.', 'Сер.', 'Вер.', 'Жов.', 'Лис.', 'Груд.'];
              return (
                <li
                  key={num}
                  className={`complaints-pagination-item ${filter.month === num ? 'active' : ''} ${monthSummary[num] === 0 ? 'disabled' : ''}`}
                  onClick={() => monthSummary[num] > 0 && handleMonthClick(num)}
                >
                  {labels[i]} <span className="text-grey">({monthSummary[num]})</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Сайдбар */}
      <div className="complaints-content-wrapper row w-100 h-100">
        <div className="complaints-sidebar column">
          <div className="complaints-search-wrapper">
            <input type="text" className="complaints-search-input" placeholder="пошук по номеру, контрагенту..." value={filter.search} onChange={handleSearchChange}/>
            <span className="icon icon-cancel2 complaints-clear-search" title="Очистити пошук" onClick={handleClearSearch}></span>
          </div>
          <div className="complaints-delimiter"></div>

          {isDealer && (
            <ul className="complaints-buttons">
              <li className="btn complaints-btn-add" onClick={() => setIsAddModalOpen(true)}>
                <span className="icon icon-plus3"></span>
                <span className="uppercase">Нова рекламація</span>
              </li>
            </ul>
          )}

          <ul className="complaints-filter column align-center">
            <li className="complaints-delimiter"></li>
            {Object.keys(statusSummary).map(statusKey => (
              <li key={statusKey} className={`complaints-filter-item ${filter.status === statusKey ? 'active' : ''}`} onClick={() => handleFilterClick(statusKey)}>
                {statusKey === "Всі" ? <span className="icon font-size-24"><FaFileCircleExclamation className="font-size-24" /></span> : <span className={`icon ${getStatusIcon(statusKey)} font-size-24`}></span>}
                <span className="w-100">{statusKey}</span>
                <span className={statusSummary[statusKey] === 0 ? 'disabled' : ''}>{statusSummary[statusKey]}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Контент рекламацій */}
        <div className="complaints-content" id="complaints-content">
          <div className="complaints-items-wrapper column gap-14">
            {filteredComplaints.length === 0 ? (
              <div className="complaints-no-data column align-center h-100">
                <div className="font-size-24 text-grey">Немає рекламацій для відображення</div>
              </div>
            ) : (
              filteredComplaints.map((complaint, idx) => (
                <ClaimItemSummary 
                  key={idx} 
                  claim={{
                    id: complaint.id,
                    number: complaint.WebNumber || "-",
                    date: complaint.ComplaintDate ? new Date(complaint.ComplaintDate).toLocaleDateString('uk-UA') : "-",
                    amount: complaint.Amount || 0,
                    status: complaint.StatusName,
                    clientName: complaint.FullName,
                    orderNumber: complaint.OrderNumber,
                    orderDate: complaint.OrderCreateDate ? new Date(complaint.OrderCreateDate).toLocaleDateString('uk-UA') : "-",
                    description: complaint.DescriptionComplaint,
                    comments: complaint.Comments || [],
                    photos: photosMap[complaint.id] || [] // Base64 фото
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Модалка додавання рекламації */}
      <AddClaimModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveComplaint}
      />
    </div>
  );
};

export default ComplaintsPage;
