import { ImageIcon, Video } from "lucide-react";
import PhotoModal from "./PhotoModal";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axios";

function ComplaintFilesDialog({ guid, onClose, title }) {
  const { t } = useTranslation();
  const dialog = useRef(null);
  const [files, setFiles] = useState(null);
  const [listError, setListError] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(null);
  const [galleryKind, setGalleryKind] = useState("photo");
  const [previewError, setPreviewError] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const urlPrefix = `/complaints/${encodeURIComponent(guid)}/files/`;

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    axiosInstance.get(urlPrefix, { signal: controller.signal })
      .then(({ data }) => setFiles(Array.isArray(data?.files) ? data.files : []))
      .catch(() => { if (!controller.signal.aborted) setListError(true); });
    return () => controller.abort();
  }, [urlPrefix]);

  async function getPreviewUrl(file) {
    const { data } = await axiosInstance.post("/complaints/media-token/", { file_guid: file.File_GUID });
    if (!data?.token) throw new Error("Missing preview token");
    const params = new URLSearchParams({ filename: file.File_FileName, token: data.token });
    return `/api${urlPrefix}preview/?${params}`;
  }

  async function openPreview(kind, index) {
    setPreviewError(false);
    setLoadingPreview(true);
    try {
      const items = kind === "photo" ? photos : videos;
      const results = await Promise.allSettled(items.map(getPreviewUrl));
      if (results[index]?.status !== "fulfilled") throw new Error("Media unavailable");
      const urls = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
      setGalleryKind(kind);
      setPhotoUrls(urls);
      setPhotoIndex(results.slice(0, index).filter(result => result.status === "fulfilled").length);
    } catch {
      setPreviewError(true);
    } finally {
      setLoadingPreview(false);
    }
  }

  const photos = files?.filter(file => /\.(jpe?g|png|webp)$/i.test(file.File_FileName)) || [];
  const videos = files?.filter(file => /\.(mp4|webm|ogg|mov)$/i.test(file.File_FileName)) || [];
  const groups = [
    { kind: "photo", label: t("complaints.detail.photo"), items: photos },
    { kind: "video", label: t("complaints.detail.video"), items: videos },
  ];

  return createPortal(
    <dialog ref={dialog} className="complaint-files-dialog" aria-label={title} onClose={onClose} onKeyDown={event => {
      if (event.key === "Escape" && photoIndex !== null) {
        event.preventDefault();
        event.stopPropagation();
        setPhotoIndex(null);
      }
    }} onClick={event => event.stopPropagation()}>
      <div className="complaint-files-dialog__heading">
        <h2>{title}</h2>
        <button type="button" className="complaint-files-button" onClick={() => dialog.current.close()} aria-label={t("common.close", { defaultValue: "Закрити" })}>×</button>
      </div>
      {listError && <p role="alert">{t("complaints.detail.errors.load_media_fail")}</p>}
      {!files && !listError && <p role="status">{t("common.loading", { defaultValue: "Завантаження…" })}</p>}
      {files && !photos.length && !videos.length && <p>{t("complaints.detail.no_media", { defaultValue: "Фото й відео відсутні" })}</p>}
      {groups.filter(group => group.items.length).map(({ kind, label, items }) => (
        <section key={kind}>
          <h3>{kind === "photo" ? <ImageIcon size={16} aria-hidden="true" /> : <Video size={16} aria-hidden="true" />}{label} <span className="complaint-files-dialog__count">{items.length}</span></h3>
          <div className={kind === "photo" ? "complaint-media__photos" : "complaint-media__videos"} style={kind === "photo" ? { "--photo-columns": Math.min(8, Math.ceil(items.length / 2)) } : undefined}>
            {items.map((file, index) => (
              <button key={file.File_GUID} type="button" className={kind === "photo" ? "complaint-media__photo" : "complaint-media__video"} disabled={loadingPreview} onClick={() => openPreview(kind, index)} title={file.File_FileName} aria-label={file.File_FileName}>
                {kind === "photo" ? <><ImageIcon size={14} aria-hidden="true" />{index + 1}</> : <><span aria-hidden="true">▶</span><span className="truncate">{file.File_FileName}</span></>}
              </button>
            ))}
          </div>
        </section>
      ))}
      {loadingPreview && <p role="status">{t("common.loading", { defaultValue: "Завантаження…" })}</p>}
      {previewError && <p role="alert">{t("complaints.detail.errors.general_error")}</p>}
      {photoIndex !== null && <PhotoModal
        isOpen
        onClose={() => setPhotoIndex(null)}
        photos={photoUrls}
        currentIndex={photoIndex}
        setCurrentIndex={setPhotoIndex}
        portalTarget={dialog.current}
        mediaKind={galleryKind}
      />}
    </dialog>,
    document.body,
  );
}

export default function ComplaintFilesButton({ guid, count }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const title = t("complaints.detail.files", { defaultValue: "Файли" });
  if (!guid) return null;

  return <>
    <button type="button" className="complaint-files-button" aria-haspopup="dialog" onClick={event => { event.stopPropagation(); setOpen(true); }}>{title}{Number.isInteger(count) && ` (${count})`}</button>
    {open && <ComplaintFilesDialog guid={guid} title={title} onClose={() => setOpen(false)} />}
  </>;
}
