import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { FaFile, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaTrash, FaEdit, FaDownload, FaPlus, FaSearch } from 'react-icons/fa';
import '../components/Portal/Files.css';
import ConfirmModal from '../components/Orders1/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7019';

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = files.filter(file => 
        file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.authorUsername?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/documents/');
      setFiles(response.data);
      setFilteredFiles(response.data);
    } catch (error) {
      console.error('Помилка завантаження файлів:', error);
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
      await axiosInstance.delete(`/documents/${selectedFile.id}/`);
      fetchFiles();
    } catch (error) {
      console.error('Помилка при видаленні:', error);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Невідомо';
    const date = new Date(isoString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile />;
    const ext = fileName.split('.').pop().toLowerCase();
    
    switch(ext) {
      case 'pdf': return <FaFilePdf className="text-red-600" />;
      case 'doc':
      case 'docx': return <FaFileWord className="text-blue-600" />;
      case 'xls':
      case 'xlsx': return <FaFileExcel className="text-green-600" />;
      default: return <FaFileAlt className="text-gray-600" />;
    }
  };

  return (
    <div  className="portal-body column gap-14" style={{  overflow: 'auto' }}>
      {/* Header */}
      <div className="row align-center" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 className="text-info" style={{ fontSize: '28px', fontWeight: 'bold' }}>
          📁 Файли u6yh5eeeejm
        </h1>
        
        {isAdmin && (
          <button
            className="btn btn-success row gap-14 align-center"
            onClick={() => navigate('/files/add')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            <FaPlus /> Додати файл
          </button>
        )}
      </div>

      {/* Search */}
      <div className="row gap-14 align-center" style={{ marginBottom: '20px' }}>
        <div className="row align-center gap-14" style={{ 
          flex: 1,
          background: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <FaSearch className="text-grey" />
          <input
            type="text"
            placeholder="Пошук за назвою або автором..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px'
            }}
          />
        </div>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="align-center" style={{ padding: '50px' }}>
          <div className="text-grey">Завантаження...</div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="align-center column" style={{ padding: '50px' }}>
          <div className="text-grey" style={{ fontSize: '18px' }}>
            {searchQuery ? 'Файлів не знайдено' : 'Файлів ще немає'}
          </div>
        </div>
      ) : (
        <div className="column gap-14">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="row align-center"
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                justifyContent: 'space-between',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Left side - File info */}
              <div className="row align-center gap-14" style={{ flex: 1 }}>
                <div style={{ fontSize: '32px' }}>
                  {getFileIcon(file.filePath)}
                </div>
                
                <div className="column gap-5">
                  <div className="text-info" style={{ fontSize: '18px', fontWeight: '600' }}>
                    {file.title}
                  </div>
                  <div className="row gap-14 align-center">
                    <span className="text-grey" style={{ fontSize: '14px' }}>
                      Автор: {file.authorUsername || 'Невідомо'}
                    </span>
                    <span className="text-grey" style={{ fontSize: '14px' }}>•</span>
                    <span className="text-grey" style={{ fontSize: '14px' }}>
                      {formatDate(file.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="row gap-14 align-center">
                <a
                  href={`${API_URL}/documents/${file.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="row gap-7 align-center"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#4a90e2',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#357abd';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#4a90e2';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaDownload /> Завантажити
                </a>

                {isAdmin && (
                  <>
                    <button
                      className="row gap-7 align-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/files/edit/${file.id}`);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: '#f39c12',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e67e22';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f39c12';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <FaEdit /> Редагувати
                    </button>

                    <button
                      className="row gap-7 align-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(file);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#c0392b';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#e74c3c';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
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
        message={`Ви дійсно хочете видалити файл "${selectedFile?.title}"? Ця дія незворотна.`}
        confirmText="Видалити"
        cancelText="Скасувати"
      />
    </div>
  );
};

export default FilesPage;
