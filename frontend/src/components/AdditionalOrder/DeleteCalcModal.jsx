// DeleteCalcModal.jsx
import React from 'react';

export const DeleteCalcModal = ({ calculation, onConfirm, onCancel }) => {
  return (
    <div className="delete-calc-form column gap-28">
      <span>Дійсно видалити прорахунок <b>№{calculation.internals.name}</b>?</span>
      <div className="buttons-wrapper row gap-14 w-100 border-top p-14 align-center">
        <span className="btn btn-danger" onClick={onCancel}>Відмінити</span>
        <span className="btn btn-success" onClick={onConfirm}>Так</span>
      </div>
    </div>
  );
};
