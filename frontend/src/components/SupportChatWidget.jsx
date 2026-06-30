import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "../api/axios";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next";
import "./SupportChatWidget.css";
import {
  FaComments,
  FaPaperclip,
  FaMicrophone,
  FaStop,
  FaPaperPlane,
  FaTimes,
  FaFileAlt,
} from "react-icons/fa";

const SupportChatWidget = () => {
  const { user } = useAuthGetRole();
  const { addNotification } = useNotification();
  const { t, i18n } = useTranslation();

  const widgetRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const buttonRef = useRef(null);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const contractorId =
    user?.contractor_id ||
    user?.contractorId ||
    user?.contractor_guid ||
    user?.user_id_1c;

  const currentLanguage = i18n.resolvedLanguage || i18n.language || "uk";
  const clientName =
    user?.full_name || user?.username || t("support_chat.default_client_name");

  const detectMessageType = (fileObj) => {
    if (!fileObj) return "text";
    if (fileObj.type.startsWith("audio/")) return "voice";
    if (fileObj.type.startsWith("video/")) return "video";
    if (fileObj.type.startsWith("image/")) return "image";
    return "file";
  };

  const unreadCount = messages.filter(
    (msg) => msg.direction === "incoming" && !msg.isRead
  ).length;

  

  const loadHistory = useCallback(async () => {
    if (!contractorId) return;

    setIsLoading(true);

    try {
      const { data } = await axiosInstance.get("/support/chat/history/", {
        params: {
          contractorId,
          lang: currentLanguage,
        },
      });

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error(t("support_chat.errors.load_history"), error);
    } finally {
      setIsLoading(false);
    }
  }, [contractorId, currentLanguage, t]);

  const markChatAsRead = useCallback(async () => {
    if (!contractorId) return;

    try {
      await axiosInstance.post("/support/chat/mark-read/", {
        contractorId,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.direction === "incoming" ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error(t("support_chat.errors.mark_read"), error);
    }
  }, [contractorId, t]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
  const interval = setInterval(
    loadHistory,
    isOpen ? 60000 : 5 * 60 * 1000
  );

  return () => clearInterval(interval);
}, [loadHistory, isOpen]);

  useEffect(() => {
    if (isOpen) {
      markChatAsRead();
    }
  }, [isOpen, markChatAsRead]);

  useEffect(() => {
    if (!isOpen) return;

    const hasUnreadIncoming = messages.some(
      (msg) => msg.direction === "incoming" && !msg.isRead
    );

    if (hasUnreadIncoming) {
      markChatAsRead();
    }
  }, [isOpen, messages, markChatAsRead]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (!isOpen) return;

    if (
      widgetRef.current?.contains(event.target) ||
      buttonRef.current?.contains(event.target)
    ) {
      return;
    }

    setIsOpen(false);
  };

  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("touchstart", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("touchstart", handleClickOutside);
  };
}, [isOpen]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });

        const voiceFile = new File([blob], `voice_${Date.now()}.webm`, {
          type: "audio/webm",
        });

        setFile(voiceFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();

      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Voice recording error:", error);
      addNotification(t("support_chat.errors.recording_start"), "error");
    }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorder) return;

    mediaRecorder.stop();
    setMediaRecorder(null);
    setIsRecording(false);
  };

  const sendMessage = async () => {
    if (isSending || isRecording) return;

    if (!text.trim() && !file) {
      addNotification(t("support_chat.errors.empty_message"), "warning");
      return;
    }

    if (!contractorId) {
      addNotification(t("support_chat.errors.contractor_not_found"), "error");
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();

      formData.append("contractorId", contractorId);
      formData.append("text", text.trim());
      formData.append("clientName", clientName);
      formData.append("messageType", detectMessageType(file));

      if (file) {
        formData.append("file", file);
      }

      await axiosInstance.post("/support/telegram/send/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setText("");
      setFile(null);
      setIsRecording(false);
      setMediaRecorder(null);

      await loadHistory();

      if (isOpen) {
        await markChatAsRead();
      }
    } catch (error) {
      console.error(t("support_chat.errors.send_message"), error);
      addNotification(t("support_chat.errors.send_message"), "error");
    } finally {
      setIsSending(false);
    }
  };

  if (!contractorId) return null;

  return (
    <>
    
      {isOpen && (
           <>
            <div
        className="support-widget-overlay"
        onClick={() => setIsOpen(false)}
      />
        <div
          ref={widgetRef}
          className="support-widget"
        >
          <div className="support-widget-header">
            <div>
              <div className="support-widget-title">{t("support_chat.title")}</div>
              {/* <div className="support-widget-status">
                <span></span> Онлайн
              </div> */}
            </div>

            <button
              type="button"
              className="support-widget-close"
              onClick={() => setIsOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="support-widget-body">
            {isLoading && messages.length === 0 ? (
              <div className="support-widget-empty">{t("support_chat.loading")}</div>
            ) : messages.length === 0 ? (
              <div className="support-widget-welcome">
                <div className="support-widget-welcome-icon"><FaComments size={34} /></div>
                <h3>{t("support_chat.welcome_title")}</h3>
                <p>{t("support_chat.welcome_text")}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`support-message-row ${
                    msg.direction === "outgoing" ? "outgoing" : "incoming"
                  }`}
                >
                  <div className="support-message">
                    {msg.text && (
                      <div className="support-message-text">{msg.text}</div>
                    )}

                    {msg.attachments?.map((a) => (
                      <AttachmentView key={a.id} attachment={a} />
                    ))}

                    <div className="support-message-time">
                      {new Date(msg.timestamp).toLocaleString(currentLanguage)}
                    </div>
                  </div>
                </div>
              ))
            )}

            <div ref={bottomRef} />
          </div>

          <div className="support-widget-footer">
            {file && (
              <div className="support-file-preview">
                <span>
                  <FaPaperclip style={{ marginRight: 8 }} />
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={isSending}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {isRecording && (
              <div className="support-recording">
                <span className="support-recording-dot"></span>
                {t("support_chat.recording_active")}
              </div>
            )}

            <div className="support-input-row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isSending || isRecording}
                hidden
              />

              <button
                type="button"
                className="support-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || isRecording}
                title={t("support_chat.actions.attach_file")}
              >
                <FaPaperclip />
              </button>

              {!isRecording ? (
                <button
                  type="button"
                  className="support-icon-btn"
                  onClick={startVoiceRecording}
                  disabled={isSending}
                  title={t("support_chat.actions.record_voice")}
                >
                  <FaMicrophone />
                </button>
              ) : (
                <button
                  type="button"
                  className="support-icon-btn danger"
                  onClick={stopVoiceRecording}
                  disabled={isSending}
                  title={t("support_chat.actions.stop_recording")}
                >
                 <FaStop />
                </button>
              )}

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  isRecording
                    ? t("support_chat.recording_placeholder")
                    : t("support_chat.message_placeholder")
                }
                disabled={isSending || isRecording}
                className="support-text-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                type="button"
                className="support-send-btn"
                onClick={sendMessage}
                disabled={isSending || isRecording || (!text.trim() && !file)}
                title={t("support_chat.actions.send")}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      <button
        ref={buttonRef}
        type="button"
        className="support-floating-button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={t("support_chat.title")}
        aria-label={t("support_chat.title")}
      >
        <FaComments size={26} />

        {unreadCount > 0 && (
          <span className="support-unread-badge">{unreadCount}</span>
        )}
      </button>
    </>
  );
};

const AttachmentView = ({ attachment }) => {
  const { t } = useTranslation();
  const url = attachment.url;
  const downloadUrl = attachment.downloadUrl || url;

  if (attachment.type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={attachment.fileName || t("support_chat.attachment.image_alt")}
          className="support-attachment-image"
        />
      </a>
    );
  }

  if (attachment.type === "video") {
    if (!attachment.isAvailable || !downloadUrl) {
      return (
        <div className="support-attachment-file">
          <FaFileAlt style={{ marginRight: 8 }} />
          {t("support_chat.large_video_upload.video_unavailable")}
        </div>
      );
    }

    return (
      <a
        href={downloadUrl}
        target="_blank"
        rel="noreferrer"
        className="support-attachment-file"
      >
        <>
          <FaFileAlt style={{ marginRight: 8 }} />
          {t("support_chat.large_video_upload.download_button")}
        </>
      </a>
    );
  }

  if (attachment.type === "voice" || attachment.type === "audio") {
    return <audio controls src={url} className="support-attachment-audio" />;
  }

  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noreferrer"
      className="support-attachment-file"
    >
      <>
        <FaFileAlt style={{ marginRight: 8 }} />
        {attachment.originalFileName || attachment.fileName || t("support_chat.attachment.file_fallback")}
      </>
    </a>
  );
};

export default SupportChatWidget;
