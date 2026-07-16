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
import { useTranslation } from 'react-i18next';



import { useNotification } from "../hooks/useNotification";
import "./Files.css";
import { useAuthGetRole } from "../hooks/useAuthGetRole";

const API_URL = "/media-resources/";
const FILE_RESOURCE_TYPE = "file";

const FilesPage = () => {
  const { t, i18n} = useTranslation();
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [editingFile, setEditingFile] = useState(null);
  const [editTitles, setEditTitles] = useState({ ua: "", en: "", it: "", de: "" });
  const [editDescriptions, setEditDescriptions] = useState({ ua: "", en: "", it: "", de: "" });
  const [editNewFile, setEditNewFile] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);

  const [editTitle, setEditTitle] = useState("");


  const { role } = useAuthGetRole();
  const isAdmin = role === "admin";
  const { addNotification } = useNotification();

  const backgroundImage = "/assets/icons/FileBackground.jpg";
  const searchIcon = "/assets/icons/SearchIcon.png";
  const plusIcon = "/assets/icons/PlusIcon.png";
  const downloadIcon = "/assets/icons/DownloadIcon.png";
  const profileIcon = "/assets/icons/ProfileFilesIcon.png";
  const fileIcon = "/assets/icons/FileIconFilePage.png";


  const [titles, setTitles] = useState({ ua: "", en: "", it: "", de: "" });
  const [descriptions, setDescriptions] = useState({ ua: "", en: "", it: "", de: "" });


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
      if (process.env.NODE_ENV === "development") {
      console.error(t('files.errors.download'), error);
      }
      addNotification(t('files.errors.download'), "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification, t]);


  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);


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


  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!newFile) return addNotification(t('files.choose_file'), "error");
    if (!titles.ua) return addNotification(t("files.errors.required_ua_title"), "warning");

    setLoadingAdd(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(",")[1];
      const extension = newFile.name.split(".").pop().toLowerCase();

      // Шлемо окремі поля, які ViewSet запакує в JSON
      const payload = {
        title_ua: titles.ua,
        title_en: titles.en,
        title_it: titles.it,
        title_de: titles.de,
        description_ua: descriptions.ua,
        description_en: descriptions.en,
        description_it: descriptions.it,
        description_de: descriptions.de,
        resource_type: FILE_RESOURCE_TYPE,
        file_base64: base64String,
        file_extension: extension,
      };

      try {
        await axiosInstance.post(API_URL, payload);
        setAddModalOpen(false);
        setTitles({ ua: "", en: "", it: "", de: "" });
        setDescriptions({ ua: "", en: "", it: "", de: "" });
        setNewFile(null);
        fetchFiles();
        addNotification(t('files.feedback.success'), "success");
      } catch (error) {
        addNotification(t('files.errors.error_add_file'), "error");
      } finally {
        setLoadingAdd(false);
      }
    };
    reader.readAsDataURL(newFile);
  };


  const handleEditClick = (file) => {
    setEditingFile(file);
    setEditTitles({
      ua: file.titles?.ua || "",
      en: file.titles?.en || "",
      it: file.titles?.it || "",
      de: file.titles?.de || "",
    });
    setEditDescriptions({
      ua: file.descriptions?.ua || "",
      en: file.descriptions?.en || "",
      it: file.descriptions?.it || "",
      de: file.descriptions?.de || "",
    });
    setEditNewFile(null);
    setEditModalOpen(true);
  };

  const handleEditConfirm = async (e) => {
    e.preventDefault();
    if (!editTitles.ua) return addNotification(t("files.errors.required_ua_title"), "warning");

    setLoadingEdit(true);
    const payload = {
      title_ua: editTitles.ua,
      title_en: editTitles.en,
      title_it: editTitles.it,
      title_de: editTitles.de,
      description_ua: editDescriptions.ua,
      description_en: editDescriptions.en,
      description_it: editDescriptions.it,
      description_de: editDescriptions.de,
      resource_type: FILE_RESOURCE_TYPE,
    };

    const sendRequest = async (finalPayload) => {
      try {
        await axiosInstance.put(`${API_URL}${editingFile.id}/`, finalPayload);
        addNotification(t('files.feedback.edit'), "success");
        fetchFiles();
        setEditModalOpen(false);
      } catch (error) {
        addNotification(t('files.errors.error_change_file'), "error");
      } finally {
        setLoadingEdit(false);
      }
    };

    if (editNewFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        payload.file_base64 = reader.result.split(",")[1];
        payload.file_extension = editNewFile.name.split(".").pop().toLowerCase();
        await sendRequest(payload);
      };
      reader.readAsDataURL(editNewFile);
    } else {
      await sendRequest(payload);
    }
  };


  const sendEditRequest = async (payload) => {
    try {
      await axiosInstance.put(`${API_URL}${editingFile.id}/`, payload);
      addNotification(t('files.errors.error'), "success");
      fetchFiles();
      setEditModalOpen(false);
      setEditingFile(null);
      setEditTitle("");
      setEditNewFile(null);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(t('files.errors.error'), error.response?.data || error);
      }
      addNotification(t('files.errors.error_change_file'), "error");
    }
  };


  const handleDeleteClick = (file) => {
    setSelectedFile(file);
    setDeleteModalOpen(true);
  };
 const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`${API_URL}${selectedFile.id}/`);
      fetchFiles();
      addNotification(t("files.feedback.deleted"), "success");
    } catch (error) {
      addNotification(t("files.errors.delete"), "error");
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleDownload = (file) => {
    if (!file.file_base64) return addNotification(t("files.errors.no_file_data"), "error");
    const byteCharacters = atob(file.file_base64);
    const byteNumbers = Array.from(byteCharacters).map((c) => c.charCodeAt(0));
    const blob = new Blob([new Uint8Array(byteNumbers)]);
    const fileName = file.file_extension ? `${file.titles[i18n.language] || file.titles.ua}.${file.file_extension}` : "file";
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const formatDate = (isoString, lng = "uk-UA") => {


    if (!isoString) return t("files.unknownDate");
    const date = new Date(isoString);
    const locale = lng === "en" ? "en-US" : lng === "de" ? "de-DE" : "uk-UA";
    return date.toLocaleDateString(locale, {
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


  const darkStyles = {
    searchBoxBg: "#797E86",
    searchBoxBorder: "1px solid #6E6963",
    searchBoxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    iconColor: "#DDD8D3",
    delimiterBorder: "1px solid #6E6963",
    fileItemBg: "#868179",
    fileItemBorder: "1px solid #6E6963",
    fileItemShadow: "0 10px 24px rgba(0,0,0,0.18)",
    lightTextColor: "#F5F3F1",
    lightGreyColor: "#DDD8D3",
  };

  return (
    <div className="file-body column gap-14  items-center" style={{  fontFamily: "'Inter', sans-serif" }}>

  <section className="relative w-full min-h-[300px] flex items-center justify-center overflow-hidden ">

  <div className="absolute inset-0 z-0">
    <img src={backgroundImage} className="w-full h-full object-cover" alt={t("files.hero_bg_alt")} />
    <div className="absolute inset-0 bg-black/50" />
  </div>

  <div className="relative z-10 pt-[100px] container mx-auto w-[calc(100%-20px)] max-w-[1334px] text-white">
    

    <h1 className="text-[24px] xl:text-[32px] font-bold uppercase tracking-wider text-center">
       {t('files.header.title')}
    </h1>

<div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 relative">
  

  <p className="text-[16px] xl:text-[20px] font-light text-center leading-tight">
     {t('files.header.subtitle_1')} <br />
    {t('files.header.subtitle_2')}
  </p>


  <div className="flex flex-col items-end gap-3 w-full max-w-[285px] lg:max-w-[250px] lg:absolute md:right-0 md:bottom-0">

    {isAdmin && (
      <button
        className="w-full bg-custom-green hover:bg-custom-green-dark text-WS---DarkGrey border border-zinc-300 font-semibold text-lg pl-2 py-2 rounded-[5px] flex items-center  gap-3 transition-colors"
        onClick={() => setAddModalOpen(true)}
      >
        <img src={plusIcon} className="mr-2" /> {t('files.buttons.add')}
      </button>
    )}

    <div className="relative w-full files-search-shell">
      <input
        type="text"
        placeholder={t('files.searchPlaceholder')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="files-search-input w-full py-2.5 px-11 rounded-[5px] bg-white text-zinc-800 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-lime-500"
      />
      <img 
        src={searchIcon} 
        alt={t("files.search_alt")} 
        className="files-search-icon absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
            {searchQuery ? t("files.noResults") : t("files.empty")}
          </div>
        </div>
      ) : (
        <div className="column gap-10 max-w-[1334px] items-center justify-center  w-[calc(100%-20px)] ">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`claim-item w-full row align-center  rounded-[5px]   space-between ${isDarkTheme ? "file-item-dark" : ""}`}
              style={{
               
                background: isDarkTheme ? darkStyles.fileItemBg : "white",
               
                boxShadow: isDarkTheme
                  ? darkStyles.fileItemShadow
                  : "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
              }}
            >
              <div className="flex !items-start md:!items-center min-h-[70px] flex-1 border-r border-dotted pt-1 pb-1 mr-2">
              

                <img src={fileIcon}  className="pl-[8px] pr-[8px] md:pl-[17px] md:pr-[17px] h-[25px] md:h-[40px] mt-[6px] md:mt-0"/>
                <div className="column gap-2">
                
                  <div
                    className="text-WS---DarkGrey font-bold"
                    style={{
                      color: isDarkTheme
                        ? darkStyles.lightTextColor
                        : undefined,
                    }}
                  >
                    {file.titles[i18n.language] || file.titles.ua}
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
                   
                    <span>{t('files.adminRole')}</span> 
                    <div className="w-[8px] h-[8px] bg-custom-green rounded-[50%]" />
                    <span>{formatDate(file.created_at, i18n.language)}</span>
                  </div>
                </div>
              </div>

              <div className="flex !flex-col lg:!flex-row gap-7 align-center text-[16px] uppercase">
                <button
                  className="button bg-custom-green h-[44px] text-WS---DarkGrey border border-zinc-300 font-semibold text-lg pl-2 py-2 rounded-[5px] flex items-center  gap-3 transition-colors"
                  onClick={() => handleDownload(file)}
                >
                  <img src={downloadIcon} />  <div className="text-[16px] uppercase !hidden md:!block">{t('files.buttons.download')}</div>
                </button>

                {isAdmin && (
                  <>
                    <button
                     className="button bg-WS---DarkGreen-Light h-[44px] text-WS---DarkGrey border border-zinc-300 font-semibold text-lg pl-2 py-2 rounded-[5px] flex items-center  gap-3 transition-colors"
                      onClick={() => handleEditClick(file)}
                    >
                      <FaEdit size={25} />      <div className="text-[16px] uppercase !hidden md:!block">{t('files.buttons.edit')}</div>
                    </button>
                    <button
                      className="button bg-WS---DarkRed h-[44px] text-WS---DarkGrey border border-zinc-300 font-semibold text-lg pl-2 py-2 rounded-[5px] flex items-center  gap-3 transition-colors"
                      onClick={() => handleDeleteClick(file)}
                    >
                      <FaTrash size={25}/> <div className="text-[16px] uppercase !hidden md:!block">{t('files.buttons.delete')}</div>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

  
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        type="danger"
        title={t("files.feedback.deleteFile")}
        message={t("files.feedback.confirmDeleteMessage")}
        confirmText={t("files.buttons.delete")}
        cancelText={t("files.buttons.cancel")}
      />

        {addModalOpen && (
        <div className="file-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="file-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h3>{t('files.buttons.add')}</h3>
              <button className="file-close-btn" onClick={() => setAddModalOpen(false)}>✕</button>
            </div>
            <form className="file-form p-4 column gap-4" onSubmit={handleAddFile}>
              <div className="column gap-2">
                <label>{t("files.labels.title_ua")}</label>
                <input type="text" value={titles.ua} onChange={e => setTitles({...titles, ua: e.target.value})} required className="file-input" />
              </div>
              <div className="column gap-2">
                <label>{t("files.labels.title_en")}</label>
                <input type="text" value={titles.en} onChange={e => setTitles({...titles, en: e.target.value})} className="file-input" />
              </div>
              <div className="column gap-2">
                <label>{t("files.labels.title_de")}</label>
                <input type="text" value={titles.de} onChange={e => setTitles({...titles, de: e.target.value})} className="file-input" />
              </div>
              <div className="column gap-2">
                <label>{t('files.choose_file')}</label>
                <input type="file" onChange={e => setNewFile(e.target.files[0])} className="file-input" />
              </div>
              <div className="file-modal-footer">
                <button className="file-btn-cancel" type="button" onClick={() => setAddModalOpen(false)}>{t('files.buttons.cancel')}</button>
                <button className="file-btn-save" type="submit" disabled={loadingAdd}>{loadingAdd ? t("files.buttons.uploading") : t('files.buttons.upload')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

     {editModalOpen && (
        <div className="file-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="file-modal-window edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <div className="header-content"><FaEdit className="mr-2" /><h3>{t('files.buttons.edit')}</h3></div>
              <button className="file-close-btn" onClick={() => setEditModalOpen(false)}>✕</button>
            </div>
            <form className="file-form p-4 column gap-4" onSubmit={handleEditConfirm}>
              <div className="column gap-1"><label>{t("files.labels.title_ua")}</label><input type="text" value={editTitles.ua} onChange={e => setEditTitles({...editTitles, ua: e.target.value})} className="file-input" required /></div>
              <div className="column gap-1"><label>{t("files.labels.title_en")}</label><input type="text" value={editTitles.en} onChange={e => setEditTitles({...editTitles, en: e.target.value})} className="file-input" /></div>
              <div className="column gap-1"><label>{t("files.labels.title_de")}</label><input type="text" value={editTitles.de} onChange={e => setEditTitles({...editTitles, de: e.target.value})} className="file-input" /></div>
              <div className="column gap-1"><label>{t("files.labels.change_file_optional")}</label><input type="file" onChange={e => setEditNewFile(e.target.files[0])} className="file-input" /></div>
              <div className="file-modal-footer">
                <button className="file-btn-cancel" type="button" onClick={() => setEditModalOpen(false)}>{t('files.buttons.cancel')}</button>
                <button className="file-btn-save edit-btn" type="submit" disabled={loadingEdit}>{loadingEdit ? t("files.buttons.saving") : t('files.buttons.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;
