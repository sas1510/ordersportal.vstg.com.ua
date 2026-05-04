import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../hooks/useTheme";
import { ImageIcon, Video } from "lucide-react";
import axiosInstance from "../../api/axios";
import PhotoModal from "./PhotoModal";
import { formatDate } from "../../utils/formatters";
import { useNotification } from "../../hooks/useNotification";


const MobileInfoRow = ({ label, value, highlight, colors }) => {
  if (!value && !label) return null;
  return (
    <div className="flex justify-between items-start px-4 py-0.5 font-['Inter']">
      {label && (
        <span className="text-[14px] text-WS---DarkGrey mr-2 whitespace-nowrap">
          {label}:
        </span>
      )}
      <span
        className={`text-[15px] text-right ${highlight ? "font-extrabold" : "font-bold"}`}
        style={{ color: highlight ? colors.highlight : colors.value }}
      >
        {value || "Не вказано"}
      </span>
    </div>
  );
};

const ComplaintItemDetailViewMobile = ({ complaint }) => {
  const { theme } = useTheme();
  const colorsSet = {
  light: {
    background: "#f3f3f3",
    sectionBg: "#cfdcef99",
    sectionBgDates: "#FFF9EC",
    sectionBgManager: "#EDE7F6",
    sectionBgProblem: "#FFDFD0",
    sectionBgResolution: "#F0F4DB",
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

  const c = theme === "dark" ? colorsSet.dark : colorsSet.light;
  const { addNotification } = useNotification();

  const [files, setFiles] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  
  const isImage = (name) => /\.(jpg|jpeg|png|webp)$/i.test(name);
  const isVideo = (name) => /\.(mp4|webm|ogg)$/i.test(name);


  const imageFiles = files.filter((f) => isImage(f.File_FileName));
  const videoFiles = files.filter((f) => isVideo(f.File_FileName));


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


  const icons = {
    main: "/assets/icons/MainReclamationIcon.png",
    dates: "/assets/icons/DateReclamation.png",
    manager: "/assets/icons/MainManager.png",
    photo: "/assets/icons/PhotoIcon.png",
    problem: "/assets/icons/ProblemIcon.png",
    success: "/assets/icons/SuccessIcon.png",
  };

  const loadFiles = useCallback(async () => {
    if (!complaint?.guid) return;
    try {
      const res = await axiosInstance.get(`/complaints/${complaint.guid}/files/`);
      setFiles(res.data.files || []);
    } catch (err) {
      addNotification("Помилка завантаження медіа", "warning");
    }
  }, [complaint?.guid, addNotification]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const getSecureUrl = useCallback(async (file) => {
    try {
      const res = await axiosInstance.post("/complaints/media-token/", { file_guid: file.File_GUID });
      return `${window.location.origin}/api/complaints/${complaint.guid}/files/preview/?filename=${encodeURIComponent(file.File_FileName)}&token=${encodeURIComponent(res.data.token)}`;
    } catch (e) { return null; }
  }, [complaint?.guid]);

  const handlePhotoClick = async (index) => {
    setIsMediaLoading(true);
    const urls = await Promise.all(imageFiles.map(file => getSecureUrl(file)));
    const validUrls = urls.filter(u => u !== null);
    if (validUrls.length > 0) {
      setPhotoUrls(validUrls);
      setPhotoIndex(index);
      setPhotoOpen(true);
    }
    setIsMediaLoading(false);
  };

  return (
    <div className="w-full font-['Inter',_sans-serif] text-WS---DarkGrey bg-white ">
      <div className="flex flex-col gap-4">
        
   
        <section>
          <div className="flex items-center gap-2 mb-2">
            <img src={icons.main} className="mr-1" alt="" />
            <h3 className="font-bold text-[16px] whitespace-nowrap">Основна інформація</h3>
            <div 
  style={{
    flex: 1,
    marginLeft: "8px",
    height: "2px",
    backgroundColor: "#44403E",
    opacity: 0.8,
    // Рухаємо лінію вниз на 3-5 пікселів
    transform: "translateY(4px)", 
  }} 
/>
          </div>
          <div className="flex flex-col">
            <MobileInfoRow label="Номер рекламації" value={complaint.number} colors={c} />
            <MobileInfoRow label="Номер акту" value={complaint.actNumber} colors={c} />
            <MobileInfoRow label="Номер замовлення" value={complaint.orderNumber} colors={c} />
            <MobileInfoRow label="Організація" value={complaint.organization} colors={c} />
            {/* <MobileInfoRow label="Серії конструкцій" value={complaint.series} colors={c} /> */}
          </div>
        </section>

   
        <section>
          <div className="flex items-center gap-2 mb-2">
            <img src={icons.main} className="mr-1" alt="" />
            <h3 className="font-bold text-[16px] whitespace-nowrap">Серії конструкцій</h3>
             <div 
            style={{
              flex: 1,
              marginLeft: "8px",
              height: "2px",
              backgroundColor: "#44403E",
              opacity: 0.8,
        
              transform: "translateY(4px)", 
            }} 
          />
          </div>
          <div className="flex flex-col">
             <MobileInfoRow  value={complaint.series} colors={c} />
          
          </div>
        </section>


           <section>
          <div className="flex items-center gap-2 mb-2">
            <img src={icons.dates} className="mr-1" alt="" />
            <h3 className="font-bold text-[16px] whitespace-nowrap">Дати</h3>
             <div 
            style={{
              flex: 1,
              marginLeft: "8px",
              height: "2px",
              backgroundColor: "#44403E",
              opacity: 0.8,
           
              transform: "translateY(4px)", 
            }} 
          />
          </div>
          <div className="flex flex-col">
            <MobileInfoRow label="Дата рекламації" value={formatDate(complaint.date)} colors={c} />
            <MobileInfoRow label="Дата доставки" value={formatDate(complaint.deliveryDate)} colors={c} />
            <MobileInfoRow label="Дата виявлення" value={formatDate(complaint.determinationDate)} colors={c} />
            <MobileInfoRow label="Виготовлено" value={formatDate(complaint.producedDate)} colors={c} />
            <MobileInfoRow label="Відвантажено" value={formatDate(complaint.soldDate)} colors={c} />
          </div>
        </section>

       
        <section className="border-t-[2px] border-gray-800 pt-3">
          <div className="flex items-center gap-2 mb-1">
            <img src={icons.manager} className="mr-1" alt="" />
            <h3 className="font-bold text-[16px]">Відповідальний менеджер:</h3>
          </div>
          <p className="text-[14px] text-gray-600 pl-7">{complaint.manager || "Не вказано"}</p>
        </section>

       
        <section className="border-t-[2px] border-gray-800 pt-3">
          <h3 className="font-bold text-[16px] mb-1">Опис рекламації</h3>
          <p className="text-[14px] leading-relaxed text-gray-700 pl-2">
            {complaint.description || "Опис відсутній"}
          </p>
        </section>

 
        <div className="flex flex-col gap-2">
          {complaint.problem && (
           <div className="p-3 rounded" style={{ backgroundColor: c.sectionBgProblem }}>
            <div className="flex flex-col gap-1">
              
         
              <div className="flex items-center">
                <img 
                  src={icons.problem} 
                  className="mr-2 " 
                  alt="problem" 
                />
                <h4 className="font-bold text-[#BA523B] text-[14px] leading-none">
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
            <div className="p-3 rounded mt-2" style={{ backgroundColor: c.sectionBgResolution }}>
              <div className="flex flex-col  gap-1"> 
           
                <div className="flex items-center">
                  <img 
                    src={icons.success} 
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

          <div className="space-y-3">
            {imageFiles.length > 0 && (
              <div
                className=" py-2"
        
              >
                <div className="flex items-center gap-1.5 mb-3">
                   <img 
                    src={icons.photo} 
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
                      className={`relative w-[70px] h-[70px]  bg-gray-100 overflow-hidden flex flex-col items-center justify-center hover:opacity-80 transition-opacity cursor-pointer border ${isMediaLoading ? "cursor-wait opacity-50" : ""}`}
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
                    src={icons.photo} 
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

export { ComplaintItemDetailViewMobile };