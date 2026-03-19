import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axios";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Loader2, Copy, Check, X, ShieldCheck, 
  UserSearch, Smartphone, Mail, Calendar 
} from "lucide-react";
import "./InviteRegisterModal.css";
import { useNotification } from "../components/notification/Notifications";

export default function CreateUserInvitationModal({ onClose, onCreated }) {
  const { addNotification } = useNotification();
  const searchRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    role: "admin",
    userGuid: "",
    expireDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
  });

  const [users1c, setUsers1c] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdData, setCreatedData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);

  const filteredUsers = users1c.filter(user => 
    !searchTerm || user.Code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Завантаження користувачів з 1С
  useEffect(() => {
    const fetchUsers1c = async () => {
      setLoadingUsers(true);
      try {
        const res = await axiosInstance.get("/users/get_active_users_1c");
        setUsers1c(res.data.users || []);
      } catch (err) {
        console.error(err);
        addNotification("Помилка завантаження бази 1С", "error");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers1c();
  }, [addNotification]);

  // Закриття списку при кліку поза полем
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser1c = (selectedGuid) => {
    const user = users1c.find((u) => u.Link === selectedGuid);
    if (user) {
      setFormData(prev => ({ ...prev, userGuid: selectedGuid }));
      setSearchTerm(user.Code);
    }
    setIsListOpen(false);
  };

  // Універсальна функція копіювання (Працює всюди)
  const performCopyAction = (text, successMsg) => {
    if (!text) return;

    const fallbackCopy = (txt) => {
      const textArea = document.createElement("textarea");
      textArea.value = txt;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        addNotification(successMsg, "success");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        addNotification("Помилка копіювання", "error");
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          addNotification(successMsg, "success");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  // Рендер складного сповіщення про наявний інвайт
  const renderComplexErrorNotification = (errObj) => (
    <div className="notification-complex-error">
      <div className="notif-header">{errObj.info || "Діюче запрошення знайдено"}</div>
      {errObj.created_at && (
        <div className="notif-timeline">
          <div className="notif-time-row">
            <span>Створено:</span> <strong>{errObj.created_at}</strong>
          </div>
          <div className="notif-time-row highlight">
            <span>Оновити:</span> <strong>{errObj.can_refresh_at}</strong>
          </div>
        </div>
      )}
      {errObj.inviteLink && (
        <button 
          type="button"
          className="notif-copy-btn"
          onClick={(e) => {
            e.stopPropagation();
            performCopyAction(errObj.inviteLink, "Посилання скопійовано");
          }}
        >
          <Copy size={12} /> Скопіювати діюче посилання
        </button>
      )}
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post("/create_invitations/", formData);
      setCreatedData(res.data);
      addNotification("Запрошення створено успішно", "success");
      if (onCreated) onCreated();
    } catch (err) {
      const serverError = err.response?.data;
      if (typeof serverError === 'object' && serverError.info) {
        addNotification(renderComplexErrorNotification(serverError), "info");
      } else {
        const msg = serverError?.error || "Помилка при створенні запрошення";
        setError(msg);
        addNotification(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-add-user">
      <div className="modal-content-add-user">
        <div className="modal-header-add-user">
          <div className="modal-title-add-user">
            <ShieldCheck size={24} color="#5e83bf" /> 
            <h2>Створити адміністратора</h2>
          </div>
          <button onClick={onClose} className="close-btn-add-user">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-add-user">
          {!createdData ? (
            <form onSubmit={handleSubmit} className="form-group-add-user">
              <div className="source-1c-container" ref={searchRef}>
                <label className="source-1c-label">
                  <UserSearch size={16} /> Пошук в базі 1С (код або ПІБ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="search-1c-input"
                    placeholder="Виберіть обліковий запис 1С..."
                    value={searchTerm}
                    onFocus={() => setIsListOpen(true)}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsListOpen(true); }}
                    disabled={loadingUsers}
                  />
                  {loadingUsers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin" color="#3b82f6" />
                    </div>
                  )}

                  {isListOpen && !loadingUsers && (
                    <div className="search-results-dropdown-add-user custom-scrollbar">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div key={user.Link} className="search-result-item-add-user" onClick={() => handleSelectUser1c(user.Link)}>
                            <div className="user-code">{user.Code}</div>
                            <div className="user-name">{user.Наименование}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-center italic opacity-50">Нічого не знайдено</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="divider-container-add-user">
                <div className="divider-line-add-user"><span></span></div>
                <span className="divider-text-add-user">Персональні дані</span>
              </div>

              <div className="grid-fields-add-user">
                <div>
                  <label className="input-label-add-user">Логін *</label>
                  <input required className="form-input-add-user" placeholder="Введіть логін" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div>
                  <label className="input-label-add-user">Повне ім'я</label>
                  <input className="form-input-add-user" placeholder="Прізвище Ім'я" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
              </div>

              <div className="input-with-icon-add-user">
                <Smartphone size={16} className="input-icon-add-user" />
                <input type="tel" className="form-input-add-user pl-icon-add-user" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+380..." />
              </div>

              <div className="input-with-icon-add-user">
                <Mail size={16} className="input-icon-add-user" />
                <input type="email" className="form-input-add-user pl-icon-add-user" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="example@mail.com" />
              </div>

              <div>
                <label className="input-label-add-user"><Calendar size={12} /> Термін дії до:</label>
                <input type="date" className="form-input-add-user" value={formData.expireDate} onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })} />
              </div>

              {error && typeof error === 'string' && (
                <div className="error-message animate-shake">{error}</div>
              )}

              <div className="form-footer-add-user">
                <button type="button" onClick={onClose} className="btn-cancel-add-user">Скасувати</button>
                <button disabled={loading} className="btn-submit-add-user">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Створити акаунт"}
                </button>
              </div>
            </form>
          ) : (
            <div className="success-screen-add-user">
              <div className="success-icon-wrapper-add-user"><Mail size={40} /></div>
              <h3 className="modal-title-add-user" style={{justifyContent:'center', marginBottom:'0.5rem'}}>Запрошення створено!</h3>
              <p style={{fontSize:'0.875rem', opacity:0.6, marginBottom:'2rem'}}>Надішліть це посилання адміністратору:</p>
              
              <div className="success-card-add-user">
                <div className="invite-link-box-add-user">
                  <span className="input-label-add-user" style={{marginLeft:0}}>Посилання для реєстрації</span>
                  <span style={{fontSize:'0.75rem', wordBreak:'break-all', color:'#3b82f6', fontWeight:700}}>{createdData.inviteLink}</span>
                </div>
                {createdData.tgLink && (
                  <div style={{textAlign:'center'}}>
                    <span className="input-label-add-user" style={{display:'block', marginBottom:'0.5rem'}}>Telegram QR</span>
                    <div className="qr-code-wrapper-add-user">
                      <QRCodeCanvas value={createdData.tgLink} size={120} />
                    </div>
                  </div>
                )}
                <button 
                    type="button" 
                    onClick={() => performCopyAction(createdData.inviteLink, "Запрошення скопійовано")} 
                    className="copy-btn-floating-add-user"
                >
                  {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} color="#3b82f6" />}
                </button>
              </div>
              <button onClick={onClose} className="btn-close-final-add-user">Закрити вікно</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}