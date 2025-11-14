import React, { useState, useEffect } from "react";
import "./AddOrderModal.css"; // Припускаємо, що стилі ajs-modal залишаються

// Списки опцій для Дозамовлення
const ADDITIONAL_ORDER_ELEMENTS = [
  "Елемент на дозамовлення",
  "Імпост",
  "Молдінг",
  "Поріг",
  "HPL",
  "LAMPRE",
  "Армування",
  "Допи",
  "ЛИСТ сендвіч панель",
  "М/П конструкція",
  "Маркер Б/У",
  "Москітна сітка",
  "Набір фурнітури",
  "Відлив",
  "Пакет косметики",
  "Рама",
  "Сендвіч панель",
  "Створка",
  "Склопакет",
  "Ущільнювач",
  "Хлист профілю",
  "Штапік",
  "Штульп",
];

const REASON_OPTIONS = [
  "замінити фурнітуру за рахунок замовника",
  "переробка за рахунок замовника",
  "дозамовлення за рахунок замовника",
  "замінити пошкоджені матеріали за рахунок замовника",
  "замінити склапокет за рахунок замовника",
];

const AddAdditionalOrderModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    orderNumber: "", // Номер замовлення
    isOrderless: false, // Без замовлення
    additionalOrderElement: ADDITIONAL_ORDER_ELEMENTS[0], // Елемент на дозамовлення
    reason: REASON_OPTIONS[0], // Причина дозамовлення
    comment: "", // Коментар контрагента
  });

  // Логіка для блокування скролу
  useEffect(() => {
    if (isOpen) document.body.classList.add("ajs-no-overflow");
    else document.body.classList.remove("ajs-no-overflow");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Обробка чекбокса "Без замовлення"
    if (type === 'checkbox') {
        setFormData((prev) => ({ 
            ...prev, 
            [name]: checked,
            // Якщо обрано "Без замовлення", очищуємо номер замовлення
            ...(name === 'isOrderless' && checked && { orderNumber: '' })
        }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    // Скидання форми до початкового стану
    setFormData({
      orderNumber: "",
      isOrderless: false,
      additionalOrderElement: ADDITIONAL_ORDER_ELEMENTS[0],
      reason: REASON_OPTIONS[0],
      comment: "",
    });
    onClose();
  };

  return (
    <div className="ajs-modal ajs-fade ajs-in" role="dialog">
      <div className="ajs-dimmer" onClick={onClose}></div>

      <div className="ajs-dialog ajs-slideIn">
        <div className="ajs-header">Нове Дозамовлення</div> {/* Змінено заголовок */}

        <div className="ajs-body">
          <form onSubmit={handleSubmit} className="add-order-form">
            
            {/* Поле: Номер замовлення / Без замовлення */}
            <label>
              Номер замовлення:
              <input
                type="text"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                disabled={formData.isOrderless} // Вимкнено, якщо "Без замовлення"
                required={!formData.isOrderless} // Обов'язкове, якщо не "Без замовлення"
                placeholder={formData.isOrderless ? 'Не потрібно' : 'Введіть номер основного замовлення'}
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isOrderless"
                checked={formData.isOrderless}
                onChange={handleChange}
              />
              Без замовлення
            </label>
            
            <hr className="form-delimiter" />

            {/* Поле: Елемент на дозамовлення */}
            <label>
              Елемент на дозамовлення:
              <select
                name="additionalOrderElement"
                value={formData.additionalOrderElement}
                onChange={handleChange}
                required
              >
                {ADDITIONAL_ORDER_ELEMENTS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
            </label>

            {/* Поле: Причина дозамовлення */}
            <label>
              Причина дозамовлення:
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
              >
                {REASON_OPTIONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>

            {/* Поле: Коментар контрагента */}
            <label>
              Коментар контрагента:
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows="3"
                placeholder="Введіть будь-яку додаткову інформацію, якщо необхідно."
              />
            </label>

            <div className="ajs-footer">
              <button
                type="button"
                className="ajs-button ajs-cancel"
                onClick={onClose}
              >
                Скасувати
              </button>
              <button type="submit" className="ajs-button ajs-ok">
                Зберегти Дозамовлення
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAdditionalOrderModal;