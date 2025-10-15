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
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  const [editFileName, setEditFileName] = useState('');
  const [editNewFile, setEditNewFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);

  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';
  const { addNotification } = useNotification();

  useEffect(() => { fetchFiles(); }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = files.filter(file =>
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
    } finally { setLoading(false); }
  };

  // ====================== Додавання файлу ======================
  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!newFile) return addNotification('Оберіть файл', 'error');

    setLoadingAdd(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(',')[1];
      const extension = newFile.name.includes('.') ? newFile.name.split('.').pop().toLowerCase() : '';

      const payload = {
        file_name: fileName || newFile.name.replace(/\.[^/.]+$/, ""),
        file_base64: base64String,
        file_extension: extension,
        description: '',
      };

      try {
        await axiosInstance.post('/file/upload-files/', payload);
        setAddModalOpen(false);
        setFileName('');
        setNewFile(null);
        fetchFiles();
        addNotification('Файл успішно додано!', 'success');
      } catch (error) {
        addNotification('Не вдалося додати файл', 'error');
      } finally { setLoadingAdd(false); }
    };
    reader.readAsDataURL(newFile);
  };

  // ====================== Редагування файлу ======================
  const handleEditClick = (file) => {
    setEditingFile(file);
    setEditFileName(file.file_name);
    setEditNewFile(null);
    setEditModalOpen(true);
  };

  const handleEditConfirm = async (e) => {
    e.preventDefault();
    if (!editingFile) return;

    let payload = { file_name: editFileName };

    if (editNewFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        const extension = editNewFile.name.includes('.') ? editNewFile.name.split('.').pop().toLowerCase() : '';
        payload.file_base64 = base64String;
        payload.file_extension = extension;

        await sendEditRequest(payload);
      };
      reader.readAsDataURL(editNewFile);
    } else {
      await sendEditRequest(payload);
    }
  };

  const sendEditRequest = async (payload) => {
    try {
      await axiosInstance.put(`/file/upload-files/${editingFile.id}/`, payload);
      addNotification('Файл успішно змінено!', 'success');
      fetchFiles();
      setEditModalOpen(false);
      setEditingFile(null);
      setEditFileName('');
      setEditNewFile(null);
    } catch (error) {
      console.error(error);
      addNotification('Не вдалося змінити файл', 'error');
    }
  };

  // ====================== Видалення файлу ======================
  const handleDeleteClick = (file) => { setSelectedFile(file); setDeleteModalOpen(true); };
  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/file/upload-files/${selectedFile.id}/`);
      fetchFiles();
      addNotification(`Файл "${selectedFile.file_name}" видалено`, 'success');
    } catch (error) {
      console.error('Помилка при видаленні:', error);
      addNotification('Не вдалося видалити файл', 'error');
    } finally { setDeleteModalOpen(false); }
  };

  // ====================== Завантаження файлу ======================
  const handleDownload = (file) => {
    if (!file.file_base64) return;

    const byteCharacters = atob(file.file_base64);
    const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);

    const fileNameWithExt = file.file_extension ? `${file.file_name}.${file.file_extension}` : file.file_name;

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileNameWithExt;
    link.click();
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Невідомо';
    const date = new Date(isoString);
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFileIcon = (file) => {
    const ext = file.file_extension?.toLowerCase();
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
    <div className="file-body column gap-14">
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
          flex: 1, background: 'white', padding: '8px 12px', borderRadius: '10px',
          border: '1px dashed #ccc', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <FaSearch className="text-grey" style={{ fontSize: '20px' }} />
          <input
            type="text"
            placeholder="Пошук за назвою або автором..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', fontWeight: '400', padding: '8px 0' }}
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
                <div style={{ fontSize: '28px' }}>{getFileIcon(file)}</div>
                <div className="column gap-2">
                  <div className="text-info font-semibold">{file.file_name}</div>
                  <div className="row gap-5 align-center text-grey text-sm">
                    <span>Автор: {file.author?.full_name || 'Невідомо'}</span> •
                    <span>{formatDate(file.create_date)}</span>
                  </div>
                </div>
              </div>

              <div className="row gap-7 align-center">
                <button className="button background-info row gap-5 align-center" onClick={() => handleDownload(file)}>
                  <FaDownload /> Завантажити
                </button>

                {isAdmin && (
                  <>
                    <button className="button background-warning row gap-5 align-center" onClick={() => handleEditClick(file)}>
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
            <div className="file-modal-header">
              <div className="header-content">
                <div className="file-icon">📎</div>
                <h3>Додати файл</h3>
              </div>
              <button className="file-close-btn" onClick={() => setAddModalOpen(false)} aria-label="Закрити">✕</button>
            </div>

            <form onSubmit={handleAddFile} className="claim-form">
              <label className="file-label">
                <span>Назва файлу</span>
                <input type="text" placeholder="Назва файлу..." value={fileName} onChange={(e) => setFileName(e.target.value)} className="file-input" />
              </label>

              <label className="file-label">
                <span>Оберіть файл</span>
                <input type="file" onChange={(e) => setNewFile(e.target.files[0])} className="file-input" />
              </label>
            </form>

            <div className="file-modal-footer">
              <button type="button" className="file-btn-cancel" onClick={() => setAddModalOpen(false)}>✕ Скасувати</button>
              <button type="button" className="file-btn-save" onClick={handleAddFile} disabled={loadingAdd}>
                {loadingAdd ? <div className="loader-small"></div> : '💾 Завантажити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit File Modal */}
      {editModalOpen && (
        <div className="file-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="file-modal-window edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header" style={{ backgroundColor: '#1E40AF', color: 'white' }}>
              <div className="header-content">
                <div className="file-icon">✏️</div>
                <h3>Редагувати файл</h3>
              </div>
              <button className="file-close-btn" onClick={() => setEditModalOpen(false)} aria-label="Закрити">✕</button>
            </div>

            <form onSubmit={handleEditConfirm} className="claim-form">
              <label className="file-label">
                <span>Назва файлу</span>
                <input
                  type="text"
                  placeholder="Назва файлу..."
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="file-input"
                />
              </label>

              <label className="file-label">
                <span>Оберіть новий файл (необов'язково)</span>
                <input
                  type="file"
                  onChange={(e) => setEditNewFile(e.target.files[0])}
                  className="file-input"
                />
              </label>
            </form>

            <div className="file-modal-footer">
              <button type="button" className="file-btn-cancel" onClick={() => setEditModalOpen(false)}>✕ Скасувати</button>
              <button type="button" className="file-btn-save edit-btn" onClick={handleEditConfirm}>
                💾 Зберегти зміни
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FilesPage;
