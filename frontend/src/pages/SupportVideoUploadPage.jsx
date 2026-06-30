import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import { useTranslation } from "react-i18next";
import "./SupportVideoUploadPage.css";

export default function SupportVideoUploadPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);

  const getUploadErrorText = (code) => {
    const key = `support_chat.large_video_upload.${code}`;
    const translated = t(key);
    return translated === key
      ? t("support_chat.large_video_upload.invalid")
      : translated;
  };

  useEffect(() => {
    let isMounted = true;

    async function loadUploadState() {
      if (!token) {
        if (!isMounted) return;
        setErrorCode("invalid");
        setErrorMessage(t("support_chat.large_video_upload.invalid"));
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await axiosInstance.get("/support/chat/large-video-upload/", {
          params: { token },
        });

        if (!isMounted) return;
        setMeta(data);
      } catch (error) {
        if (!isMounted) return;

        const code = error.response?.data?.code || "invalid";
        setErrorCode(code);
        setErrorMessage(
          error.response?.data?.error
            || getUploadErrorText(code)
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUploadState();
    return () => {
      isMounted = false;
    };
  }, [t, token]);

  const handleUpload = async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setErrorCode("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("file", file);

      const { data } = await axiosInstance.post(
        "/support/chat/large-video-upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSuccessMessage(data.message || t("support_chat.large_video_upload.success"));
      setMeta((prev) => ({
        ...(prev || {}),
        used: true,
      }));
      setFile(null);
    } catch (error) {
      const code = error.response?.data?.code || "invalid";
      setErrorCode(code);
      setErrorMessage(
        error.response?.data?.error
          || getUploadErrorText(code)
      );
    } finally {
      setIsUploading(false);
    }
  };

  const isUnavailable = Boolean(errorCode) || meta?.used || Boolean(successMessage);

  return (
    <div className="support-video-upload-page">
      <div className="support-video-upload-card">
        <div className="support-video-upload-eyebrow">
          {t("support_chat.title")}
        </div>
        <h1>{t("support_chat.large_video_upload.title")}</h1>
        <p>{t("support_chat.large_video_upload.description")}</p>

        {isLoading ? (
          <div className="support-video-upload-state">
            {t("support_chat.loading")}
          </div>
        ) : errorMessage ? (
          <div className="support-video-upload-state error">{errorMessage}</div>
        ) : successMessage ? (
          <div className="support-video-upload-state success">{successMessage}</div>
        ) : (
          <>
            <div className="support-video-upload-meta">
              <span>{t("support_chat.large_video_upload.file_label")}</span>
              <strong>{meta?.originalFileName || t("support_chat.attachment.file_fallback")}</strong>
            </div>
            <div className="support-video-upload-meta">
              <span>{t("support_chat.large_video_upload.expires_label")}</span>
              <strong>
                {meta?.expiresAt
                  ? new Date(meta.expiresAt).toLocaleString()
                  : t("support_chat.large_video_upload.expires_soon")}
              </strong>
            </div>

            <label className="support-video-upload-picker">
              <span>{t("support_chat.large_video_upload.select_file")}</span>
              <input
                type="file"
                accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.m4v"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                disabled={isUploading}
              />
            </label>

            {file && (
              <div className="support-video-upload-selected">
                {file.name}
              </div>
            )}

            <button
              type="button"
              className="support-video-upload-button"
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading
                ? t("support_chat.sending")
                : t("support_chat.large_video_upload.submit")}
            </button>
          </>
        )}

        {isUnavailable && (
          <a href="/home" className="support-video-upload-link">
            {t("support_chat.large_video_upload.back_home")}
          </a>
        )}
      </div>
    </div>
  );
}
