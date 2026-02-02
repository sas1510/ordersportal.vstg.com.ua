import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import PhotoModal from "./PhotoModal";
import { formatDate } from "../../utils/formatters";
import axiosInstance from "../../api/axios";

import { useNotification } from "../notification/Notifications.jsx";

/* ================= HELPERS ДЛЯ ФАЙЛІВ ================= */
const isImage = (name) => /\.(jpg|jpeg|png|webp)$/i.test(name);
const isVideo = (name) => /\.(mp4|webm|ogg)$/i.test(name);

/* =================================================================================
 * === ДОПОМІЖНІ КОМПОНЕНТИ (InfoRow, HorizontalInfoGroup, FullWidthInfoGroup) ===
 * ================================================================================= */

const InfoRow = ({
  label,
  value,
  highlight,
  isLastInGroup = false,
  isLastInRow = false,
  style = {},
  colors,
}) => (
  <div
    className="flex justify-between items-center py-2 px-3 flex-1"
    style={{
      minWidth: "180px",
      borderTop: `1px dashed ${colors.border}`,
      borderRight: isLastInRow ? "none" : `1px dashed ${colors.border}`,
      borderBottom: isLastInGroup ? `1px dashed ${colors.border}` : "none",
      ...style,
    }}
  >
    <span className="text-sm font-semibold" style={{ color: colors.label }}>
      {label}:
    </span>
    <span
      className={`text-sm ${highlight ? "font-extrabold" : "font-medium"}`}
      style={{
        color: highlight
          ? colors.highlight
          : value
          ? colors.value
          : colors.empty,
        textAlign: "right",
      }}
    >
      {value || "Не вказано"}
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
        const isLastInGroup =
          index >=
          totalItems - (totalItems % columns === 0 ? columns : totalItems % columns);

        return React.cloneElement(child, {
          key: index,
          isLastInRow,
          isLastInGroup:
            isLastInGroup &&
            (index === totalItems - 1 || (totalItems <= columns && index + 1 === totalItems)),
          colors,
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
        style: { minWidth: "auto", borderRight: "none" },
        colors,
      })
    )}
  </div>
);

/* ================= COLORS ================= */

const colors = {
  light: {
    background: "#f3f3f3",
    sectionBg: "#cfdcef99",
    sectionBgDates: "#FFF9EC",
    sectionBgManager: "#EDE7F6",
    sectionBgProblem: "#fae4d9",
    sectionBgResolution: "#e9f3e1",
    sectionBgDescription: "#f9f9f9",
    border: "#ccc",
    label: "#555",
    value: "#333",
    empty: "#b9b9b9",
    highlight: "#5e83bf",
    text: "#404040",
    iconManager: "#645388",
  },
  dark: {
    background: "#1f1f1f",
    sectionBg: "#2c2c3a",
    sectionBgDates: "#3a2f2f",
    sectionBgManager: "#3a2a3a",
    sectionBgProblem: "#5a2a1a",
    sectionBgResolution: "#1a3a1a",
    sectionBgDescription: "#2a2a2a",
    border: "#555",
    label: "#ccc",
    value: "#eee",
    empty: "#888",
    highlight: "#84a0d9",
    text: "#ddd",
    iconManager: "#9b7fd3",
  },
};

/* =================================================================================
 * === ОСНОВНИЙ КОМПОНЕНТ (MOBILE) ===
 * ================================================================================= */

