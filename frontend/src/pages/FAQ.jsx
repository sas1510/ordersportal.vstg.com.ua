import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FaCircle,
  FaEdit,
  FaExternalLinkAlt,
  FaPlus,
  FaRegClock,
  FaSearch,
  FaTelegramPlane,
  FaTrash,
} from "react-icons/fa";
import axiosInstance from "../api/axios";
import { AppIcon } from "../components/Icons/AppIcon";
import ConfirmModal from "../components/Orders/ConfirmModal";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import "./FAQ.css";

const EMPTY_FORM = {
  title_ua: "",
  title_en: "",
  title_it: "",
  title_de: "",
  url_ua: "",
  url_en: "",
  url_it: "",
  url_de: "",
  description_ua: "",
  description_en: "",
  description_it: "",
  description_de: "",
  summary_ua: "",
  detail_title_ua: "",
  details_ua: "",
  is_popular: false,
  category: "",
  resource_type: "faq",
};

const DETAIL_TITLE_MARKER = "[DETAIL_TITLE]";
const FAQ_SIDEBAR_ROW_HEIGHT = 50;
const FAQ_SIDEBAR_ROW_GAP = 5;

const normalizeLocale = (language) => {
  const baseLanguage = (language || "uk").split("-")[0];
  return baseLanguage === "uk" ? "ua" : baseLanguage;
};

const getLocalizedValue = (valueMap, language) => {
  if (!valueMap || typeof valueMap !== "object") {
    return "";
  }

  const normalizedLanguage = normalizeLocale(language);
  const fallbackOrder = [normalizedLanguage, "ua", "en", "de", "it"];

  const firstMatch = fallbackOrder.find((key) => valueMap[key]);
  return firstMatch ? valueMap[firstMatch] : "";
};

const extractMediaUrl = (rawValue) => {
  if (typeof rawValue !== "string") {
    return "";
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  const markdownMatch = trimmed.match(/\]\((https?:\/\/[^)\s]+)\)/i);
  if (markdownMatch?.[1]) {
    return markdownMatch[1];
  }

  const plainUrlMatch = trimmed.match(/https?:\/\/[^\s\]]+/i);
  return plainUrlMatch ? plainUrlMatch[0] : trimmed;
};

const getYouTubeVideoId = (rawUrl) => {
  const normalizedUrl = extractMediaUrl(rawUrl);
  if (!normalizedUrl) {
    return "";
  }

  try {
    const url = new URL(normalizedUrl);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split(/[?&]/)[0];
    }

    if (url.pathname.includes("/shorts/")) {
      return url.pathname.split("/shorts/")[1]?.split(/[?&/]/)[0] || "";
    }

    if (url.hostname.includes("youtube.com")) {
      return (url.searchParams.get("v") || "").split(/[?&]/)[0];
    }
  } catch {
    return "";
  }

  return "";
};

const getYouTubeEmbedUrl = (rawUrl) => {
  const videoId = getYouTubeVideoId(rawUrl);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
};

const getYouTubeThumbnailUrl = (rawUrl) => {
  const videoId = getYouTubeVideoId(rawUrl);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};

const getDisplayTitle = (video, language, fallbackPrefix = "FAQ") => {
  const localizedTitle = getLocalizedValue(video?.titles, language);
  if (localizedTitle) {
    return localizedTitle;
  }

  if (video?.category_name) {
    return `${fallbackPrefix}: ${video.category_name}`;
  }

  return `${fallbackPrefix} #${video?.id ?? "—"}`;
};

const formatDate = (value, language) => {
  if (!value) {
    return "—";
  }

  const locale = language === "de" ? "de-DE" : language === "en" ? "en-US" : "uk-UA";

  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeDetailLine = (value) => String(value || "")
  .replace(/^[•\-–—\d.)\s]+/, "")
  .replace(/\s+/g, " ")
  .trim();

const splitDescriptionContent = (text) => {
  const normalized = String(text || "").replace(/\r/g, "").trim();

  if (!normalized) {
    return { summary: "", detailTitle: "", details: [] };
  }

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    const summary = paragraphs[0];
    const detailTitleParagraph = paragraphs[1]?.startsWith(DETAIL_TITLE_MARKER)
      ? paragraphs[1]
      : "";
    const detailTitle = detailTitleParagraph
      ? detailTitleParagraph.replace(DETAIL_TITLE_MARKER, "").trim()
      : "";
    const details = paragraphs
      .slice(detailTitleParagraph ? 2 : 1)
      .flatMap((paragraph) => paragraph.split("\n"))
      .map(normalizeDetailLine)
      .filter(Boolean);

    return { summary, detailTitle, details };
  }

  const lines = normalized
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return {
      summary: lines[0],
      detailTitle: "",
      details: lines.slice(1).map(normalizeDetailLine).filter(Boolean),
    };
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length > 1) {
    return {
      summary: sentences[0],
      detailTitle: "",
      details: sentences.slice(1).map(normalizeDetailLine).filter(Boolean),
    };
  }

  return { summary: normalized, detailTitle: "", details: [] };
};

