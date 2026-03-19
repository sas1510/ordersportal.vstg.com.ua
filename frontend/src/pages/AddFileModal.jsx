import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axiosInstance from '../../api/axios';

const AddFileModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !fileName) return;

    const formData = new FormData();
    formData.append('file_path', file);
    formData.append('file_name', fileName);
    formData.append('description', description);

    setLoading(true);
    try {
      await axiosInstance.post('/file/upload-files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Помилка завантаження файлу:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content column gap-14">
        <div className="row align-center space-between">
          <h2 className="text-info font-bold">Додати файл</h2>
          <button className="photo-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form className="column gap-10" onSubmit={handleSubmit}>
          <div className="column gap-5">
            <label className="font-semibold">Назва файлу</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
              className="input-field"
              placeholder="Введіть назву файлу"
            />
          </div>

          <div className="column gap-5">
            <label className="font-semibold">Опис</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Опис файлу (не обов'язково)"
            />
          </div>

          <div className="column gap-5">
            <label className="font-semibold">Вибрати файл</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          <div className="row gap-10" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="button background-grey row gap-5 align-center"
              onClick={onClose}
            >
              Відмінити
            </button>
            <button
              type="submit"
              className="button background-success row gap-5 align-center"
              disabled={loading}
            >
              {loading ? 'Завантаження...' : 'Додати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFileModal;
