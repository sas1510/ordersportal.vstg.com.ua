import React, { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import axiosInstance from "../../api/axios";

// 3. Імпорт стилів
import './OrderFilesModal.css'; 

// 1. Іконки з Font Awesome 5
import { FaTimes, FaFileAlt } from "react-icons/fa"; 

// 2. Іконки з Font Awesome 6.
import { FaRegFileImage, FaRegFilePdf, FaFileZipper } from "react-icons/fa6"; 

const OrderFilesModal = ({ orderGuid, onClose }) => {

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingFileGuid, setDownloadingFileGuid] = useState(null); 

    const filesListUrl = `order/${orderGuid}/files/`;

    useEffect(() => {
        document.body.style.overflow = "hidden";
        
        const loadFiles = async () => {
            try {
                const response = await axiosInstance.get(filesListUrl);

                if (response.data.status === "success") {
                    setFiles(response.data.files);
                } else {
                    setError("Сервер повернув помилку.");
                }
            } catch (err) {
                console.error("❌ Error fetching files:", err);
                setError("Не вдалося отримати файли.");
            } finally {
                setLoading(false);
            }
        };

        if (orderGuid) loadFiles();
        
        return () => {
            document.body.style.overflow = "";
        };
    }, [orderGuid, filesListUrl]);

    // 🔥 ОНОВЛЕНА ФУНКЦІЯ: Різні іконки для PDF та ZKZ
    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        
        if (ext === 'pdf') {
            // Червона іконка для PDF
            return <FaRegFilePdf style={{ color: '#c0392b' }} />;
        }
        if (ext === 'zkz') {
            // Нейтральна або синя іконка для ZKZ
            return <FaFileAlt style={{ color: '#3498db' }} />; 
        }
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            // Синя іконка для зображень
            return <FaRegFileImage style={{ color: '#4a90e2' }} />;
        }
        if (['zip', 'rar', '7z'].includes(ext)) {
            // Помаранчева іконка для архівів
            return <FaFileZipper style={{ color: '#d88a00' }} />; 
        }
        
        // Сіра іконка для всіх інших
        return <FaFileAlt style={{ color: '#666' }} />;
    };

    const handleDownload = async (fileGuid, fileName) => {
        setDownloadingFileGuid(fileGuid); 

        try {
            const url = `order/${orderGuid}/files/${fileGuid}/${fileName}/download/`;

            const response = await axiosInstance.get(url, {
                responseType: "blob"
            });

            const blob = new Blob([response.data]);

            if (fileName.toLowerCase().endsWith(".pdf")) {
                const pdfUrl = window.URL.createObjectURL(blob);
                window.open(pdfUrl, "_blank");
            } else {
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
            }

        } catch (err) {
            console.error("❌ Error downloading file:", err);
            alert("Не вдалося завантажити файл.");
        } finally {
            setDownloadingFileGuid(null); 
        }
    };


    if (!orderGuid) return null;

    const content = (
        <div className="orders-file-modal-overlay" onClick={onClose}>
            <div className="orders-file-modal-window" onClick={(e) => e.stopPropagation()}>
                
                {/* 1. HEADER */}
                <div className="orders-file-modal-header"> 
                    <div className="header-content">
                        <span className="file-icon"><FaFileAlt /></span>
                        <h3>Файли замовлення</h3>
                    </div>
                    <FaTimes className="close-btn" onClick={onClose} />
                </div>
                
                {/* 2. BODY (Список файлів) */}
                <div className="orders-file-body"> 

                    {loading && <p>Завантаження файлів...</p>}
                    {error && <p style={{ color: '#c0392b' }}>Помилка: {error}</p>}
                    {!loading && !error && files.length === 0 && <p>Файлів для цього замовлення не знайдено.</p>}

                    {!loading && files.length > 0 && (
                        <ul className="file-list">
                            {files.map(file => {
                                const isDownloading = downloadingFileGuid === file.fileGuid; 
                                
                                return (
                                <li key={file.fileGuid} className="file-item">
                                    <div className="file-info-group">
                                        <div className="file-icon-wrapper">
                                            {getFileIcon(file.fileName)} {/* <-- ВИКЛИК ОНОВЛЕНОЇ ФУНКЦІЇ */}
                                        </div>
                                        <div className="file-details">
                                            <b className="file-name-b">{file.fileName}</b>
                                            <div className="file-meta">
                                                {file.type} | Дата: {new Date(file.date).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDownload(file.fileGuid, file.fileName)}
                                        className="file-download-btn"
                                        disabled={isDownloading} 
                                        title={isDownloading ? "Завантаження..." : (file.fileName.toLowerCase().endsWith('.pdf') ? "Переглянути / Завантажити" : "Завантажити")}
                                    >
                                        {isDownloading 
                                            ? "⏳ Завантаження..."
                                            : file.fileName.toLowerCase().endsWith('.pdf') ? "👁️‍🗨️ PDF" : "⬇️ Скачати"}
                                    </button>
                                </li>
                            )})}
                        </ul>
                    )}
                </div>

                {/* 3. FOOTER */}
                <div className="orders-file-modal-footer">
                    <button
                        type="button"
                        className="order-file-close-btn"
                        onClick={onClose}
                    >
                        <FaTimes /> Закрити
                    </button>
                </div>

            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default OrderFilesModal;