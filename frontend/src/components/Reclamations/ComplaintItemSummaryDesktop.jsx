import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { 
    Calendar, 
    User, 
    AlertCircle, 
    CheckCircle, 
    FileText, 
    Image as ImageIcon, 
    Video 
} from "lucide-react";
import axiosInstance from "../../api/axios";
import PhotoModal from "./PhotoModal";
import { formatDate } from "../../utils/formatters";

// =================================================================================
// === ДОПОМІЖНІ КОМПОНЕНТИ (InfoRow, HorizontalInfoGroup, FullWidthInfoGroup) ===
// =================================================================================

const InfoRow = ({ label, value, highlight, isLastInGroup = false, isLastInRow = false, style = {}, colors }) => (
    <div
        className="flex justify-between items-center py-2 px-3 flex-1"
        style={{
            minWidth: '180px',
            borderTop: `1px dashed ${colors.border}`,
            borderRight: isLastInRow ? 'none' : `1px dashed ${colors.border}`,
            borderBottom: isLastInGroup ? `1px dashed ${colors.border}` : 'none',
            ...style,
        }}
    >
        <span className="text-sm font-semibold" style={{ color: colors.label }}>
            {label}:
        </span>
        <span
            className={`text-sm ${highlight ? 'font-extrabold' : 'font-medium'}`}
            style={{
                color: highlight ? colors.highlight : value ? colors.value : colors.empty,
                textAlign: 'right',
            }}
        >
            {value || 'Не вказано'}
        </span>
    </div>
);

const HorizontalInfoGroup = ({ children, columns = 3, colors }) => {
    const childrenArray = React.Children.toArray(children);
    const totalItems = childrenArray.length;

    return (
        <div className="flex flex-wrap w-full">
            {childrenArray.map((child, index) => {
                const isLastInRow = (index + 1) % columns === 0 || index === totalItems - 1;
                const isLastInGroup = index >= totalItems - (totalItems % columns === 0 ? columns : totalItems % columns);
                return React.cloneElement(child, {
                    key: index,
                    isLastInRow,
                    isLastInGroup: isLastInGroup && (index === totalItems - 1 || (totalItems <= columns && index + 1 === totalItems)),
                    colors
                });
            })}
        </div>
    );
};

const FullWidthInfoGroup = ({ children, isLastInGroup = false, colors }) => (
    <div className="flex w-full">
        {React.Children.toArray(children).map((child, index) =>
            React.cloneElement(child, {
                key: index,
                isLastInRow: true,
                isLastInGroup,
                style: { minWidth: 'auto', borderRight: 'none' },
                colors
            })
        )}
    </div>
);

const colorsSet = {
    light: {
        background: '#f3f3f3',
        sectionBg: '#cfdcef99',
        sectionBgDates: '#FFF9EC',
        sectionBgManager: '#EDE7F6',
        sectionBgProblem: '#fae4d9',
        sectionBgResolution: '#e9f3e1',
        sectionBgDescription: '#f9f9f9',
        border: '#ccc',
        label: '#555',
        value: '#333',
        empty: '#b9b9b9',
        highlight: '#5e83bf',
        text: '#404040',
        iconManager: '#645388',
    },
    dark: {
        background: '#1f1f1f',
        sectionBg: '#2c2c3a',
        sectionBgDates: '#3a2f2f',
        sectionBgManager: '#3a2a3a',
        sectionBgProblem: '#5a2a1a',
        sectionBgResolution: '#1a3a1a',
        sectionBgDescription: '#2a2a2a',
        border: '#555',
        label: '#ccc',
        value: '#eee',
        empty: '#888',
        highlight: '#84a0d9',
        text: '#ddd',
        iconManager: '#9b7fd3',
    },
};

/* ================= HELPERS ДЛЯ ФАЙЛІВ ================= */
const isImage = (name) => /\.(jpg|jpeg|png|webp)$/i.test(name);
const isVideo = (name) => /\.(mp4|webm|ogg)$/i.test(name);

// =================================================================================
// === ОСНОВНИЙ КОМПОНЕНТ (ComplaintItemDetailView) ===
// =================================================================================

