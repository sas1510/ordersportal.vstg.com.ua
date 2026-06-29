import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "../api/axios";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next";

const SupportChatPage = () => {
  const { user } = useAuthGetRole();
  const { addNotification } = useNotification();
  const { t, i18n } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const bottomRef = useRef(null);

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
      console.error(error);
      addNotification(t("support_chat.errors.load_history"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [contractorId, addNotification, currentLanguage, t]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const interval = setInterval(loadHistory, 3000);
    return () => clearInterval(interval);
  }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
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

      addNotification(t("support_chat.success.sent"), "success");
    } catch (error) {
      console.error(error);
      addNotification(t("support_chat.errors.send_message"), "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="emergency-portal-body items-center">
      <div className="w-full max-w-[900px]">
        <h1 className="text-color mt-6 text-4xl font-bold pb-3">
          {t("support_chat.page_title")}
        </h1>

        <div className="border rounded-xl bg-white flex flex-col h-[700px]">
          <div className="p-4 border-b font-semibold">
            {t("support_chat.manager_support")}
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {isLoading && messages.length === 0 ? (
              <div className="text-center text-gray-500">{t("support_chat.loading")}</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500">
                {t("support_chat.empty_history")}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 flex ${
                    msg.direction === "outgoing"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[75%] ${
                      msg.direction === "outgoing"
                        ? "bg-blue-500 text-white"
                        : "bg-white border text-gray-900"
                    }`}
                  >
                    {msg.text && (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}

                    {msg.attachments?.map((a) => (
                      <AttachmentView key={a.id} attachment={a} />
                    ))}

                    <div className="text-[10px] opacity-60 mt-2">
                      {new Date(msg.timestamp).toLocaleString(currentLanguage)}
                    </div>
                  </div>
                </div>
              ))
            )}

            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t">
            {file && (
              <div className="mb-2 text-sm text-gray-600">
                {t("support_chat.file_added")} <b>{file.name}</b>

                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-3 underline"
                  disabled={isSending}
                >
                  {t("support_chat.remove_file")}
                </button>
              </div>
            )}

            {isRecording && (
              <div className="mb-2 text-sm text-red-500">
                {"🎙 "}
                {t("support_chat.recording_active")}
              </div>
            )}

            <div className="flex gap-2 items-center">
              <input
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isSending || isRecording}
                className="video-input max-w-[230px]"
              />

              {!isRecording ? (
                <button
                  type="button"
                  className="emergency-button-call"
                  onClick={startVoiceRecording}
                  disabled={isSending}
                  title={t("support_chat.actions.record_voice")}
                >
                  🎙
                </button>
              ) : (
                <button
                  type="button"
                  className="emerg-btn-cancel"
                  onClick={stopVoiceRecording}
                  disabled={isSending}
                  title={t("support_chat.actions.stop_recording")}
                >
                  ⏹
                </button>
              )}

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  isRecording
                    ? t("support_chat.recording_active")
                    : t("support_chat.message_placeholder")
                }
                className="video-input flex-1"
                disabled={isSending || isRecording}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                type="button"
                className="emergency-btn-confirm"
                onClick={sendMessage}
                disabled={isSending || isRecording || (!text.trim() && !file)}
              >
                {isSending ? t("support_chat.sending") : t("support_chat.actions.send")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AttachmentView = ({ attachment }) => {
  const { t } = useTranslation();
  const url = attachment.url;

  if (attachment.type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={attachment.fileName || t("support_chat.attachment.image_alt")}
          className="rounded mt-2 max-w-full"
          style={{ maxHeight: 260 }}
        />
      </a>
    );
  }

  if (attachment.type === "video") {
    return (
      <video
        controls
        src={url}
        className="rounded mt-2 w-full"
        style={{ maxHeight: 300 }}
      />
    );
  }

  if (attachment.type === "voice" || attachment.type === "audio") {
    return <audio controls src={url} className="w-full mt-2" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="underline mt-2 block"
    >
      📎 {attachment.originalFileName || attachment.fileName || t("support_chat.attachment.file_fallback")}
    </a>
  );
};

export default SupportChatPage;