const ComplaintItemDetailViewMobile = ({ complaint }) => {
  const { theme } = useTheme();
  const c = theme === "dark" ? colors.dark : colors.light;

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const { addNotification } = useNotification();

  const [files, setFiles] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  /* ================= 1. ЗАВАНТАЖЕННЯ СПИСКУ ФАЙЛІВ ================= */
  const loadFiles = useCallback(async () => {
    if (!complaint?.guid) return;

    try {
      const res = await axiosInstance.get(`/complaints/${complaint.guid}/files/`);
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Error loading files list:", err);
      
      addNotification(
        <div className="flex flex-col gap-2 items-center text-center"> 
          {/* Додано items-center для вирівнювання кнопки та text-center для тексту */}
          <span>Не вдалося завантажити медіа-файли.</span>
          <button 
            onClick={() => loadFiles()} 
            className="bg-white text-red-600 px-3 py-1.5 rounded text-xs font-bold w-fit shadow-md active:scale-95 transition-transform"
          >
            Спробувати ще раз
          </button>
        </div>,
        "warning", 
      );
    }
  }, [complaint?.guid, addNotification]);


  

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const imageFiles = files.filter((f) => isImage(f.File_FileName));
  const videoFiles = files.filter((f) => isVideo(f.File_FileName));




  /* ================= 2. URL З ТОКЕНОМ ================= */
  const getSecureUrl = async (file) => {
    try {
      const res = await axiosInstance.post("/complaints/media-token/", {
        file_guid: file.File_GUID,
      });

      const token = res.data.token;

      return `${window.location.origin}/api/complaints/${complaint.guid}/files/preview/?filename=${encodeURIComponent(
        file.File_FileName
      )}&token=${token}`;
    } catch (e) {
      console.error("❌ Token error:", file?.File_FileName, e);
      return null;
    }
  };

  /* ================= 3. КЛІК ПО ФОТО / ВІДЕО ================= */

  const handlePhotoClick = async (index) => {
    if (!imageFiles.length) return;

    setIsMediaLoading(true);
    try {
      const urls = await Promise.all(imageFiles.map((file) => getSecureUrl(file)));
      const validUrls = urls.filter(Boolean);

      if (validUrls.length > 0) {
        setPhotoUrls(validUrls);
        setPhotoIndex(index);
        setIsPhotoModalOpen(true);
      } else {
        alert("❌ Не вдалося отримати доступ до фото");
      }
    } finally {
      setIsMediaLoading(false);
    }
  };

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


  return (
    <div className="w-full" style={{ backgroundColor: c.background }}>
      <div
        className="p-4 rounded shadow"
        style={{
          border: `1px dashed ${c.border}`,
          marginBottom: "8px",
          backgroundColor: c.background,
        }}
      >
        <div className="flex flex-col gap-3">
          {/* 1. Основна інформація */}
          <div className="space-y-3">
            <div
              className="rounded p-0 overflow-hidden"
              style={{ backgroundColor: c.sectionBg, border: `1px dashed ${c.highlight}40` }}
            >
              <h3
                className="text-base font-bold mb-0 p-3 flex items-center border-b"
                style={{ color: c.text, borderBottom: `1px dashed ${c.border}` }}
              >
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
            <div
              className="rounded p-0 overflow-hidden"
              style={{ backgroundColor: c.sectionBgDates, border: `1px dashed ${c.border}` }}
            >
              <h3
                className="text-base font-bold mb-0 p-3 flex items-center border-b"
                style={{ color: c.text, borderBottom: `1px dashed ${c.border}` }}
              >
                <Calendar className="w-4 h-4 mr-1.5" style={{ color: c.highlight }} />
                Дати
              </h3>

              <HorizontalInfoGroup columns={5} colors={c}>
                <InfoRow label="Дата рекламації" value={formatDate(complaint.date)} colors={c} />
                <InfoRow label="Дата доставки" value={formatDate(complaint.deliveryDate)} colors={c} />
                <InfoRow
                  label="Дата визначення рекламації"
                  value={formatDate(complaint.determinationDate)}
                  colors={c}
                />
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
                      label={<span style={{ color: "red" }}>Гранична дата повернення на склад</span>}
                      value={
                        <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>
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

          {/* 3. Менеджер */}
          <div className="space-y-2">
            <div
              className="rounded p-3 flex flex-col md:flex-row items-start md:items-center justify-start gap-3"
              style={{ backgroundColor: c.sectionBgManager, border: `1px dashed ${c.iconManager}40` }}
            >
              <div className="flex items-center gap-2 flex-shrink-0" style={{ color: c.text }}>
                <User className="w-4 h-4" style={{ color: c.iconManager }} />
                <h3 className="text-base font-bold">Відповідальний менеджер:</h3>
              </div>

              <div className="flex items-center gap-3">
                {/* <div
                  className="hidden md:flex w-10 h-10 rounded-full items-center justify-center text-white font-bold text-base flex-shrink-0"
                  style={{ backgroundColor: c.iconManager }}
                >
                  {complaint.manager ? complaint.manager.split(" ").map((n) => n[0]).join("") : "?"}
                </div> */}

                <div className="text-sm font-medium whitespace-nowrap" style={{ color: c.text }}>
                  {complaint.manager || "Не вказано"}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Опис, Проблема, Вирішення */}
          <div className="space-y-3 mt-1">
            {complaint.description && (
              <div
                className="rounded p-3"
                style={{ backgroundColor: c.sectionBgDescription, border: `1px dashed ${c.border}` }}
              >
                <h3 className="text-base font-bold mb-1.5" style={{ color: c.text }}>
                  Опис рекламації
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: c.text }}>
                  {complaint.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {complaint.problem && complaint.problem !== "Не вказано" && (
                <div
                  className="rounded p-3"
                  style={{ backgroundColor: c.sectionBgProblem, border: `1px dashed #e4632140` }}
                >
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#e46321" }} />
                    <div className="flex-1">
                      <h3 className="text-base font-bold mb-1.5" style={{ color: "#e46321" }}>
                        Проблема
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: c.text }}>
                        {complaint.problem}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {complaint.resolution && complaint.resolution !== "Не вказано" && (
                <div
                  className="rounded p-3"
                  style={{ backgroundColor: c.sectionBgResolution, border: `1px dashed #76b44840` }}
                >
                  <div className="flex items-start gap-1.5">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#76b448" }} />
                    <div className="flex-1">
                      <h3 className="text-base font-bold mb-1.5" style={{ color: "#76b448" }}>
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

            {/* 5. МЕДІА: ФОТО */}
            {imageFiles.length > 0 && (
              <div
                className="rounded p-2"
                style={{ backgroundColor: c.sectionBgDescription, border: `1px dashed ${c.border}` }}
              >
                <div className="flex items-center gap-1 mb-2">
                  <ImageIcon className="w-4 h-4" style={{ color: "#606060" }} />
                  <h3 className="text-base font-bold" style={{ color: c.text }}>
                    Фото ({imageFiles.length}) {isMediaLoading ? "..." : ""}
                  </h3>
                </div>

                <div className="flex overflow-x-auto pb-2 -mx-2 px-2 gap-2 snap-x">
                  {imageFiles.map((file, idx) => (
                    <div
                      key={file.File_GUID}
                      className={`relative w-32 h-32 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 snap-start flex items-center justify-center border ${
                        isMediaLoading ? "opacity-60 cursor-wait" : "cursor-pointer hover:opacity-80"
                      }`}
                      style={{ borderColor: c.border }}
                      onClick={() => !isMediaLoading && handlePhotoClick(idx)}
                      title={file.File_FileName}
                    >
                      <ImageIcon className="text-gray-400" />
                      <span className="absolute bottom-1 left-1 right-1 text-[10px] text-gray-500 truncate text-center px-1">
                        {file.File_FileName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. МЕДІА: ВІДЕО */}
            {videoFiles.length > 0 && (
              <div
                className="rounded p-2"
                style={{ backgroundColor: c.sectionBgDescription, border: `1px dashed ${c.border}` }}
              >
                <div className="flex items-center gap-1 mb-2">
                  <Video className="w-4 h-4" style={{ color: "#606060" }} />
                  <h3 className="text-base font-bold" style={{ color: c.text }}>
                    Відео ({videoFiles.length})
                  </h3>
                </div>

                <div className="flex flex-col gap-2">
                  {videoFiles.map((file) => (
                    <button
                      key={file.File_GUID}
                      onClick={() => handleVideoClick(file)}
                      className="flex items-center gap-2 p-2 rounded hover:bg-black/5 text-sm transition-colors text-left"
                      style={{ color: c.highlight, border: `1px solid ${c.border}` }}
                      title={file.File_FileName}
                    >
                      <span role="img" aria-label="play">
                        ▶️
                      </span>
                      <span className="truncate">{file.File_FileName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === МОДАЛКА ДЛЯ ФОТО === */}
      {isPhotoModalOpen && (
        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          photos={photoUrls}
          currentIndex={photoIndex}
          setCurrentIndex={setPhotoIndex}
        />
      )}
    </div>
  );
};

export { ComplaintItemDetailViewMobile };
