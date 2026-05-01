import React, { useState, useEffect , useCallback} from "react";
import axiosInstance from "../api/axios";
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaTrash,
  FaEdit,
  FaDownload,
  FaPlus,
  FaSearch,
  FaFolderOpen,
} from "react-icons/fa";
import ConfirmModal from "../components/Orders/ConfirmModal";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../hooks/useNotification";
import "./Files.css";
import { useAuthGetRole } from "../hooks/useAuthGetRole";

// ==========================================================
// КОНСТАНТИ
// ==========================================================
const API_URL = "/media-resources/";
const FILE_RESOURCE_TYPE = "file";

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editNewFile, setEditNewFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);

  const { role } = useAuthGetRole();
  const isAdmin = role === "admin";
  const { addNotification } = useNotification();

  const backgroundImage = "/assets/icons/FileBackground.jpg";
  const searchIcon = "/assets/icons/SearchIcon.png";
  const plusIcon = "/assets/icons/PlusIcon.png";
  const downloadIcon = "/assets/icons/DownloadIcon.png";
  const profileIcon = "/assets/icons/ProfileFilesIcon.png";
  const fileIcon = "/assets/icons/FileIconFilePage.png";

  // Визначаємо, чи активна темна тема
  const isDarkTheme = document.body.classList.contains("dark-theme");


    const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `${API_URL}?resource_type=${FILE_RESOURCE_TYPE}`,
      );
      setFiles(response.data);
      setFilteredFiles(response.data);
    } catch (error) {
      console.error("Помилка завантаження файлів:", error);
      addNotification("Помилка завантаження файлів", "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification]);


  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ====================== Фільтрація ======================
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = files.filter(
        (file) =>
          file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.author?.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
      setFilteredFiles(filtered);
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

  // ====================== Завантаження файлів ======================


  // ====================== Додавання файлу ======================
  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!newFile) return addNotification("Оберіть файл", "error");

    setLoadingAdd(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(",")[1];
      const extension = newFile.name.includes(".")
        ? newFile.name.split(".").pop().toLowerCase()
        : "";

      const payload = {
        title: title || newFile.name.replace(/\.[^/.]+$/, ""),
        resource_type: FILE_RESOURCE_TYPE,
        file_base64: base64String,
        file_extension: extension,
        description: "",
      };

      try {
        await axiosInstance.post(API_URL, payload);
        setAddModalOpen(false);
        setTitle("");
        setNewFile(null);
        fetchFiles();
        addNotification("Файл успішно додано!", "success");
      } catch (error) {
        console.error("Помилка POST:", error.response?.data || error);
        addNotification("Не вдалося додати файл", "error");
      } finally {
        setLoadingAdd(false);
      }
    };
    reader.readAsDataURL(newFile);
  };

  // ====================== Редагування файлу ======================
  const handleEditClick = (file) => {
    setEditingFile(file);
    setEditTitle(file.title);
    setEditNewFile(null);
    setEditModalOpen(true);
  };

  const handleEditConfirm = async (e) => {
    e.preventDefault();
    if (!editingFile) return;

    let payload = { title: editTitle, resource_type: FILE_RESOURCE_TYPE };

    if (editNewFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result.split(",")[1];
        const extension = editNewFile.name.includes(".")
          ? editNewFile.name.split(".").pop().toLowerCase()
          : "";

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
      await axiosInstance.put(`${API_URL}${editingFile.id}/`, payload);
      addNotification("Файл успішно змінено!", "success");
      fetchFiles();
      setEditModalOpen(false);
      setEditingFile(null);
      setEditTitle("");
      setEditNewFile(null);
    } catch (error) {
      console.error("Помилка PUT:", error.response?.data || error);
      addNotification("Не вдалося змінити файл", "error");
    }
  };

  // ====================== Видалення файлу ======================
  const handleDeleteClick = (file) => {
    setSelectedFile(file);
    setDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`${API_URL}${selectedFile.id}/`);
      fetchFiles();
      addNotification(`Файл "${selectedFile.title}" видалено`, "success");
    } catch (error) {
      console.error("Помилка при видаленні:", error);
      addNotification("Не вдалося видалити файл", "error");
    } finally {
      setDeleteModalOpen(false);
    }
  };

  // ====================== Завантаження файлу ======================
  const handleDownload = (file) => {
    if (!file.file_base64) {
      return addNotification(
        "Немає даних для завантаження файлу. Можливо, бекенд не повертає Base64.",
        "error",
      );
    }

    const byteCharacters = atob(file.file_base64);
    const byteNumbers = Array.from(byteCharacters).map((c) => c.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);

    const fileNameWithExt = file.file_extension
      ? `${file.title}.${file.file_extension}`
      : file.title;

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileNameWithExt;
    link.click();
  };

  // ====================== Форматування/Іконки ======================
  const formatDate = (isoString) => {
    if (!isoString) return "Невідомо";
    const date = new Date(isoString);
    return date.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFileIcon = (file) => {
    const ext = file.file_extension?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FaFilePdf className="text-red-600" />;
      case "doc":
      case "docx":
        return <FaFileWord className="text-blue-600" />;
      case "xls":
      case "xlsx":
        return <FaFileExcel className="text-green-600" />;
      default:
        return <FaFileAlt className="text-grey" />;
    }
  };

  // ====================== Стилі для Темної Теми (для умовного рендерингу) ======================
  const darkStyles = {
    searchBoxBg: "#333333",
    searchBoxBorder: "1px dashed #555555",
    searchBoxShadow: "0 2px 8px rgba(0,0,0,0.4)",
    iconColor: "#aaaaaa",
    delimiterBorder: "1px dashed #555",
    fileItemBg: "#2c2c2c",
    fileItemBorder: "1px solid #444",
    fileItemShadow: "0 4px 12px rgba(0,0,0,0.3)",
    lightTextColor: "#f0f0f0",
    lightGreyColor: "#aaa",
  };

  return (
    <div className="file-body column gap-14  items-center" style={{  fontFamily: "'Inter', sans-serif" }}>

  <section className="relative w-full min-h-[300px] flex items-center justify-center overflow-hidden ">
  {/* Фонове зображення */}
  <div className="absolute inset-0 z-0">
    <img src={backgroundImage} className="w-full h-full object-cover" alt="Background" />
    <div className="absolute inset-0 bg-black/50" />
  </div>

  {/* Контентна частина */}
  <div className="relative z-10 pt-[100px] container mx-auto w-[calc(100%-20px)] max-w-[1334px] text-white">
    
    {/* Заголовок завжди по центру */}
    <h1 className="text-[24px] xl:text-[32px] font-bold uppercase tracking-wider text-center">
      Файли
    </h1>

    {/* Рядок з текстом та пошуком */}
{/* Рядок з текстом та правою панеллю управління */}
<div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 relative">
  
  {/* Центрований текст */}
  <p className="text-[16px] xl:text-[20px] font-light text-center leading-tight">
    Корисні матеріали для завантаження: <br />
    сертифікати, протоколи випробувань, будівельні норми тощо.
  </p>

  {/* Права панель: Пошук + Кнопка (якщо адмін) */}
  <div className="flex flex-col items-end gap-3 w-full max-w-[285px] lg:max-w-[250px] lg:absolute md:right-0 md:bottom-0">
    
    {/* Кнопка адміна (з’явиться над пошуком) */}
    {isAdmin && (
      <button
        className="w-full bg-custom-green hover:bg-custom-green-dark text-WS---DarkGrey border border-zinc-300 font-semibold text-lg pl-2 py-2 rounded-[5px] flex items-center  gap-3 transition-colors"
        onClick={() => setAddModalOpen(true)}
      >
        <img src={plusIcon} className="mr-2" /> Додати файл
      </button>
    )}

    {/* Пошук */}
    <div className="relative w-full">
      <input
        type="text"
        placeholder="пошук за назвою"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full py-2.5 px-11 rounded-[5px] bg-white text-zinc-800 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-lime-500"
      />
      <img 
        src={searchIcon} 
        alt="Search" 
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  </div>
</div>
  </div>
</section>


      {/* Header */}
      {/* <div className="flex items-center justify-between mb-4">
          <div className="w-full h-64 left-0 top-0 absolute bg-zinc-300" />
          <img className="w-full h-[499.84px] left-0 top-[-193.80px] absolute" src={backgroundImage}/>
          <div className="w-full h-64 left-0 top-0 absolute bg-black/50" />
          <div className="w-72 h-10 left-[1102px] top-[178px] absolute bg-WS---White rounded-[5px] border border-WS---MiddleGrey" >

             <FaSearch
            style={{
              fontSize: "20px",
              color: isDarkTheme ? darkStyles.iconColor : "#999",
            }}
          />
          <input
            type="text"
            placeholder="Пошук за назвою або автором..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "16px",
              fontWeight: "400",
              padding: "8px 0",
              background: "transparent",
              // Тут немає інлайн-стилю color!
            }}
          />
          </div>
        <h1 className="text-color mt-3 text-4xl font-bold flex items-center gap-3">
          <span className="text-custom-green icon-document-file-pdf  mr-2" />
          <span>Файли</span>
        </h1>
        {isAdmin && (
          <button
            className="bg-custom-green hover:bg-custom-green-dark text-white font-semibold text-lg px-3 py-2 rounded-lg flex items-center gap-3 mt-5"
            onClick={() => setAddModalOpen(true)}
          >
            <FaPlus size={20} /> Додати файл
          </button>
        )}
      </div> */}

      {/* Search */}
      {/* <div className="row gap-14 align-center" style={{ marginBottom: "5px" }}>
        <div
          className="row align-center gap-7 search-box"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "10px",
            // УМОВНА АДАПТАЦІЯ ФОНУ ТА МЕЖ
            // background: isDarkTheme ? darkStyles.searchBoxBg : 'white',
            // border: isDarkTheme ? darkStyles.searchBoxBorder : '1px dashed #ccc',
            // boxShadow: isDarkTheme ? darkStyles.searchBoxShadow : '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <FaSearch
            style={{
              fontSize: "20px",
              color: isDarkTheme ? darkStyles.iconColor : "#999",
            }}
          />
          <input
            type="text"
            placeholder="Пошук за назвою або автором..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "16px",
              fontWeight: "400",
              padding: "8px 0",
              background: "transparent",
              // Тут немає інлайн-стилю color!
            }}
          />
        </div>
      </div> */}

      {/* Розділювач */}


      {/* Files List */}
      {loading ? (
        <div className="align-center" style={{ padding: "50px" }}>
          <div className="loader"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="align-center column" style={{ padding: "50px" }}>
          <div
            className="text-grey"
            style={{
              color: isDarkTheme ? darkStyles.lightGreyColor : undefined,
            }}
          >
            {searchQuery ? "Файлів не знайдено" : "Файлів ще немає"}
          </div>
        </div>
      ) : (
        <div className="column gap-10 max-w-[1334px] items-center justify-center  w-[calc(100%-20px)] ">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`claim-item w-full row align-center  rounded-[5px]   space-between ${isDarkTheme ? "file-item-dark" : ""}`}
              style={{
                // УМОВНА АДАПТАЦІЯ ФОНУ ЕЛЕМЕНТА
                background: isDarkTheme ? darkStyles.fileItemBg : "white",
               
                boxShadow: isDarkTheme
                  ? darkStyles.fileItemShadow
                  : "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
              }}
            >
              <div className="flex !items-start md:!items-center min-h-[70px] flex-1 border-r border-dotted pt-1 pb-1 mr-2">
                {/* <div style={{ fontSize: "28px" }}>{getFileIcon(file)}</div> */}

                <img src={fileIcon}  className="pl-[8px] pr-[8px] md:pl-[17px] md:pr-[17px] h-[25px] md:h-[40px] mt-[6px] md:mt-0"/>
                <div className="column gap-2">
                  {/* АДАПТАЦІЯ КОЛЬОРУ ТЕКСТУ */}
                  <div
                    className="text-WS---DarkGrey font-bold"
                    style={{
                      color: isDarkTheme
                        ? darkStyles.lightTextColor
                        : undefined,
                    }}
                  >
                    {file.title}
                  </div>
                  <div
                    className="row gap-5 items-center justify-start text-grey text-sm"
                    style={{
                      color: isDarkTheme
                        ? darkStyles.lightGreyColor
                        : undefined,
                    }}
                  >

                    <img src={profileIcon} className="pr-[8px]" />
                    {/* <span>{file.author?.full_name || "Невідомо"}</span>  */}
                    <span>Адміністратор</span> 
                    <div className="w-[8px] h-[8px] bg-custom-green rounded-[50%]" />
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex !flex-col lg:!flex-row gap-7 align-center text-[16px] uppercase">
                <button
                  className="button bg-custom-green h-[44px] text-WS---DarkGrey border border-zinc-300 font-semibold text-lg pl-2 py-2 rounded-[5px] flex items-center  gap-3 transition-colors"
                  onClick={() => handleDownload(file)}
                >
                  <img src={downloadIcon} />  <div className="text-[16px] uppercase !hidden md:!block">Завантажити</div>
                </button>

                {isAdmin && (
                  <>
                    <button
                     className="button bg-WS---DarkGreen-Light h-[44px] text-WS---DarkGrey border border-zinc-300 font-semibold text-lg pl-2 py-2 rounded-[5px] flex items-center  gap-3 transition-colors"
                      onClick={() => handleEditClick(file)}
                    >
                      <FaEdit size={25} />      <div className="text-[16px] uppercase !hidden md:!block">Редагувати</div>
                    </button>
                    <button
                      className="button bg-WS---DarkRed h-[44px] text-WS---DarkGrey border border-zinc-300 font-semibold text-lg pl-2 py-2 rounded-[5px] flex items-center  gap-3 transition-colors"
                      onClick={() => handleDeleteClick(file)}
                    >
                      <FaTrash size={25}/> <div className="text-[16px] uppercase !hidden md:!block">Видалити </div>
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
        message={`Ви дійсно хочете видалити файл "${selectedFile?.title}"?`}
        confirmText="Видалити"
        cancelText="Скасувати"
      />

      {/* Add File Modal */}
      {addModalOpen && (
        <div
          className="file-modal-overlay"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="file-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
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

            <form onSubmit={handleAddFile} className="file-form">
              <label className="file-label">
                <span>Назва файлу</span>
                <input
                  type="text"
                  placeholder="Назва файлу..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                {loadingAdd ? (
                  <div className="loader-small"></div>
                ) : (
                  "💾 Завантажити"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit File Modal */}
      {editModalOpen && (
        <div
          className="file-modal-overlay"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="file-modal-window edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="file-modal-header"
              // Видаляємо inline-стилі, щоб дозволити CSS-класу .edit-modal .file-modal-header працювати коректно.
            >
              <div className="header-content">
                <div className="file-icon">✏️</div>
                <h3>Редагувати файл</h3>
              </div>
              <button
                className="file-close-btn"
                onClick={() => setEditModalOpen(false)}
                aria-label="Закрити"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditConfirm} className="file-form">
              <label className="file-label">
                <span>Назва файлу</span>
                <input
                  type="text"
                  placeholder="Назва файлу..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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
              <button
                type="button"
                className="file-btn-cancel"
                onClick={() => setEditModalOpen(false)}
              >
                ✕ Скасувати
              </button>
              <button
                type="button"
                className="file-btn-save edit-btn"
                onClick={handleEditConfirm}
              >
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
