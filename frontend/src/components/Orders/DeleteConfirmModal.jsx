// import React, { useEffect } from 'react';
// import axiosInstance from '../../api/axios.js';
// import './DeleteConfirmModal.css';
// import { useNotification } from '../notification/Notifications.jsx';
// import { FaExclamationTriangle, FaTrash, FaTimes } from 'react-icons/fa';

// const DeleteConfirmModal = ({ isOpen, onClose, itemData, itemType: propItemType, onDeleted }) => {
//   const { addNotification } = useNotification();

//   if (!isOpen || !itemData) return null;

//   const type = propItemType || itemData?.type;

//   // 1. Визначення відображуваного імені
//   const itemName = (() => {
//     if (type === 'calculation' || type === 'additionalOrder') {
//       return itemData?.number || itemData?.id || 'запис';
//     }
//     if (type === 'reclamation') {
//       return itemData?.id || itemData?.numberWEB || 'рекламацію';
//     }
//     return (
//       itemData?.number ||
//       itemData?.orderNumber ||
//       itemData?.title ||
//       itemData?.id ||
//       'цей запис'
//     );
//   })();

//   // 2. Словник для текстових повідомлень
//   const mapType = {
//     order: 'замовлення',
//     calculation: 'прорахунок',
//     client: 'клієнта',
//     product: 'товар',
//     reclamation: 'рекламацію',
//     additionalOrder: 'дозамовлення' // Додано для коректного відображення
//   };

//   const itemType = mapType[type] || 'запис';

//   useEffect(() => {
//     const handleEsc = (event) => {
//       if (event.key === 'Escape' && !isDeleting) {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//       window.addEventListener('keydown', handleEsc);
//     }

//     return () => {
//       document.body.style.overflow = '';
//       window.removeEventListener('keydown', handleEsc);
//     };
//   }, [isOpen, onClose, isDeleting]);

//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//     }
//     return () => {
//       document.body.style.overflow = '';
//     };
//   }, [isOpen]);

//   const handleDelete = async () => {
//     try {
//       let endpoint = '';

//       // 3. ВИЗНАЧЕННЯ ЕНДПОІНТІВ
//       switch (type) {
//         case 'reclamation':
//           endpoint = `/complaints/delete_complaint/${itemData.guid}/`;
//           break;
//         case 'additionalOrder':
//           // Точка на бек так само, як у рекламаціях (через GUID або ID)
//           endpoint = `/additional-orders/delete_order/${itemData.guid || itemData.id}/`;
//           break;
//         case 'calculation':
//           endpoint = `/calculations/${itemData.id}/delete/`;
//           break;
//         case 'order':
//           endpoint = `/orders/${itemData.id}/delete/`;
//           break;
//         case 'client':
//           endpoint = `/clients/${itemData.id}/delete/`;
//           break;
//         case 'product':
//           endpoint = `/products/${itemData.id}/delete/`;
//           break;
//         default:
//           console.warn('Невідомий тип елемента для видалення:', itemData);
//           addNotification('Невідомий тип елемента ❌', 'error');
//           return;
//       }

//       // 4. ВИКЛИК API
//       // Якщо дозамовлення працює через той же механізм, що й рекламації — використовуємо .delete()
//       if (type === 'reclamation' || type === 'additionalOrder') {
//         await axiosInstance.delete(endpoint);
//       } else {
//         await axiosInstance.post(endpoint);
//       }

//       if (onDeleted) onDeleted(itemData.id);

//       addNotification(`${itemType} "${itemName}" успішно видалено ✅`, 'success');
//       onClose();
//     } catch (error) {
//       console.error('Помилка при видаленні:', error);
//       const msg = error.response?.data?.error || error.response?.data?.detail || `Не вдалося видалити ${itemType}`;
//       addNotification(msg, 'error');
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content-square" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-border-top" />
//         <div className="modal-header">
//           <div className="header-icon">
//             <FaExclamationTriangle size={50} color="#e74c3c" />
//           </div>
//           <h2>Підтвердження видалення</h2>
//         </div>
//         <div className="modal-body">
//           <p>
//             Ви дійсно бажаєте видалити {itemType} "<strong>{itemName}</strong>"?
//           </p>
//           <p className="description">
//             Ця дія є незворотною. Всі пов'язані дані будуть також видалені.
//           </p>
//         </div>
//         <div className="modal-footer">
//           <button
//             type="button"
//             className="btn btn-grey-delete"
//             onClick={(e) => {
//               e.stopPropagation();
//               onClose();
//             }}
//           >
//             <FaTimes style={{ marginRight: 6 }} /> Скасувати
//           </button>
//           <button className="btn btn-danger-delete" onClick={handleDelete}>
//             <FaTrash style={{ marginRight: 6 }} /> Видалити
//           </button>
//         </div>
//         <div className="modal-border-bottom" />
//       </div>
//     </div>
//   );
// };

