import React, { useState, useRef, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { formatMoney } from "../../utils/formatMoney"; 
import CommentsModal from "../Orders/CommentsModal"; 
import useWindowWidth from '../../hooks/useWindowWidth';
import DeleteConfirmationModal from '../Orders/DeleteConfirmModal'; // Додаємо, оскільки це використовується всередині вбудованого меню
import { ComplaintItemDetailView } from './ComplaintItemSummaryDesktop'; // Використовуємо новий DetailView

// ================= [ЗАГЛУШКИ] =================
// Заглушки залишаються, але не використовуються для відображення деталей, оскільки 
// деталі тепер відображає ComplaintItemDetailView.
const IssueItemSummaryDesktop = ({ issue, isExpanded, onToggle }) => (
    <div className="issue-item-desktop p-3 border rounded-lg bg-light-grey">
        **Завдання:** {issue.number} | Статус: {issue.status} | Сума: {formatMoney(issue.amount || 0)}
        <button onClick={onToggle}>Деталі</button>
    </div>
);
const IssueItemSummaryMobile = ({ issue, isExpanded, onToggle }) => (
    <div className="issue-item-mobile p-2 border-b bg-light-grey">
        **Завдання:** {issue.number} ({issue.status})
    </div>
);
// ===============================================

// ================= ReclamationItem.jsx =================

/**
 * Відображає зведену інформацію про одну рекламацію, яка тепер є завданням.
 */
export const ReclamationItem = ({ 
    reclamation, 
    onDelete, 
    onEdit, 
    isExpanded, 
    onToggle
    // expandedIssueId та onIssueToggle більше не потрібні, якщо немає вкладеності,
    // але ми залишаємо їх у пропсах для сумісності, якщо потрібно.
}) => {
    // === ВЛАСТИВОСТІ КОМПОНЕНТА RECLAMATION ITEM ===
    const expanded = isExpanded; 
    const toggleExpanded = onToggle;
    
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [selectedComments, setSelectedComments] = useState([]);
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth < 1024;

    // === ЛОГІКА RECLAMATION MENU (ВБУДОВАНА) ===
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const menuRef = useRef(null);
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    const writerGuid = user?.user_id_1c;

    // Закриття меню при кліку поза ним
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (reclamation.status === 'Закрита') return;
        setIsMenuOpen(false);
        if (onEdit) onEdit(reclamation); 
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (reclamation.status !== 'Нова') return; 

        setIsMenuOpen(false);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleteModalOpen(false);
        if (onDelete) {
            await onDelete(reclamation.id); 
        }
    };

    // Обмеження доступу для меню
    const role = localStorage.getItem('role');
    const isCustomer = role === 'customer';
    const canEdit = !isCustomer && reclamation.status !== 'Закрита';
    const canDelete = reclamation.status === 'Нова';
    // === КІНЕЦЬ ЛОГІКИ RECLAMATION MENU ===


    const handleDownload = async () => {
        try {
             const response = await axiosInstance.get(`/complaints/${reclamation.id}/download/file/`, {
                 responseType: 'blob', 
             });
    
             const url = window.URL.createObjectURL(response.data);
             const link = document.createElement('a');
             link.href = url;
             link.setAttribute('download', `${reclamation.number}_File.pdf`); 
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             window.URL.revokeObjectURL(url);
    
         } catch (error) {
             console.error("Помилка при завантаженні файлу рекламації:", error);
         }
    };


    const handleViewComments = (comments) => {
        setSelectedComments(comments);
        setIsCommentsOpen(true);
    };

    // issueList тепер не використовується, оскільки дані не згруповані.
    // const issueList = Array.isArray(reclamation.issues) ? reclamation.issues : [];

    // Функція для визначення CSS класу на основі статусу рекламації
    const getStatusClass = (status) => {
        if (status && status.includes('Виробництво')) {
            return "text-factory";
        }
        
         switch (status) {
            case "Новий": return "text-danger";
            case "На складі": return "text-warning";
            case "В роботі": return "text-info";
            case "Потребує узгодження": return "text-info";
            case "Очікує запчастин": return "text-info";
            case "Вирішено": return "text-success";
            case "Закрита": return "text-success";
            case "Виробництво": return "text-factory";
            case "Відмова": return "text-grey";
            default: return "text-grey";
        }
    };
    
    // Функції для видобування нових полів із Message (потрібні, якщо дані не приходять окремими полями)
    // Оскільки нові мок-дані мають ці поля окремо, ми можемо використовувати їх напряму.
    const responsibleManager = reclamation.manager || "Не вказано";
    const deliveryDate = reclamation.deliveryDate || "Не вказано";
    const actNumber = reclamation.actNumber || "Не вказано";
    // Якщо використовуємо message як резервний варіант, залишаємо extractDetail
    // const extractDetail = (key) => { ... };


    return (
        <div 
            className="reclamation-item column"
            style={{
                borderLeft: Number(reclamation.numberWEB) > 0 
                ? "4px solid #f38721ff" 
                : "4px solid #5e83bf",

                paddingLeft: "12px"
            }}
        >
            {/* ============ RECLAMATION SUMMARY ============ */}
            <div className="item-summary row w-100" onClick={toggleExpanded}>
                
                {/* 1. Іконка та Номер рекламації */}
                <div className="summary-item row no-wrap" style={{ flexBasis: '15%' }}>
                    <span className="icon icon-circle-with-cross font-size-22 text-danger"></span> 
                    <div className="column">
                        <div className="font-size-18 text-danger border-bottom">№ {reclamation.id}</div>
                        <div className="text-grey">{reclamation.date}</div>
                    </div>
                </div>

                {/* 2. Статус (основний) */}


                {/* 3. Сума (якщо є фінансова оцінка рекламації) */}
{/*                 <div className="summary-item row no-wrap" style={{ flexBasis: '15%' }} title="Орієнтовна вартість">
                    <span className="icon icon-coin-dollar font-size-24 text-info"></span>
                    <div className="column">
                        <div className="font-size-18 text-info border-bottom">**{formatMoney(reclamation.amount)}**</div>
                        <div className="font-size-14 text-grey">Вартість</div>
                    </div>
                </div>
                 */}
                {/* 4. Коментар/Опис та Додаткові Деталі */}


                {/* 4. Коментар/Опис та Додаткові Деталі */}
               {/* 4. Коментар/Опис та Додаткові Деталі */}
               

                <div className="summary-item expandable row w-30 align-start space-between">
                    {/* !!! ЗМІНА ТУТ: Додано w-full для примусового розтягування колонки на всю ширину. */}
                    
                    <div className="column w-full" style={{ flex: 1, minWidth: 0 }}> 
                        <div className="comments-text-wrapper-last">
                        {reclamation.message || "Без коментарів"}
                        </div>
                        <button
                        className="btn-comments self-end"
                        style={{ alignSelf: 'flex-end' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewComments(reclamation.message || []);
                        }}
                        >
                        💬 Історія коментарів
                        </button>
                    </div>
                </div>




                {/* 5. Дилер та Файл (якщо є) */}
<div
  className="summary-item flex items-center whitespace-normal"
  style={{ flexBasis: "15%" }}
>
  {reclamation.dealer && (
    <div className="flex items-center gap-1 text-grey font-size-14 break-words">
      <span className="icon icon-user text-dark shrink-0"></span>
      <span className="text-dark leading-snug">
        {reclamation.dealer}
      </span>
    </div>
  )}
</div>


                 <div className="summary-item row no-wrap" style={{ flexBasis: '15%' }}>
                    <div className="icon-info-with-circle font-size-24 text-info"></div>
                    <div className={`column gap-3 font-size-12 no-wrap calc-status ${getStatusClass(reclamation.status)}`}>
                        <div className="font-size-16 font-semibold">{reclamation.status}</div>
              
                    </div>
                </div>

                {/* 6. Меню дій (зразу іконки без випадаючого меню) */}
                    <div 
                    className="summary-item row no-wrap gap-4 align-center" 
                    style={{ flexBasis: '5%' }}
                    onClick={(e) => e.stopPropagation()}
                    >
                    {/* ✏️ Редагувати */}
                    <div
                        className={`icon icon-pencil2 font-size-16 ${!canEdit ? 'inactive' : 'clickable text-info'}`}
                        title={!canEdit ? 'Недоступно для редагування' : 'Редагувати'}
                        onClick={handleEditClick}
                    />

                    {/* 🗑️ Видалити */}
                    <div
                        className={`icon icon-trash font-size-18 ${!canDelete ? 'inactive' : 'clickable text-danger'}`}
                        title={!canDelete ? 'Недоступно для видалення' : 'Видалити'}
                        onClick={handleDeleteClick}
                    />

                    {/* Модальне вікно підтвердження видалення */}
                    {isDeleteModalOpen && (
                        <DeleteConfirmationModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="Підтвердження видалення"
                        message={`Ви впевнені, що хочете видалити рекламацію №${reclamation.number}? Це незворотна дія.`}
                        />
                    )}
                    </div>
            </div>
            

            {/* ============ RECLAMATION DETAILS (ВИКОРИСТОВУЄМО ТІЛЬКИ ОДИН КОМПОНЕНТ) ============ */}

            {expanded && (
                <div className="item-details column gap-14">
                    
                    {/* Відображаємо деталі самої рекламації/завдання */}
                    <ComplaintItemDetailView 
                        key={reclamation.id} 
                        complaint={reclamation} 
                    />
                </div>
            )}

            {/* Модалка для коментарів */}
            <CommentsModal
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}

                baseTransactionGuid={reclamation.guid}      // 🔑 GUID з 1С
                transactionTypeId={2}                       // 🔑 ID типу "Рекламація"
               
                />
        </div>
    );
};