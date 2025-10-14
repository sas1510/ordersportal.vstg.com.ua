import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaTrash, FaEdit, FaDownload, FaPlus, FaSearch } from 'react-icons/fa';
import ConfirmModal from '../components/Orders1/ConfirmModal';
import { useNotification } from '../components/notification/Notifications';
import './Files.css';

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  const { addNotification } = useNotification();

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = files.filter(file =>
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.author?.first_last_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/file/upload-files/');
      setFiles(response.data);
      setFilteredFiles(response.data);
    } catch (error) {
      console.error('Помилка завантаження файлів:', error);
      addNotification('Помилка завантаження файлів', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (file) => {
    setSelectedFile(file);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/file/upload-files/${selectedFile.id}/`);
      fetchFiles();
      addNotification(`Файл "${selectedFile.file_name}" видалено`, 'success');
    } catch (error) {
      console.error('Помилка при видаленні:', error);
      addNotification('Не вдалося видалити файл', 'error');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!newFile) return addNotification('Оберіть файл', 'error');

    setLoadingAdd(true);
    const formData = new FormData();
    formData.append('file', newFile);
    formData.append('file_name', fileName || newFile.name);

    try {
      await axiosInstance.post('/file/upload-files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAddModalOpen(false);
      setFileName('');
      setNewFile(null);
      fetchFiles();
      addNotification('Файл успішно додано!', 'success');
    } catch (error) {
      console.error('Помилка при додаванні файлу:', error);
      addNotification('Не вдалося додати файл', 'error');
    } finally {
      setLoadingAdd(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Невідомо';
    const date = new Date(isoString);
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFileAlt />;
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return <FaFilePdf className="text-red-600" />;
      case 'doc':
      case 'docx': return <FaFileWord className="text-blue-600" />;
      case 'xls':
      case 'xlsx': return <FaFileExcel className="text-green-600" />;
      default: return <FaFileAlt className="text-grey" />;
    }
  };

  return (
    <div className="portal-body column gap-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-color mt-3 text-4xl font-bold">📁 Файли</h1>
        {isAdmin && (
          <button
            className="bg-custom-green hover:bg-custom-green-dark text-white font-semibold text-lg px-3 py-2 rounded-lg flex items-center gap-3 mt-5"
            onClick={() => setAddModalOpen(true)}
          >
            <FaPlus size={20} /> Додати файл
          </button>
        )}
      </div>

      {/* Search */}
      <div className="row gap-14 align-center" style={{ marginBottom: '5px' }}>
        <div className="row align-center gap-7 search-box" style={{
          flex: 1,
          background: 'white',
          padding: '8px 12px',
          borderRadius: '10px',
          border: '1px dashed #ccc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <FaSearch className="text-grey" style={{ fontSize: '20px' }} />
          <input
            type="text"
            placeholder="Пошук за назвою або автором..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontWeight: '400',
              padding: '8px 0'
            }}
          />
        </div>
      </div>

      <div style={{ border: '1px dashed #ccc', marginBottom: '5px' }}></div>

      {/* Files List */}
      {loading ? (
        <div className="align-center" style={{ padding: '50px' }}>
          <div className="loader"></div>
         
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="align-center column" style={{ padding: '50px' }}>
          <div className="text-grey">{searchQuery ? 'Файлів не знайдено' : 'Файлів ще немає'}</div>
        </div>
      ) : (
        <div className="column gap-10">
          {filteredFiles.map(file => (
            <div key={file.id} className="claim-item row align-center space-between">
              <div className="row align-center gap-10 flex-1">
                <div style={{ fontSize: '28px' }}>{getFileIcon(file.file_name)}</div>
                <div className="column gap-2">
                  <div className="text-info font-semibold">{file.file_name}</div>
                  <div className="row gap-5 align-center text-grey text-sm">
                    <span>Автор: {file.author?.first_last_name || 'Невідомо'}</span> • 
                    <span>{formatDate(file.create_date)}</span>
                  </div>
                </div>
              </div>

              <div className="row gap-7 align-center">
                <a
                  href={`${process.env.REACT_APP_API_URL}/upload-files/${file.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button background-info row gap-5 align-center"
                >
                  <FaDownload /> Завантажити
                </a>

                {isAdmin && (
                  <>
                    <button className="button background-warning row gap-5 align-center">
                      <FaEdit /> Редагувати
                    </button>
                    <button className="button background-danger row gap-5 align-center" onClick={() => handleDeleteClick(file)}>
                      <FaTrash /> Видалити
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        type="danger"
        title="Видалення файлу"
        message={`Ви дійсно хочете видалити файл "${selectedFile?.file_name}"?`}
        confirmText="Видалити"
        cancelText="Скасувати"
      />

      {/* Add File Modal */}
      {addModalOpen && (
        <div className="file-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="file-modal-window" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="file-modal-header">
              <div className="header-content">
                <div className="file-icon">📎</div>
                <h3>Додати файл</h3>
              </div>
              <button
                className="file-close-btn"
                onClick={() => setAddModalOpen(false)}
                aria-label="Закрити"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddFile} className="claim-form">
              <label className="file-label">
                <span>Назва файлу</span>
                <input
                  type="text"
                  placeholder="Назва файлу..."
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="file-input"
                />
              </label>

              <label className="file-label">
                <span>Оберіть файл</span>
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files[0])}
                  className="file-input"
                />
              </label>
            </form>

            {/* Footer */}
            <div className="file-modal-footer">
              <button
                type="button"
                className="file-btn-cancel"
                onClick={() => setAddModalOpen(false)}
              >
                ✕ Скасувати
              </button>

              <button
                type="button"
                className="file-btn-save"
                onClick={handleAddFile}
                disabled={loadingAdd}
              >
                {loadingAdd ? <div className="loader-small"></div> : '💾 Завантажити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;