// export default DeleteConfirmModal;

import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axios.js";
import "./DeleteConfirmModal.css";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";
import {
  FaExclamationTriangle,
  FaTrash,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  itemData,
  itemType: propItemType,
  onDeleted,
}) => {
  const { addNotification } = useNotification();
  const [isDeleting, setIsDeleting] = useState(false); // Стан для лоадера на кнопці

  // 1. Ефект для блокування прокрутки та обробки Esc
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !itemData) return null;

  const type = propItemType || itemData?.type;

  // Визначення відображуваного імені
  const itemName = (() => {
    if (type === "calculation" || type === "additionalOrder") {
      return itemData?.number || itemData?.id || "запис";
    }
    if (type === "reclamation") {
      return itemData?.id || itemData?.numberWEB || "рекламацію";
    }
    return (
      itemData?.number ||
      itemData?.orderNumber ||
      itemData?.title ||
      itemData?.id ||
      "цей запис"
    );
  })();

  // Словник типів
  const mapType = {
    order: "Замовлення",
    calculation: "Прорахунок",
    client: "Клієнта",
    product: "Товар",
    reclamation: "Рекламацію",
    additionalOrder: "Дозамовлення",
  };

  const itemType = mapType[type] || "запис";

  const handleDelete = async () => {
    if (isDeleting) return; // Захист від подвійного кліку

    setIsDeleting(true);
    try {
      let endpoint = "";

      switch (type) {
        case "reclamation":
          endpoint = `/complaints/delete_complaint/${itemData.guid}/`;
          break;
        case "additionalOrder":
          endpoint = `/additional-orders/delete_order/${itemData.guid || itemData.id}/`;
          break;
        case "calculation":
          endpoint = `/calculations/${itemData.id}/delete/`;
          break;
        case "order":
          endpoint = `/orders/${itemData.id}/delete/`;
          break;
        case "client":
          endpoint = `/clients/${itemData.id}/delete/`;
          break;
        case "product":
          endpoint = `/products/${itemData.id}/delete/`;
          break;
        default:
          addNotification("Невідомий тип елемента ❌", "error");
          setIsDeleting(false);
          return;
      }

      if (type === "reclamation" || type === "additionalOrder") {
        await axiosInstance.delete(endpoint);
      } else {
        await axiosInstance.post(endpoint);
      }

      if (onDeleted) onDeleted(itemData.id);

      addNotification(
        `${itemType} "${itemName}" успішно видалено ✅`,
        "success",
      );
      onClose();
    } catch (error) {
      console.error("Помилка при видаленні:", error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        `Не вдалося видалити ${itemType}`;
      addNotification(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={!isDeleting ? onClose : null}>
      <div
        className="modal-content-square"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-border-top" />

        <div className="modal-header">
          <div className="header-icon">
            <FaExclamationTriangle size={50} color="#e74c3c" />
          </div>
          <h2>Підтвердження видалення</h2>
        </div>

        <div className="modal-body">
          <p>
            Ви дійсно бажаєте видалити {itemType} "<strong>{itemName}</strong>"?
          </p>
          <p className="description">
            Ця дія є незворотною. Всі пов'язані дані будуть також видалені.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-grey-delete"
            onClick={onClose}
            disabled={isDeleting}
          >
            <FaTimes style={{ marginRight: 6 }} /> Скасувати
          </button>

          <button
            className="btn btn-danger-delete"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <FaSpinner className="spinning" style={{ marginRight: 6 }} />{" "}
                Видалення...
              </>
            ) : (
              <>
                <FaTrash style={{ marginRight: 6 }} /> Видалити
              </>
            )}
          </button>
        </div>

        <div className="modal-border-bottom" />
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