const buildDescriptionContent = (summary, detailTitle, details) => {
  const normalizedSummary = String(summary || "").trim();
  const normalizedDetailTitle = String(detailTitle || "").trim();
  const normalizedDetails = String(details || "")
    .replace(/\r/g, "")
    .split("\n")
    .map(normalizeDetailLine)
    .filter(Boolean);

  if (!normalizedSummary && !normalizedDetailTitle && !normalizedDetails.length) {
    return "";
  }

  if (!normalizedDetailTitle && !normalizedDetails.length) {
    return normalizedSummary;
  }

  const sections = [normalizedSummary];
  if (normalizedDetailTitle) {
    sections.push(`${DETAIL_TITLE_MARKER} ${normalizedDetailTitle}`);
  }
  sections.push(...normalizedDetails.map((item) => `• ${item}`));

  return sections
    .filter(Boolean)
    .join("\n\n");
};

const getQuestionDuration = (video, index) => {
  const rawDuration = video?.duration || video?.video_duration || video?.length;
  if (typeof rawDuration === "string" && rawDuration.trim()) {
    return rawDuration.trim();
  }

  const presets = ["02:45", "01:30", "01:15", "02:13", "01:42", "02:08"];
  return presets[index % presets.length];
};

const FAQ_ALL_CATEGORY = {
  id: "all",
  name: "Всі категорії",
  icon_name: "AllFAQIcon",
};

const FAQ_FALLBACK_CATEGORIES = [
  { id: "faq-sales", name: "Продажі", icon_name: "SalesFAQIcon" },
  { id: "faq-installation", name: "Монтаж", icon_name: "AssemblingIcon" },
  { id: "faq-payment", name: "Оплата", icon_name: "FaqPaymentIcon" },
  { id: "faq-warranty", name: "Гарантія", icon_name: "WarrantyIcon" },
];

const getFallbackCategoryIcon = (categoryName = "") => {
  const normalized = String(categoryName)
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");

  // Продажі / Sales
  if (
    normalized.includes("продаж") ||
    normalized.includes("sales") ||
    normalized.includes("vendit") ||
    normalized.includes("verkauf")
  ) {
    return "SalesFAQIcon";
  }

  // Монтаж / Installation
  if (
    normalized.includes("монтаж") ||
    normalized.includes("встанов") ||
    normalized.includes("install") ||
    normalized.includes("montage")
  ) {
    return "AssemblingIcon";
  }

  // Оплата / Payment
  if (
    normalized.includes("оплат") ||
    normalized.includes("платіж") ||
    normalized.includes("payment") ||
    normalized.includes("pagament") ||
    normalized.includes("zahlung")
  ) {
    return "FaqPaymentIcon";
  }

  // Гарантія / Warranty
  if (
    normalized.includes("гарант") ||
    normalized.includes("warranty") ||
    normalized.includes("garanzia") ||
    normalized.includes("garantie")
  ) {
    return "WarrantyIcon";
  }

  return "AllFAQIcon";
};

