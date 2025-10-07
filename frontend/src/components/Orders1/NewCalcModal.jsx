// NewCalcModal.jsx
import React, { useState } from 'react';

export const NewCalcModal = ({ onSave, onCancel }) => {
  const [file, setFile] = useState(null);
  const [itemsCount, setItemsCount] = useState(1);
  const [comment, setComment] = useState('');

  const handleSave = () => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('itemsCount', itemsCount);
    formData.append('calcComment', comment);
    onSave(formData);
  };

  return (
    <div className="new-calc-form column gap-28">
      {/* Форма для завантаження файлу, кількість конструкцій, коментар */}
      {/* ...структура така ж, як у попередньому CalculationModal */}
      <div className="buttons-wrapper row gap-14 w-100 border-top p-14 align-center">
        <span className="btn btn-danger" onClick={onCancel}>Відмінити</span>
        <span className="btn btn-success" onClick={handleSave}>Зберегти</span>
      </div>
    </div>
  );
};
 