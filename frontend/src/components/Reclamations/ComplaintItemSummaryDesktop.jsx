import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../hooks/useTheme";
import {
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import axiosInstance from "../../api/axios";
import PhotoModal from "./PhotoModal";
import { formatDate } from "../../utils/formatters";

import { useNotification } from "../../hooks/useNotification";



const InfoRow = ({
  label,
  value,
  highlight,
  isLastInRow = false,
  isFirstInRow = false,
  className = "",
  style = {},
  colors,
}) => (
  <div
    className={`flex flex-col justify-start py-1 font-['Inter'] flex-1 ${
      !isFirstInRow ? "pl-4" : "pl-0"
    } ${className}`}
    style={{
      minWidth: "150px",
      borderRight: isLastInRow ? "none" : `1px dotted ${colors.border}`,
      ...style,
    }}
  >

    {label && (
      <span 
        className="text-xs mb-1" 
        style={{ color: colors.label }}
      >
        {label}:
      </span>
    )}

   
    <span
      className={`text-sm leading-tight ${highlight ? "font-extrabold" : "font-bold"}`}
      style={{
        color: highlight
          ? colors.highlight
          : value
          ? colors.value
          : colors.empty, 
        textAlign: "left",
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
    <div className="flex flex-wrap w-full font-['Inter',_sans-serif]">
      {childrenArray.map((child, index) => {

        const isFirst = index === 0;

        const isLastInRow =
          (index + 1) % columns === 0 || index === totalItems - 1;
        
        const isLastInGroup =
          index >=
          totalItems -
            (totalItems % columns === 0 ? columns : totalItems % columns);

        return React.cloneElement(child, {
          key: index,
          isFirst, 
          isLastInRow,
          isLastInGroup:
            isLastInGroup &&
            (index === totalItems - 1 ||
              (totalItems <= columns && index + 1 === totalItems)),
          colors,
         
          className: `${child.props.className || ''} ${isFirst ? '!pl-0' : ''}`.trim(),
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
        isFirstInRow: true,
        isLastInRow: true,
        isLastInGroup,
        style: { minWidth: "auto", borderRight: "none" },
        colors,
      }),
    )}
  </div>
);

const colorsSet = {
  light: {
    background: "#f3f3f3",
    sectionBg: "#cfdcef99",
    sectionBgDates: "#FFF9EC",
    sectionBgManager: "#EDE7F6",
    sectionBgProblem: "#FFDFD0",
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

const isImage = (name) => /\.(jpg|jpeg|png|webp)$/i.test(name);
const isVideo = (name) => /\.(mp4|webm|ogg)$/i.test(name);



const ComplaintItemDetailView = ({ complaint }) => {
  const { theme } = useTheme();
  const c = theme === "dark" ? colorsSet.dark : colorsSet.light;
  const { addNotification } = useNotification();

  const [files, setFiles] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]); // Масив URL з токенами для модалки
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  const imageFiles = files.filter((f) => isImage(f.File_FileName));
  const videoFiles = files.filter((f) => isVideo(f.File_FileName));

  const problemIcon = "/assets/icons/ProblemIcon.png";
  const mainReclamationIcon = "/assets/icons/MainReclamationIcon.png";
  const dateReclamation = "/assets/icons/DateReclamation.png";
  const mainManager = "/assets/icons/MainManager.png";
  const deleteIcon = "/assets/icons/DeleteIcon.png";
  const successIcon = "/assets/icons/SuccessIcon.png";
  const photoIcon = "/assets/icons/PhotoIcon.png";

  const loadFiles = useCallback(async () => {
    if (!complaint?.guid) return;

    try {
      const res = await axiosInstance.get(
        `/complaints/${complaint.guid}/files/`,
      );
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Error loading files list:", err);

      addNotification(
        <div className="flex flex-col gap-2 items-center text-center">
          <span>Не вдалося завантажити медіа-файли рекламації.</span>
          <button
            onClick={() => loadFiles()}
            className="bg-white text-red-600 px-3 py-1.5 rounded text-xs font-bold w-fit shadow-md active:scale-95 transition-transform"
          >
            Спробувати ще раз
          </button>
        </div>,
        "warning",
        0,
      );
    }
  }, [complaint?.guid, addNotification]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);


  const getSecureUrl = useCallback(
    async (file) => {
      try {
        const res = await axiosInstance.post("/complaints/media-token/", {
          file_guid: file.File_GUID,
        });
        const token = res.data.token;
        const safeToken = encodeURIComponent(token);

        // Переконайтеся, що URL формується правильно
        return `${window.location.origin}/api/complaints/${complaint.guid}/files/preview/?filename=${encodeURIComponent(file.File_FileName)}&token=${safeToken}`;
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
        console.error("❌ Token error:", file?.File_FileName, e);
        }
        return null; 
      }
    },
    [complaint?.guid],
  );

  const handleVideoClick = async (file) => {
    const url = await getSecureUrl(file);
    if (!url) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };


  const handlePhotoClick = async (index) => {
    if (imageFiles.length === 0) return;

    setIsMediaLoading(true);
    try {
      const urls = await Promise.all(
        imageFiles.map((file) => getSecureUrl(file)),
      );
      const validUrls = urls.filter((u) => u !== null);

      if (validUrls.length > 0) {
        setPhotoUrls(validUrls);
        setPhotoIndex(index);
        setPhotoOpen(true);
      } else {
        addNotification("Не вдалося відкрити фото для перегляду", "warning");
      }
    } catch  {
      addNotification("Сталася помилка при завантаженні зображень", "danger");
    } finally {
      setIsMediaLoading(false);
    }
  };

  return (
    <div className="w-full font-['Inter',_sans-serif]" >
      <div
        className=""

      >
        <div className="flex flex-col gap-3 mt-1">
     
          <div className="space-y-3">
            <div
              className="rounded p-0 overflow-hidden"
        
            >
<h3
  className="text-base font-bold mb-0 py-1 flex items-center"
  style={{
    color: c.text,
   
    display: "flex",
    alignItems: "center",
    width: "100%",
  }}
>
  <img 
    src={mainReclamationIcon} 
    alt="Іконка" 
    className="mr-1" 
  />
  
  <span style={{ whiteSpace: "nowrap" }}>
    Основна інформація
  </span>

 
<div 
  style={{
    flex: 1,
    marginLeft: "10px",
    height: "1.5px",
    backgroundColor: "#4A4A4A",
    opacity: 0.8,
    transform: "translateY(4px)", 
  }} 
/>
</h3>
              <HorizontalInfoGroup columns={4} colors={c}>
                <InfoRow
                  label="Номер рекламації"
                  className="!pl-0"
                  value={complaint.number}
                  colors={c}
                />
                <InfoRow
                  label="Номер акту"
                  value={complaint.actNumber}
                  colors={c}
                />
                <InfoRow
                  label="Номер замовлення"
                  value={complaint.orderNumber}
                  colors={c}
                />

                <InfoRow
                  label="Організація"
                  value={complaint.organization}
                  colors={c}
                />

              </HorizontalInfoGroup>
             
              
            </div>
          </div>


                    <div className="space-y-3">
            <div
              className="rounded p-0 overflow-hidden"
        
            >
<h3
  className="text-base font-bold mb-0 py-1 flex items-center"
  style={{
    color: c.text,
    display: "flex",
    alignItems: "center",
    width: "100%",
  }}
>
  <img 
    src={mainReclamationIcon} 
    alt="Іконка" 
    className="mr-1" 
  />
  
  <span style={{ whiteSpace: "nowrap" }}>
    Серії конструкцій
  </span>


<div 
  style={{
    flex: 1,
    marginLeft: "10px",
    height: "2px",
    backgroundColor: "#4A4A4A",
    opacity: 0.8,
    transform: "translateY(4px)", 
  }} 
/>
</h3>

             
              <FullWidthInfoGroup isLastInGroup={true} colors={c}>
                <InfoRow
                  // label="Серії конструкцій"
                  value={complaint.series}
                  colors={c}
                />
              </FullWidthInfoGroup>
            </div>
          </div>


 
          <div className="space-y-3">
            <div
              className="rounded p-0 overflow-hidden"
           
            >
              <h3
                className="text-base font-bold mb-0 py-1 flex items-center "
                style={{
                  color: c.text
                }}
              >
                 <img 
                  src={dateReclamation} 
                  alt="Іконка" 
                  className="mr-1" 
                />
                Дати

                <div 
  style={{
    flex: 1,
    marginLeft: "10px",
    height: "1.5px",
    backgroundColor: "#4A4A4A",
    opacity: 0.8,
    transform: "translateY(4px)", 
  }} 
/>
              </h3>


              <HorizontalInfoGroup columns={5} colors={c}>
                <InfoRow
                  label="Дата рекламації"
                  value={formatDate(complaint.date)}
                  colors={c}
                />
                <InfoRow
                  label="Дата доставки"
                  value={formatDate(complaint.deliveryDate)}
                  colors={c}
                />
                <InfoRow
                  label="Дата виявлення"
                  value={formatDate(complaint.determinationDate)}
                  colors={c}
                />
                {complaint.producedDate &&
                  complaint.producedDate !== "Не вказано" && (
                    <InfoRow
                      label="Виготовлено"
                      value={formatDate(complaint.producedDate)}
                      colors={c}
                    />
                  )}
                {complaint.soldDate && complaint.soldDate !== "Не вказано" && (
                  <InfoRow
                    label="Відвантажено"
                    value={formatDate(complaint.soldDate)}
                    colors={c}
                  />
                )}
              </HorizontalInfoGroup>
            </div>
          </div>

<div 
  style={{
    width: "100%",    
    height: "2px",   
    backgroundColor: "#4A4A4A", 
    margin: "10px 0",   
    opacity: 0.8        
  }} 
/>



          

          <div
            className="rounded py-1 flex items-center justify-start gap-6"
    
          >
            <div
              className="flex items-center gap-3 flex-shrink-0"
              style={{ color: c.text }}
            >
               <img 
                src={mainManager} 
                alt="Іконка" 
                className="mr-1" 
              />
              <h3 className="text-base font-bold">Відповідальний менеджер:</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm font-medium" style={{ color: c.text }}>
                {complaint.manager || "Не вказано"}
              </div>
            </div>
          </div>

        <div 
  style={{
    width: "100%",      
    height: "2px",      
    backgroundColor: "#4A4A4A", 
    margin: "10px 0",   
    opacity: 0.8       
  }} 
/>



          <div className="space-y-3">
            {complaint.description && (
              <div
                className=" py-1"
      
              >
                <h3
                  className="text-base font-bold mb-0.5"
                  style={{ color: c.text }}
                >
                  Опис рекламації
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: c.text }}
                >
                  {complaint.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {complaint.problem && (
                <div
                  className=" p-3"
                  style={{
                    backgroundColor: c.sectionBgProblem,
            
                  }}
                >
 <div className="flex flex-col gap-1">
    

    <div className="flex items-center">
      <img 
        src={problemIcon} 
        className="mr-2 " 
        alt="problem" 
      />
      <h4 className="font-bold text-[#BA523B] text-[16px] leading-none">
        Проблема
      </h4>
    </div>

    <p className="text-[13px] text-WS---DarkGrey leading-relaxed">
      {complaint.problem}
    </p>
    
  </div>
                </div>
              )}
              {complaint.resolution && (
                <div
                  className=" p-3"
                  style={{
                    backgroundColor: c.sectionBgResolution,
                
                  }}
                >
                 <div className="flex flex-col  gap-1"> 
             
                <div className="flex items-center">
                  <img 
                    src={successIcon} 
                    className="mr-2 " 
                    alt="success" 
                  />
                  <h4 className="font-bold text-[#516C00] text-[16px] leading-none">
                    Вирішення
                  </h4>
                </div>

            
                <p className="text-[13px] text-WS---DarkGrey  leading-relaxed">
                  {complaint.resolution}
                </p>
              </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {imageFiles.length > 0 && (
              <div
                className=" py-2"
        
              >
                <div className="flex items-center gap-1.5 mb-3">
                   <img 
                    src={photoIcon} 
                    alt="Іконка" 
                    className="mr-1" 
                  />
                  <h3 className="text-base font-bold" style={{ color: c.text }}>
                    Фото ({imageFiles.length}) {isMediaLoading && "..."}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {imageFiles.map((file, idx) => (
                    <div
                      key={file.File_GUID}
                      className={`relative w-28 h-28 rounded-lg bg-gray-100 overflow-hidden flex flex-col items-center justify-center hover:opacity-80 transition-opacity cursor-pointer border ${isMediaLoading ? "cursor-wait opacity-50" : ""}`}
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

            {videoFiles.length > 0 && (
              <div
                className="rounded py-1"
           
              >
                <div className="flex items-center gap-1.5 mb-2">
                   <img 
                    src={photoIcon} 
                    alt="Іконка" 
                    className="mr-1" 
                  />
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
                      style={{
                        color: c.highlight,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <span role="img" aria-label="play">
                        
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