export default function FAQ() {
  const { t, i18n } = useTranslation();
  const { isAdmin, user } = useAuthGetRole();
  const { addNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const [videos, setVideos] = useState([]);
  const [faqCategories, setFaqCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoForm, setVideoForm] = useState(EMPTY_FORM);
  const [sidebarPage, setSidebarPage] = useState(1);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [expertTopic, setExpertTopic] = useState("");
  const [expertMessage, setExpertMessage] = useState("");
  const [isExpertSending, setIsExpertSending] = useState(false);
  const featuredRef = useRef(null);
  const playlistListRef = useRef(null);
  const popularSectionRef = useRef(null);
  const [featuredHeight, setFeaturedHeight] = useState(null);
  const [sidebarPageSize, setSidebarPageSize] = useState(1);

  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/media-resources/", {
        params: { resource_type: "faq" },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      setVideos(data);
    } catch {
      addNotification(
        t("faq.messages.load_error", {
          defaultValue: "Не вдалося завантажити FAQ-відповіді.",
        }),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [addNotification, t]);

  const fetchFaqCategories = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/media-categories/", {
        params: { usage_scope: "faq" },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      setFaqCategories(data);
    } catch {
      setFaqCategories(FAQ_FALLBACK_CATEGORIES);
      addNotification(
        t("faq.messages.categories_load_error", {
          defaultValue: "Не вдалося завантажити категорії FAQ.",
        }),
        "warning",
      );
    }
  }, [addNotification, t]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    fetchFaqCategories();
  }, [fetchFaqCategories]);

  const faqFilterButtons = useMemo(() => {
    return [
      FAQ_ALL_CATEGORY,
      ...faqCategories.map((category) => ({
        id: String(category.id),
        name: category.name,
        // Для FAQ іконку визначаємо по самій категорії.
        // Так icon_name з API не може підмінити її неправильною іконкою.
        icon_name: getFallbackCategoryIcon(category.name),
      })),
    ];
  }, [faqCategories]);

  const selectedCategoryMeta = useMemo(
    () => faqFilterButtons.find((category) => category.id === selectedCategory) || FAQ_ALL_CATEGORY,
    [faqFilterButtons, selectedCategory],
  );

  const matchesFaqCategory = useCallback((video, categoryId) => {
    if (categoryId === "all") {
      return true;
    }

    if (String(categoryId).startsWith("faq-")) {
      return (video.category_name || "").toLowerCase() === selectedCategoryMeta.name.toLowerCase();
    }

    return String(video.category || "") === String(categoryId);
  }, [selectedCategoryMeta]);

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesCategory = matchesFaqCategory(video, selectedCategory);

      const title = getLocalizedValue(video.titles, i18n.language).toLowerCase();
      const description = getLocalizedValue(video.descriptions, i18n.language).toLowerCase();
      const categoryName = (video.category_name || "").toLowerCase();
      const matchesSearch =
        !deferredSearch
        || title.includes(deferredSearch)
        || description.includes(deferredSearch)
        || categoryName.includes(deferredSearch);

      return matchesCategory && matchesSearch;
    });
  }, [deferredSearch, i18n.language, matchesFaqCategory, selectedCategory, videos]);

  useEffect(() => {
    setSidebarPage(1);
  }, [deferredSearch, selectedCategory]);

  useEffect(() => {
    setShowAllPopular(false);
  }, [deferredSearch, selectedCategory, videos.length]);

  useEffect(() => {
    if (!filteredVideos.length) {
      setActiveVideoId(null);
      return;
    }

    const hasActiveVideo = filteredVideos.some((video) => video.id === activeVideoId);
    if (!hasActiveVideo) {
      setActiveVideoId(filteredVideos[0].id);
    }
  }, [activeVideoId, filteredVideos]);

  const activeVideo = useMemo(() => {
    return filteredVideos.find((video) => video.id === activeVideoId) || filteredVideos[0] || null;
  }, [activeVideoId, filteredVideos]);

  const sidebarPageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredVideos.length / sidebarPageSize)),
    [filteredVideos.length, sidebarPageSize],
  );
  const visibleQuestions = useMemo(() => {
    const startIndex = (sidebarPage - 1) * sidebarPageSize;
    return filteredVideos.slice(startIndex, startIndex + sidebarPageSize);
  }, [filteredVideos, sidebarPage, sidebarPageSize]);
  const sidebarPageNumbers = useMemo(() => {
    if (sidebarPageCount <= 1) {
      return [1];
    }

    const start = Math.max(1, sidebarPage - 1);
    const end = Math.min(sidebarPageCount, start + 2);
    const adjustedStart = Math.max(1, end - 2);

    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, index) => adjustedStart + index,
    );
  }, [sidebarPage, sidebarPageCount]);

  const selectedCategoryLabel = useMemo(() => {
    return selectedCategoryMeta.name || "Всі категорії";
  }, [selectedCategoryMeta]);

  const changeSidebarPage = useCallback(
    (page) => {
      const nextPage = Math.max(1, Math.min(page, sidebarPageCount));

      setSidebarPage(nextPage);
    },
    [sidebarPageCount],
  );

  useEffect(() => {
    const element = featuredRef.current;
    if (!element) {
      return undefined;
    }

    const updateHeight = () => {
      setFeaturedHeight(element.getBoundingClientRect().height);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [activeVideoId, loading, i18n.language]);

  useEffect(() => {
    const element = playlistListRef.current;
    if (!element) {
      return undefined;
    }

    const updatePageSize = () => {
      const height = element.getBoundingClientRect().height;

      const calculatedSize = Math.max(
        1,
        Math.floor(
          (height + FAQ_SIDEBAR_ROW_GAP) /
            (FAQ_SIDEBAR_ROW_HEIGHT + FAQ_SIDEBAR_ROW_GAP),
        ),
      );

      setSidebarPageSize((current) =>
        current === calculatedSize ? current : calculatedSize,
      );
    };

    updatePageSize();

    const resizeObserver = new ResizeObserver(updatePageSize);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [featuredHeight]);

  useEffect(() => {
    setSidebarPage((currentPage) =>
      Math.min(currentPage, Math.max(1, Math.ceil(filteredVideos.length / sidebarPageSize))),
    );
  }, [filteredVideos.length, sidebarPageSize]);

  const activeVideoDescription = getLocalizedValue(activeVideo?.descriptions, i18n.language);
  const activeVideoContent = useMemo(
    () => splitDescriptionContent(activeVideoDescription),
    [activeVideoDescription],
  );
  const activeVideoSummary = activeVideoContent.summary
    || activeVideoDescription
    || t("faq.no_description", {
      defaultValue: "Опис для цієї відповіді ще не доданий.",
    });
  const activeVideoDetailTitle = activeVideoContent.detailTitle
    || t("faq.featured.details_label", { defaultValue: "Деталізація" });
  const activeVideoDetailPoints = activeVideoContent.details.slice(0, 5);
  const activeVideoDetailText = "";
  const hasActiveVideoDetails =
    Boolean(activeVideoContent.detailTitle?.trim()) || activeVideoDetailPoints.length > 0;
  const currentUserName = user?.full_name || user?.username || t("faq.expert.default_user", {
    defaultValue: "Користувач порталу",
  });
  const popularSourceVideos = useMemo(() => {
    const source = filteredVideos.length ? filteredVideos : videos;
    return source.filter((video) => video.is_popular);
  }, [filteredVideos, videos]);
  const popularVideos = useMemo(
    () => (showAllPopular ? popularSourceVideos : popularSourceVideos.slice(0, 4)),
    [popularSourceVideos, showAllPopular],
  );

  useEffect(() => {
    if (searchParams.get("section") !== "popular") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      popularSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("section");
    setSearchParams(nextParams, { replace: true });

    return () => cancelAnimationFrame(frame);
  }, [searchParams, setSearchParams]);

  const scrollToMainLayout = useCallback(() => {
    const target = document.querySelector(".faq-page__layout");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const openAddModal = () => {
    const fallbackCategory = faqCategories[0]?.id ? String(faqCategories[0].id) : "";
    setSelectedVideo(null);
    setVideoForm({
      ...EMPTY_FORM,
      category: fallbackCategory,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (video) => {
    const descriptionContent = splitDescriptionContent(video.descriptions?.ua || "");

    setSelectedVideo(video);
    setVideoForm({
      title_ua: video.titles?.ua || "",
      title_en: video.titles?.en || "",
      title_it: video.titles?.it || "",
      title_de: video.titles?.de || "",
      url_ua: video.urls?.ua || "",
      url_en: video.urls?.en || "",
      url_it: video.urls?.it || "",
      url_de: video.urls?.de || "",
      description_ua: video.descriptions?.ua || "",
      description_en: video.descriptions?.en || "",
      description_it: video.descriptions?.it || "",
      description_de: video.descriptions?.de || "",
      summary_ua: descriptionContent.summary || "",
      detail_title_ua: descriptionContent.detailTitle || "",
      details_ua: descriptionContent.details.join("\n"),
      is_popular: Boolean(video.is_popular),
      category: String(video.category || faqCategories[0]?.id || ""),
      resource_type: "faq",
    });
    setIsModalOpen(true);
  };

  const handleSaveVideo = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...videoForm,
        description_ua: buildDescriptionContent(
          videoForm.summary_ua,
          videoForm.detail_title_ua,
          videoForm.details_ua,
        ),
      };

      delete payload.summary_ua;
      delete payload.detail_title_ua;
      delete payload.details_ua;

      const response = selectedVideo
        ? await axiosInstance.patch(`/media-resources/${selectedVideo.id}/`, payload)
        : await axiosInstance.post("/media-resources/", payload);

      addNotification(
        selectedVideo
          ? t("faq.messages.updated", { defaultValue: "FAQ-відповідь оновлено." })
          : t("faq.messages.created", { defaultValue: "FAQ-відповідь додано." }),
        "success",
      );

      setIsModalOpen(false);
      setActiveVideoId(response.data?.id || null);
      await fetchVideos();
    } catch {
      addNotification(
        t("faq.messages.save_error", {
          defaultValue: "Не вдалося зберегти FAQ-відповідь.",
        }),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!selectedVideo) {
      return;
    }

    try {
      await axiosInstance.delete(`/media-resources/${selectedVideo.id}/`);
      addNotification(
        t("faq.messages.deleted", { defaultValue: "FAQ-відповідь видалено." }),
        "success",
      );
      if (selectedVideo.id === activeVideoId) {
        setActiveVideoId(null);
      }
      await fetchVideos();
    } catch {
      addNotification(
        t("faq.messages.delete_error", {
          defaultValue: "Не вдалося видалити FAQ-відповідь.",
        }),
        "error",
      );
    }
  };

  const handleSendExpertRequest = async (event) => {
    event.preventDefault();

    const trimmedMessage = expertMessage.trim();
    if (!trimmedMessage) {
      addNotification(
        t("faq.expert.validation", { defaultValue: "Введіть повідомлення для експерта." }),
        "warning",
      );
      return;
    }

    setIsExpertSending(true);
    try {
      await axiosInstance.post("/support/faq-expert/send/", {
        text: trimmedMessage,
        contextTitle: expertTopic.trim(),
      });

      addNotification(
        t("faq.expert.sent", {
          defaultValue: "Повідомлення надіслано в Telegram і на email експерта.",
        }),
        "success",
      );
      setExpertTopic("");
      setExpertMessage("");
      setIsExpertModalOpen(false);
    } catch {
      addNotification(
        t("faq.expert.error", {
          defaultValue: "Не вдалося надіслати звернення експерту.",
        }),
        "error",
      );
    } finally {
      setIsExpertSending(false);
    }
  };

  return (
    <div className="faq-page">
      <section className="faq-page__hero">
        <div className="faq-page__hero-copy">
 
          <h1>
            Питання — <span className="faq-page__hero-title-accent">Відповіді</span>
          </h1>
          <p>
            {t("faq.hero.subtitle", {
              defaultValue:
                "Тут ви знайдете відповіді на найпоширеніші питання у форматі відео від наших експертів",
            })}
          </p>
          <div className="faq-page__hero-search-row">
            <label className="faq-page__search faq-page__search--hero">
              <FaSearch />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("faq.search_placeholder", {
                  defaultValue: "Пошук по питанням",
                })}
              />
            </label>
            <button type="button" className="faq-page__search-button">
              <FaSearch />
              {t("common.search", { defaultValue: "Пошук" })}
            </button>
          </div>

         
        </div>

        

        <div className="faq-page__hero-visual">
          <img src="/FAQ 1.png" alt="FAQ hero" className="faq-page__hero-image" />
          {isAdmin ? (
            <button type="button" className="faq-page__add-button faq-page__add-button--hero" onClick={openAddModal}>
              <FaPlus />
              {t("faq.actions.add", { defaultValue: "Додати відповідь" })}
            </button>
          ) : null}
        </div>
      </section>

       <div className="faq-page__filters faq-page__filters--hero">
            {faqFilterButtons.map((category) => (
              <button
                key={category.id}
                type="button"
                className={selectedCategory === category.id ? "is-active" : ""}
                onClick={() => setSelectedCategory(category.id)}
              >
                <AppIcon
                  name={category.icon_name}
                  className="faq-page__filter-icon"
                />
                <span>{category.name}</span>
              </button>
            ))}
          </div>

      <section className="faq-page__layout">
        <div className="faq-page__layout-accent" />

        <aside
          className="faq-page__playlist"
          style={featuredHeight ? { "--faq-featured-height": `${featuredHeight}px` } : undefined}
        >
          <div className="faq-page__playlist-head">
            <div className="faq-page__playlist-caption">
              <button
                type="button"
                className={`faq-page__playlist-breadcrumb ${
                  selectedCategory === "all" ? "is-active" : ""
                }`}
                onClick={() => setSelectedCategory("all")}
              >
                {t("faq.categories.all", { defaultValue: "Всі категорії" })}
              </button>
              {selectedCategory !== "all" ? (
                <>
                  <span className="faq-page__playlist-separator">/</span>
                  <span className="faq-page__playlist-breadcrumb is-current">
                    {selectedCategoryLabel}
                  </span>
                </>
              ) : null}
              <span className="faq-page__playlist-count">({filteredVideos.length})</span>
            </div>
          </div>

          <div
            ref={playlistListRef}
            className={`faq-page__playlist-list ${
              visibleQuestions.length < sidebarPageSize
                ? "faq-page__playlist-list--compact"
                : ""
            }`}
          >
            {visibleQuestions.map((video, index) => {
              const title = getDisplayTitle(video, i18n.language);

              return (
                <button
                  key={video.id}
                  type="button"
                  className={`faq-page__playlist-card ${
                    activeVideo?.id === video.id ? "is-active" : ""
                  }`}
                  onClick={() => setActiveVideoId(video.id)}
                >
                 
                    <AppIcon name="PlayVideoFAQIcon" className="faq-page__play-video-icon" />
                  
                  <div className="faq-page__playlist-card-main">
                    <strong className="faq-page__playlist-card-title">{title}</strong>
                    <span className="faq-page__playlist-card-meta">
                      {getQuestionDuration(video, index)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {sidebarPageCount > 1 ? (
            <div className="faq-page__pagination">
              <button
                type="button"
                className="faq-page__pagination-arrow"
                onClick={() => changeSidebarPage(sidebarPage - 1)}
                disabled={sidebarPage === 1}
              >
                ‹
              </button>

              <div className="faq-page__pagination-pages">
                {sidebarPageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`faq-page__pagination-page ${
                      page === sidebarPage ? "is-active" : ""
                    }`}
                    onClick={() => changeSidebarPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="faq-page__pagination-arrow"
                onClick={() => changeSidebarPage(sidebarPage + 1)}
                disabled={sidebarPage === sidebarPageCount}
              >
                ›
              </button>
            </div>
          ) : null}
        </aside>

        <div ref={featuredRef} className="faq-page__featured">
          {loading ? (
            <div className="faq-page__state">
              {t("common.loading", { defaultValue: "Завантаження..." })}
            </div>
          ) : activeVideo ? (
            <>
              <div className="faq-page__featured-title-wrap">
                <h2>{getDisplayTitle(activeVideo, i18n.language)}</h2>
              </div>

              <div className="faq-page__featured-player">
                {getYouTubeEmbedUrl(getLocalizedValue(activeVideo.urls, i18n.language)) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(getLocalizedValue(activeVideo.urls, i18n.language))}
                    title={getDisplayTitle(activeVideo, i18n.language)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="faq-page__video-fallback">
                    <AppIcon name="PlayVideoFAQIcon" className="faq-page__video-fallback-icon" />
                  </div>
                )}
              </div>

              <div className="faq-page__featured-summary">
    
                <p className="faq-page__featured-summary-text">{activeVideoSummary}</p>
              </div>

              {hasActiveVideoDetails || isAdmin ? (
                <div className="faq-page__featured-body">
                  {hasActiveVideoDetails ? (
                    <>
                      <span className="faq-page__question-label">
                        {activeVideoDetailTitle}
                      </span>

                      {activeVideoDetailPoints.length ? (
                        <div className="faq-page__featured-points">
                          {activeVideoDetailPoints.map((point) => (
                            <div key={point} className="faq-page__featured-point">
                              <FaCircle />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      ) : activeVideoDetailText ? (
                        <p className="faq-page__featured-description">{activeVideoDetailText}</p>
                      ) : null}
                    </>
                  ) : null}

                  <div className="faq-page__featured-actions">
                  {/* <a
                    href={extractMediaUrl(getLocalizedValue(activeVideo.urls, i18n.language))}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaExternalLinkAlt />
                    {t("faq.actions.watch", { defaultValue: "Відкрити на YouTube" })}
                  </a> */}

                    {isAdmin ? (
                      <div className="faq-page__admin-actions">
                        <button type="button" onClick={() => openEditModal(activeVideo)}>
                          <FaEdit />
                          {t("common.edit", { defaultValue: "Редагувати" })}
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          onClick={() => {
                            setSelectedVideo(activeVideo);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <FaTrash />
                          {t("common.delete", { defaultValue: "Видалити" })}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* <div className="faq-page__featured-meta">
                  <span className="faq-page__chip">{activeVideo.category_name || selectedCategoryLabel}</span>
                  <span className="faq-page__date">
                    <FaRegClock />
                    {formatDate(activeVideo.created_at, i18n.language)}
                  </span>
                </div> */}
                </div>
              ) : null}
            </>
          ) : (
            <div className="faq-page__state faq-page__state--empty">
              <AppIcon name="AllFAQIcon" className="faq-page__question-spot-icon" />
              <h2>{t("faq.empty.title", { defaultValue: "Нічого не знайдено" })}</h2>
              <p>
                {t("faq.empty.description", {
                  defaultValue: "Спробуйте змінити фільтр або додайте першу FAQ-відповідь.",
                })}
              </p>
            </div>
          )}
        </div>
      </section>

      {popularSourceVideos.length ? (
        <section ref={popularSectionRef} className="faq-page__popular">
        <div className="faq-page__popular-head">
          <h2>{t("faq.popular.title", { defaultValue: "Популярні питання" })}</h2>
        </div>

        <div className="faq-page__popular-grid">
          {popularVideos.map((video) => {
            const title = getDisplayTitle(video, i18n.language);
            const description = getLocalizedValue(video.descriptions, i18n.language)
              || t("faq.no_description", { defaultValue: "Без опису" });
            const thumbnailUrl = getYouTubeThumbnailUrl(getLocalizedValue(video.urls, i18n.language));

            return (
              <button
                key={video.id}
                type="button"
                className="faq-page__popular-card"
                onClick={() => {
                  setActiveVideoId(video.id);
                  scrollToMainLayout();
                }}
              >
                <div className="faq-page__popular-thumb">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={title} />
                  ) : (
                    <div className="faq-page__popular-thumb-fallback">
                      <AppIcon name="PlayVideoFAQIcon" className="faq-page__video-fallback-icon" />
                    </div>
                  )}

                  <span className="faq-page__popular-play">
                    <AppIcon name="PlayVideoFAQIcon" className="faq-page__play-video-icon" />
                  </span>
                </div>

                <div className="faq-page__popular-content">
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {popularSourceVideos.length > popularVideos.length ? (
          <button
            type="button"
            className="faq-page__popular-more"
            onClick={() => setShowAllPopular(true)}
          >
            {t("faq.actions.show_more", { defaultValue: "Показати ще" })}
          </button>
        ) : null}
        </section>
      ) : null}

      <section className="faq-page__expert">
        <div className="faq-page__expert-illustration">
          <img src="/Question 1.png" alt="Question" className="faq-page__expert-image" />
        </div>

        <div className="faq-page__expert-copy">
          <h2>{t("faq.expert.title", { defaultValue: "Не знайшли відповіді на своє запитання?" })}</h2>
          <p>{t("faq.expert.subtitle", { defaultValue: "Наш експерт готовий відповісти вам особисто" })}</p>
        </div>

        <button
          type="button"
          className="faq-page__expert-button"
          onClick={() => {
            setExpertTopic("");
            setExpertMessage("");
            setIsExpertModalOpen(true);
          }}
        >
          <AppIcon name="AskExpertFAQIcon" className="faq-page__question-spot-icon faq-page__question-spot-icon--button" />
          <span>{t("faq.expert.cta", { defaultValue: "Запитати в експерта" })}</span>
        </button>
      </section>

      {isExpertModalOpen ? (
        <div className="faq-page__modal-backdrop" onClick={() => setIsExpertModalOpen(false)}>
          <div className="faq-page__modal faq-page__modal--expert" onClick={(event) => event.stopPropagation()}>
            <div className="faq-page__modal-head">
              <div>
                <span className="faq-page__eyebrow">
                  {t("faq.expert.modal_eyebrow", { defaultValue: "Звернення до експерта" })}
                </span>
                <h3>{t("faq.expert.modal_title", { defaultValue: "Поставити запитання" })}</h3>
                <p className="faq-page__expert-modal-text">
                  {t("faq.expert.modal_subtitle", {
                    defaultValue: "Повідомлення буде надіслано в Telegram та на email експерта.",
                  })}
                </p>
              </div>

              <button type="button" onClick={() => setIsExpertModalOpen(false)}>
                ×
              </button>
            </div>

            <form className="faq-page__form" onSubmit={handleSendExpertRequest}>
              <label>
                <span>{t("faq.expert.from_label", { defaultValue: "Хто звертається" })}</span>
                <input value={currentUserName} disabled />
                <small className="faq-page__field-hint">
                  {t("faq.expert.from_hint", {
                    defaultValue: "Ім'я та ваші контакти будуть автоматично додані до звернення.",
                  })}
                </small>
              </label>

              <label>
                <span>{t("faq.expert.topic_label", { defaultValue: "Тема" })}</span>
                <input
                  value={expertTopic}
                  onChange={(event) => setExpertTopic(event.target.value)}
                  placeholder={t("faq.expert.topic_placeholder", {
                    defaultValue: "Наприклад: Коректний монтаж",
                  })}
                  required
                />
              </label>

              <label>
                <span>{t("faq.expert.message_label", { defaultValue: "Ваше питання" })}</span>
                <textarea
                  value={expertMessage}
                  onChange={(event) => setExpertMessage(event.target.value)}
                  placeholder={t("faq.expert.message_placeholder", {
                    defaultValue: "Опишіть питання або ситуацію, по якій потрібна допомога.",
                  })}
                  className="faq-page__expert-message"
                  required
                />
              </label>

              <div className="faq-page__form-actions">
                <button type="button" onClick={() => setIsExpertModalOpen(false)}>
                  {t("common.cancel", { defaultValue: "Скасувати" })}
                </button>
                <button type="submit" className="is-primary" disabled={isExpertSending}>
                  <FaTelegramPlane />
                  {isExpertSending
                    ? t("faq.expert.sending", { defaultValue: "Надсилаю..." })
                    : t("faq.expert.send", { defaultValue: "Надіслати експерту" })}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="faq-page__modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="faq-page__modal" onClick={(event) => event.stopPropagation()}>
            <div className="faq-page__modal-head">
              <div>
                <span className="faq-page__eyebrow">
                  {t("faq.modal.eyebrow", { defaultValue: "Керування FAQ" })}
                </span>
                <h3>
                  {selectedVideo
                    ? t("faq.modal.edit_title", { defaultValue: "Редагувати відповідь" })
                    : t("faq.modal.add_title", { defaultValue: "Нова FAQ-відповідь" })}
                </h3>
              </div>

              <button type="button" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <form className="faq-page__form" onSubmit={handleSaveVideo}>
              <label>
                <span>Питання / назва відео</span>
                <input
                  value={videoForm.title_ua}
                  onChange={(event) =>
                    setVideoForm((prev) => ({ ...prev, title_ua: event.target.value }))
                  }
                  placeholder={t("faq.modal.title_placeholder", {
                    defaultValue: "Наприклад: Як налаштувати дверну фурнітуру?",
                  })}
                  required
                />
                <small className="faq-page__field-hint">
                  Виводиться великим заголовком над відео.
                </small>
              </label>

              <label>
                <span>YouTube URL</span>
                <input
                  type="url"
                  value={videoForm.url_ua}
                  onChange={(event) =>
                    setVideoForm((prev) => ({ ...prev, url_ua: event.target.value }))
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <small className="faq-page__field-hint">
                  Це саме відео буде показане у великому плеєрі.
                </small>
              </label>

              <label>
                <span>Короткий підпис</span>
                <textarea
                  value={videoForm.summary_ua}
                  onChange={(event) =>
                    setVideoForm((prev) => ({
                      ...prev,
                      summary_ua: event.target.value,
                    }))
                  }
                  placeholder={t("faq.modal.summary_placeholder", {
                    defaultValue: "Короткий вступний текст під відео: що саме пояснює ця відповідь.",
                  })}
                />
                <small className="faq-page__field-hint">
                  Виводиться одразу під відео як короткий вступ.
                </small>
              </label>

              <label>
                <span>Назва деталізації</span>
                <input
                  value={videoForm.detail_title_ua}
                  onChange={(event) =>
                    setVideoForm((prev) => ({
                      ...prev,
                      detail_title_ua: event.target.value,
                    }))
                  }
                  placeholder={t("faq.modal.detail_title_placeholder", {
                    defaultValue: "Наприклад: Як оформити замовлення?",
                  })}
                />
                <small className="faq-page__field-hint">
                  Виводиться заголовком нижнього блоку з пунктами.
                </small>
              </label>

              <label>
                <span>Деталізація</span>
                <textarea
                  value={videoForm.details_ua}
                  onChange={(event) =>
                    setVideoForm((prev) => ({
                      ...prev,
                      details_ua: event.target.value,
                    }))
                  }
                  placeholder={t("faq.modal.details_placeholder", {
                    defaultValue: "Кожен новий рядок буде окремим пунктом у блоці деталізації.",
                  })}
                />
                <small className="faq-page__field-hint">
                  Виводиться в нижньому блоці списком. Один рядок = один пункт.
                </small>
              </label>

              <div className="faq-page__form-row">
                <label>
                  <span>{t("faq.modal.category", { defaultValue: "Категорія" })}</span>
                  <select
                    value={videoForm.category}
                    onChange={(event) =>
                      setVideoForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                  >
                    {faqCategories
                      .map((category) => (
                        <option key={category.id} value={String(category.id)}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  <span>{t("faq.modal.type", { defaultValue: "Тип ресурсу" })}</span>
                  <input value="FAQ video" disabled />
                </label>
              </div>

              <label className="faq-page__checkbox-field">
                <input
                  type="checkbox"
                  checked={Boolean(videoForm.is_popular)}
                  onChange={(event) =>
                    setVideoForm((prev) => ({
                      ...prev,
                      is_popular: event.target.checked,
                    }))
                  }
                />
                <div className="faq-page__checkbox-copy">
                  <span>Популярне питання</span>
                  <small className="faq-page__field-hint">
                    Якщо увімкнено, це питання зможе потрапити в блок «Популярні питання».
                  </small>
                </div>
              </label>

              <div className="faq-page__form-actions">
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  {t("common.cancel", { defaultValue: "Скасувати" })}
                </button>
                <button type="submit" className="is-primary" disabled={saving}>
                  {saving
                    ? t("common.saving", { defaultValue: "Зберігаю..." })
                    : t("common.save", { defaultValue: "Зберегти" })}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteVideo}
        title={t("faq.modal.delete_title", { defaultValue: "Видалити FAQ-відповідь" })}
        message={t("faq.modal.delete_message", {
          defaultValue: `Видалити "${selectedVideo ? getDisplayTitle(selectedVideo, i18n.language) : ""}"?`,
        })}
        confirmText={t("common.delete", { defaultValue: "Видалити" })}
        cancelText={t("common.cancel", { defaultValue: "Скасувати" })}
        type="danger"
      />
    </div>
  );
}