const ComplaintItemDetailView = ({ complaint }) => {
    const { theme } = useTheme();
    const c = theme === 'dark' ? colorsSet.dark : colorsSet.light;

    const [files, setFiles] = useState([]);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [photoOpen, setPhotoOpen] = useState(false);
    const [photoUrls, setPhotoUrls] = useState([]); // Масив URL з токенами для модалки
    const [isMediaLoading, setIsMediaLoading] = useState(false);

    /* ================= 1. ЗАВАНТАЖЕННЯ СПИСКУ ФАЙЛІВ ================= */
    useEffect(() => {
        if (!complaint?.guid) return;

        axiosInstance
            .get(`/complaints/${complaint.guid}/files/`)
            .then(res => setFiles(res.data.files || []))
            .catch(err => console.error("Error loading files list:", err));
    }, [complaint?.guid]);

    const imageFiles = files.filter(f => isImage(f.File_FileName));
    const videoFiles = files.filter(f => isVideo(f.File_FileName));

    /* ================= 2. ФУНКЦІЯ ОТРИМАННЯ URL З ТОКЕНОМ ================= */
    const getSecureUrl = async (file) => {
        try {
            const res = await axiosInstance.post("/complaints/media-token/", {
                file_guid: file.File_GUID,
            });
            const token = res.data.token;
            // Формуємо URL з токеном для запиту без JWT заголовка (для відкриття у вкладці/тегах)
            return `${window.location.origin}/api/complaints/${complaint.guid}/files/preview/?filename=${encodeURIComponent(file.File_FileName)}&token=${token}`;
        } catch (e) {
            console.error("❌ Помилка токена для:", file.File_FileName);
            return null;
        }
    };

    /* ================= 3. ОБРОБНИКИ КЛІКІВ ================= */
    
    // Для відео (ідентично вашому прикладу)
    const handleVideoClick = async (file) => {
        const url = await getSecureUrl(file);
        if (!url) {
            alert("❌ Не вдалося відкрити відео");
            return;
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
            // 🔴 Safari workaround: відкриваємо як файл (не popup)
            window.location.href = url;
        } else {
            // ✅ Chrome / Android / Desktop
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };


    // Для фото - генеруємо токени для ВСІХ фото перед відкриттям модалки
    const handlePhotoClick = async (index) => {
        setIsMediaLoading(true);
        try {
            const urls = await Promise.all(imageFiles.map(file => getSecureUrl(file)));
            const validUrls = urls.filter(u => u !== null);
            
            if (validUrls.length > 0) {
                setPhotoUrls(validUrls);
                setPhotoIndex(index);
                setPhotoOpen(true);
            } else {
                alert("❌ Не вдалося отримати доступ до фото");
            }
        } finally {
            setIsMediaLoading(false);
        }
    };

    return (
        <div className="w-full" style={{ backgroundColor: c.background }}>
            <div
                className="p-4 rounded shadow"
                style={{
                    border: `1px dashed ${c.border}`,
                    marginBottom: '8px',
                    backgroundColor: c.background,
                }}
            >
                <div className="flex flex-col gap-3">

                    {/* 1. Основна інформація */}
                    <div className="space-y-3">
                        <div className="rounded p-0 overflow-hidden" style={{ backgroundColor: c.sectionBg, border: `1px dashed ${c.highlight}40` }}>
                            <h3 className="text-base font-bold mb-0 p-3 flex items-center border-b" style={{ color: c.text, borderBottom: `1px dashed ${c.border}` }}>
                                <FileText className="w-4 h-4 mr-1.5" style={{ color: c.highlight }} />
                                Основна інформація
                            </h3>
                            <HorizontalInfoGroup columns={3} colors={c}>
                                <InfoRow label="Номер рекламації" value={complaint.number} colors={c} />
                                <InfoRow label="Номер акту" value={complaint.actNumber} colors={c} />
                                <InfoRow label="Номер замовлення" value={complaint.orderNumber} colors={c} />
                            </HorizontalInfoGroup>
                            <FullWidthInfoGroup colors={c}>
                                <InfoRow label="Організація" value={complaint.organization} colors={c} />
                            </FullWidthInfoGroup>
                            <FullWidthInfoGroup isLastInGroup={true} colors={c}>
                                <InfoRow label="Серії конструкцій" value={complaint.series} colors={c} />
                            </FullWidthInfoGroup>
                        </div>
                    </div>

                    {/* 2. Дати */}
                    <div className="space-y-3">
                        <div className="rounded p-0 overflow-hidden" style={{ backgroundColor: c.sectionBgDates, border: `1px dashed ${c.border}` }}>
                            <h3 className="text-base font-bold mb-0 p-3 flex items-center border-b" style={{ color: c.text, borderBottom: `1px dashed ${c.border}` }}>
                                <Calendar className="w-4 h-4 mr-1.5" style={{ color: c.highlight }} />
                                Дати
                            </h3>
                            <HorizontalInfoGroup columns={3} colors={c}>
                                <InfoRow label="Дата рекламації" value={formatDate(complaint.date)} colors={c} />
                                <InfoRow label="Дата доставки" value={formatDate(complaint.deliveryDate)} colors={c} />
                                <InfoRow label="Дата виявлення" value={formatDate(complaint.determinationDate)} colors={c} />
                                {complaint.producedDate && complaint.producedDate !== "Не вказано" && (
                                    <InfoRow label="Виготовлено" value={formatDate(complaint.producedDate)} colors={c} />
                                )}
                                {complaint.soldDate && complaint.soldDate !== "Не вказано" && (
                                    <InfoRow label="Відвантажено" value={formatDate(complaint.soldDate)} colors={c} />
                                )}
                            </HorizontalInfoGroup>
                        </div>
                    </div>

                    {/* 3. Менеджер */}
                    <div className="rounded p-3 flex items-center justify-start gap-6" style={{ backgroundColor: c.sectionBgManager, border: `1px dashed ${c.iconManager}40` }}>
                        <div className="flex items-center gap-3 flex-shrink-0" style={{ color: c.text }}>
                            <User className="w-4 h-4" style={{ color: c.iconManager }} />
                            <h3 className="text-base font-bold">Відповідальний менеджер:</h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: c.iconManager }}>
                                {complaint.manager ? complaint.manager.split(' ').map(n => n[0]).join('') : '?'}
                            </div>
                            <div className="text-sm font-medium" style={{ color: c.text }}>
                                {complaint.manager || 'Не вказано'}
                            </div>
                        </div>
                    </div>

                    {/* 4. Опис, Проблема, Вирішення */}
                    <div className="space-y-3">
                        {complaint.description && (
                            <div className="rounded p-3" style={{ backgroundColor: c.sectionBgDescription, border: `1px dashed ${c.border}` }}>
                                <h3 className="text-base font-bold mb-1.5" style={{ color: c.text }}>Опис рекламації</h3>
                                <p className="text-sm leading-relaxed" style={{ color: c.text }}>{complaint.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {complaint.problem && (
                                <div className="rounded p-3" style={{ backgroundColor: c.sectionBgProblem, border: `1px dashed #e4632140` }}>
                                    <div className="flex items-start gap-1.5">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#e46321' }} />
                                        <div className="flex-1">
                                            <h3 className="text-base font-bold mb-1.5" style={{ color: '#e46321' }}>Проблема</h3>
                                            <p className="text-sm" style={{ color: c.text }}>{complaint.problem}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {complaint.resolution && (
                                <div className="rounded p-3" style={{ backgroundColor: c.sectionBgResolution, border: `1px dashed #76b44840` }}>
                                    <div className="flex items-start gap-1.5">
                                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#76b448' }} />
                                        <div className="flex-1">
                                            <h3 className="text-base font-bold mb-1.5" style={{ color: '#76b448' }}>Вирішення</h3>
                                            <p className="text-sm" style={{ color: c.text }}>{complaint.resolution}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Медіа файли */}
                    <div className="space-y-3">
                        {/* Фотографії */}
                        {imageFiles.length > 0 && (
                            <div className="rounded p-3" style={{ backgroundColor: c.sectionBgDescription, border: `1px dashed ${c.border}` }}>
                                <div className="flex items-center gap-1.5 mb-3">
                                    <ImageIcon className="w-4 h-4" style={{ color: '#606060' }} />
                                    <h3 className="text-base font-bold" style={{ color: c.text }}>
                                        Фото ({imageFiles.length}) {isMediaLoading && "..."}
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {imageFiles.map((file, idx) => (
                                        <div
                                            key={file.File_GUID}
                                            className={`relative w-28 h-28 rounded-lg bg-gray-100 overflow-hidden flex flex-col items-center justify-center hover:opacity-80 transition-opacity cursor-pointer border ${isMediaLoading ? 'cursor-wait opacity-50' : ''}`}
                                            onClick={() => !isMediaLoading && handlePhotoClick(idx)}
                                        >
                                            <ImageIcon size={24} className="text-gray-400 mb-1" />
                                            <span className="text-[10px] text-gray-500 text-center px-1 truncate w-full">
                                                {file.File_FileName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Відео */}
                        {videoFiles.length > 0 && (
                            <div className="rounded p-3" style={{ backgroundColor: c.sectionBgDescription, border: `1px dashed ${c.border}` }}>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Video className="w-4 h-4" style={{ color: '#606060' }} />
                                    <h3 className="text-base font-bold" style={{ color: c.text }}>Відео ({videoFiles.length})</h3>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {videoFiles.map(file => (
                                        <button
                                            key={file.File_GUID}
                                            onClick={() => handleVideoClick(file)}
                                            className="flex items-center gap-2 p-2 rounded hover:bg-black/5 text-sm transition-colors text-left"
                                            style={{ color: c.highlight, border: `1px solid ${c.border}` }}
                                        >
                                            <span role="img" aria-label="play">▶️</span>
                                            <span className="truncate">{file.File_FileName}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === МОДАЛЬНЕ ВІКНО ДЛЯ ФОТО === */}
            {photoOpen && (
                <PhotoModal
                    isOpen={photoOpen}
                    onClose={() => setPhotoOpen(false)}
                    photos={photoUrls} 
                    currentIndex={photoIndex}
                    setCurrentIndex={setPhotoIndex}
                />
            )}
        </div>
    );
};

export { ComplaintItemDetailView };