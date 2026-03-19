// CalculationModal.jsx
import React, { useState, useEffect } from 'react';

export const CalculationModal = ({ type, calculation, onSave, onCancel }) => {
  const [file, setFile] = useState(null);
  const [itemsCount, setItemsCount] = useState(calculation?.internals?.['КоличествоКонструкцийВПросчете'] || 1);
  const [comment, setComment] = useState(calculation?.internals?.['ПросчетСообщения'] || '');

  useEffect(() => {
    if (type === 'edit' && calculation) {
      setItemsCount(parseInt(calculation.internals['КоличествоКонструкцийВПросчете']));
      setComment(calculation.internals['ПросчетСообщения']);
    }
  }, [calculation, type]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;
    setFile(selectedFile);
    const filenameEl = document.getElementById('uploaded-calc-file-name');
    if (filenameEl) {
      filenameEl.textContent = selectedFile ? selectedFile.name : 'Файл не обрано';
      filenameEl.classList.toggle('text-danger', !!selectedFile);
      filenameEl.classList.toggle('text-grey', !selectedFile);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    const fileInput = document.getElementById('upload-calc-file');
    if (fileInput) fileInput.value = '';
    const filenameEl = document.getElementById('uploaded-calc-file-name');
    if (filenameEl) {
      filenameEl.textContent = 'Файл не обрано';
      filenameEl.classList.remove('text-danger');
      filenameEl.classList.add('text-grey');
    }
  };

  const handleSave = () => {
    if (type === 'delete') {
      onSave(calculation);
    } else {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('itemsCount', itemsCount);
      formData.append('calcComment', comment);
      onSave(formData);
    }
  };

  return (
    <div className="new-calc-form column gap-28">
      {type !== 'delete' ? (
        <>
          <div className="column gap-28 align-center w-100">
            <span className="column align-center background-warning-light border-grey cursor-pointer w-100 align-center" title="Завантажити файл прорахунку">
              <label htmlFor="upload-calc-file" className="row cursor-pointer gap-14 text-grey p-14">
                <span className="icon icon-upload font-size-24"></span>
                <span>Завантажити файл прорахунку</span>
                <input type="file" id="upload-calc-file" name="upload-calc-file" accept=".zkz" style={{ display: 'none' }} onChange={handleFileChange} />
              </label>
              <div className="row align-center gap-14 w-100 p-14 border-top">
                <span id="uploaded-calc-file-name" className="text-grey font-size-14">Файл не обрано</span>
                <span className="icon icon-cancel2 font-size-18 text-grey cursor-pointer" title="Очистити вибір файлу" onClick={handleClearFile}></span>
              </div>
            </span>

            <label htmlFor="items-count" className="row align-center gap-14">
              <span>Кількість конструкцій:</span>
              <input type="number" id="items-count" value={itemsCount} min="1" style={{ width: '60px', textAlign: 'center' }} onChange={(e) => setItemsCount(e.target.value)} />
            </label>

            <label htmlFor="calc-comment" className="row align-center gap-7 w-100">
              <textarea id="calc-comment" name="calc-comment" placeholder="Введіть коментар" className="w-100" style={{ height: '100px' }} value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
            </label>
          </div>
        </>
      ) : (
        <div className="column gap-28 align-center w-100">
          <span>
            Дійсно видалити прорахунок <span className="text-danger">№ {calculation.internals.name}</span> від <span className="text-danger">{calculation.internals['ДатаПросчета']}</span>
          </span>
        </div>
      )}

      <div className="buttons-wrapper row gap-14 w-100 border-top p-14 align-center">
        <span className="right btn btn-danger btn-cancel row gap-14 align-center" title="Відмінити" onClick={onCancel}>
          <span className="icon-cancel font-size-18"></span>
          <span>Відмінити</span>
        </span>
        <span className={`right btn btn-success row gap-14 align-center ${type !== 'delete' ? '' : 'btnClickTrigger'}`} title={type === 'delete' ? 'Так' : 'Зберегти'} onClick={handleSave}>
          <span className="icon-save font-size-18"></span>
          <span>{type === 'delete' ? 'Так' : 'Зберегти'}</span>
        </span>
      </div>
    </div>
  );
};
