import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, User, AlertCircle, CheckCircle, FileText, Image } from 'lucide-react';
// Імпортуємо модальне вікно
import PhotoModal from "./PhotoModal"; 
import {formatDate} from '../../utils/formatters'
// Припускаємо, що PhotoModal.css існує і має стилі для модального вікна.

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

const colors = {
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

// =================================================================================
// === ОСНОВНИЙ КОМПОНЕНТ (ComplaintItemDetailView) ===
// =================================================================================

const ComplaintItemDetailView = ({ complaint }) => {
    const { theme } = useTheme();
    const c = theme === 'dark' ? colors.dark : colors.light;

    // === ЛОГІКА МОДАЛЬНОГО ВІКНА ДЛЯ ФОТО ===
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const openPhotoModal = (index) => {
        setCurrentPhotoIndex(index);
        setIsPhotoModalOpen(true);
    };

    const closePhotoModal = () => {
        setIsPhotoModalOpen(false);
        setCurrentPhotoIndex(0); // Скидаємо індекс при закритті
    };
    // =======================================

    const photosList = complaint.photos || [];

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

                            <HorizontalInfoGroup columns={5} colors={c}>
                                <InfoRow label="Дата рекламації" value={formatDate(complaint.date)} colors={c} />
                                <InfoRow label="Дата доставки" value={formatDate(complaint.deliveryDate)} colors={c} />
                                <InfoRow label="Дата визначення рекламації" value={formatDate(complaint.determinationDate)} colors={c} />
                                 {complaint.producedDate && complaint.producedDate !== "Не вказано" && (
                                    <InfoRow label="Дата виготовлення" value={formatDate(complaint.producedDate)} colors={c} />
                                )}
                                {complaint.soldDate && complaint.soldDate !== "Не вказано" && (
                                    <InfoRow label="Дата відвантаження" value={formatDate(complaint.soldDate)} colors={c} />
                                )}
                            </HorizontalInfoGroup>

                            {complaint.readyDate &&
                                complaint.readyDate !== "Не вказано" &&
                                formatDate(complaint.readyDate) !== "01.01.2001" && (
                                    <FullWidthInfoGroup isLastInGroup={true} colors={c}>
                                        <InfoRow
                                            label={<span style={{ color: 'red' }}>Гранична дата повернення на склад</span>}
                                            value={
                                                <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>
                                                    {formatDate(complaint.readyDate)}
                                                </span>
                                            }
                                            highlight
                                            colors={c}
                                        />
                                    </FullWidthInfoGroup>
                                )}

                        </div>
                    </div>
                    

                    {/* Відповідальний менеджер */}
                    <div className="space-y-2">
                        <div className="rounded p-3 flex items-center justify-start gap-6" style={{ backgroundColor: c.sectionBgManager, border: `1px dashed ${c.iconManager}40` }}>
                            <div className="flex items-center gap-3 flex-shrink-0" style={{ color: c.text }}>
                                <User className="w-4 h-4" style={{ color: c.iconManager }} />
                                <h3 className="text-base font-bold">Відповідальний менеджер:</h3>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="w-30 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0" style={{ backgroundColor: c.iconManager }}>
                                    {complaint.manager ? complaint.manager.split(' ').map(n => n[0]).join('') : '?'}
                                </div>

                                <div className="text-sm font-medium whitespace-nowrap" style={{ color: c.text }}>
                                    {complaint.manager || 'Не вказано'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Опис, Проблема, Вирішення, Фото */}
                    <div className="space-y-3 mt-1">
                        {complaint.description && (
                            <div className="rounded p-3" style={{ backgroundColor: c.sectionBgDescription, border: `1px dashed ${c.border}` }}>
                                <h3 className="text-base font-bold mb-1.5" style={{ color: c.text }}>
                                    Опис рекламації
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: c.text }}>
                                    {complaint.description}
                                </p>
                            </div>
                        )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Проблема */}
                        {complaint.problem && complaint.problem !== "Не вказано" && (
                            <div
                            className="rounded p-3"
                            style={{ backgroundColor: c.sectionBgProblem, border: `1px dashed #e4632140` }}
                            >
                            <div className="flex items-start gap-1.5">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#e46321' }} />
                                <div className="flex-1">
                                <h3 className="text-base font-bold mb-1.5" style={{ color: '#e46321' }}>
                                    Проблема
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: c.text }}>
                                    {complaint.problem}
                                </p>
                                </div>
                            </div>
                            </div>
                        )}

                        {/* Вирішення */}
                        {complaint.resolution && complaint.resolution !== "Не вказано" && (
                            <div
                            className="rounded p-3"
                            style={{ backgroundColor: c.sectionBgResolution, border: `1px dashed #76b44840` }}
                            >
                            <div className="flex items-start gap-1.5">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#76b448' }} />
                                <div className="flex-1">
                                <h3 className="text-base font-bold mb-1.5" style={{ color: '#76b448' }}>
                                    Вирішення
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: c.text }}>
                                    {complaint.resolution}
                                </p>
                                </div>
                            </div>
                            </div>
                        )}
                        </div>


                        {/* Фото (Додано функцію відкриття модального вікна) */}
                        {photosList.length > 0 && (
                            <div className="rounded p-2" style={{ backgroundColor: c.sectionBgDescription, border: `1px dashed ${c.border}` }}>
                                <div className="flex items-center gap-0.5 mb-2 ">
                                    <Image className="w-4 h-4" style={{ color: '#606060' }} />
                                    <h3 className="text-base font-bold" style={{ color: c.text }}>
                                        Фото ({photosList.length})
                                    </h3>
                                </div>
                                <div className="grid grid-cols-8 gap-2">
                                    {photosList.map((photo, idx) => (
                                        <div
                                            key={idx}
                                            className="relative w-28 h-28 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                                            // === КЛЮЧОВА ЗМІНА: Клік для відкриття модального вікна ===
                                            onClick={() => openPhotoModal(idx)} 
                                        >
                                            <img src={`data:image/jpeg;base64,${photo}`} alt={`Фото ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === МОДАЛЬНЕ ВІКНО ДЛЯ ПЕРЕГЛЯДУ ФОТОГРАФІЙ === */}
            <PhotoModal
                isOpen={isPhotoModalOpen}
                onClose={closePhotoModal}
                photos={photosList}
                currentIndex={currentPhotoIndex}
                setCurrentIndex={setCurrentPhotoIndex}
            />
            {/* ================================================= */}
        </div>
    );
};

export { ComplaintItemDetailView };