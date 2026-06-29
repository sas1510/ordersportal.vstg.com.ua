import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  FaBell,
  FaCheckDouble,
  FaEnvelopeOpen,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes,
  FaClock,
  FaBellSlash,
  FaTelegramPlane,
} from "react-icons/fa";
import "./NotificationPage.css";
import { useNotification } from "../hooks/useNotification";
import { subscribeToPush, unsubscribeFromPush } from "../utils/useWebPush";
import { Popover } from "react-tiny-popover";
import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";
import AutoTranslatedText from "../components/AutoTranslatedText";

const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  unreadCount,
  setUnreadCount,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [loading] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const [permissionStatus, setPermissionStatus] = useState(
    window.Notification ? window.Notification.permission : "default"
  );

  const [subscribing, setSubscribing] = useState(false);
  const [isTgPopoverOpen, setIsTgPopoverOpen] = useState(false);
  const [tgLink, setTgLink] = useState("");
  const [loadingTg, setLoadingTg] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (filter === "MESSAGES") {
      return notifications.filter(
        (n) =>
          n.eventType === "NEW_CHAT_MESSAGE" || n.eventType === "NEW_MESSAGE"
      );
    }

    if (filter === "REMINDERS") {
      return notifications.filter(
        (n) => n.eventType === "ORDER_STUCK_REMINDER"
      );
    }

    return notifications;
  }, [notifications, filter]);

  const fetchTgLink = async () => {
    if (tgLink) return;

    setLoadingTg(true);

    try {
      const response = await axiosInstance.get("/user/telegram-link/");
      setTgLink(response.data.tg_link);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching TG link:", err);
      }

      addNotification(t("notifications.errors.tg_link"), "danger");
    } finally {
      setLoadingTg(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);

    try {
      await subscribeToPush();
      setPermissionStatus(window.Notification.permission);
      addNotification(t("notifications.push.activated"), "success");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Push subscription error:", err);
      }

      addNotification(t("notifications.push.error_enable"), "danger");
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSubscribing(true);

    try {
      await unsubscribeFromPush();
      setPermissionStatus("default");
      addNotification(t("notifications.push.disabled"), "info");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Push unsubscribe error:", err);
      }

      addNotification(t("notifications.push.error_disable"), "danger");
    } finally {
      setSubscribing(false);
    }
  };

  const handleNavigation = async (notification) => {
    if (!notification.isRead) {
      try {
        await axiosInstance.patch(
          `/notifications/${notification.id}/mark-read/`,
          { is_read: true }
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error marking as read:", err);
        }
      }
    }

    onClose();

    let basePath = "";

    if (notification.transactionType === "Прорахунок") {
      basePath = "/orders";
    } else if (notification.transactionType === "Рекламація") {
      basePath = "/complaints";
    } else if (notification.transactionType === "Доп. замовлення") {
      basePath = "/additional-orders";
    }

    if (basePath) {
      const searchVal = notification.doc_number;
      const yearVal = notification.docYear;

      let url = `${basePath}?search=${searchVal}`;

      if (yearVal) {
        url += `&year=${yearVal}`;
      }

      navigate(url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.post("/notifications/mark-read/");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (isOpen && window.Notification) {
      setPermissionStatus(window.Notification.permission);
    }

    document.body.style.overflow = isOpen ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getIcon = (type) => {
    switch (type) {
      case "NEW_CHAT_MESSAGE":
      case "NEW_MESSAGE":
        return (
          <FaEnvelopeOpen className="text-info" style={{ color: "#17a2b8" }} />
        );

      case "STATUS_CHANGED":
        return (
          <FaInfoCircle className="text-success" style={{ color: "#28a745" }} />
        );

      case "ORDER_STUCK_REMINDER":
        return (
          <FaClock className="text-warning" style={{ color: "#ffc107" }} />
        );

      default:
        return (
          <FaExclamationTriangle
            className="text-warning"
            style={{ color: "#ffc107" }}
          />
        );
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="drawer-portal-overlay active"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 11000,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        className="notification-drawer open"
        onClick={(e) => e.stopPropagation()}
        style={{
          zIndex: 11001,
        }}
      >
        <div className="drawer-header">
          <div className="drawer-header-title">
            <FaBell className="text-info" />
            <h3 className="m-0">{t("notifications.title")}</h3>

            {unreadCount > 0 && (
              <span className="badge-count">{unreadCount}</span>
            )}
          </div>

          <div className="icon-together">
            {permissionStatus === "default" && (
              <button
                onClick={handleSubscribe}
                className={`btn-subscribe-push ${
                  subscribing ? "loading" : ""
                }`}
                disabled={subscribing}
                title={t("notifications.push.enable_title")}
              >
                <FaBell size={14} />
                <span className="btn-text">
                  {subscribing ? "..." : t("notifications.push.btn_enable")}
                </span>
              </button>
            )}

            {permissionStatus === "granted" && (
              <button
                onClick={handleUnsubscribe}
                className={`btn-unsubscribe-push ${
                  subscribing ? "loading" : ""
                }`}
                disabled={subscribing}
                title={t("notifications.push.disable_title")}
              >
                <FaBellSlash size={14} />
                <span className="btn-text">
                  {subscribing ? "..." : t("notifications.push.btn_disable")}
                </span>
              </button>
            )}

            {permissionStatus === "denied" && (
              <div
                className="status-blocked"
                title={t("notifications.push.blocked_title")}
              >
                <FaExclamationTriangle color="#dc3545" />
              </div>
            )}

            <Popover
              isOpen={isTgPopoverOpen}
              positions={["bottom"]}
              padding={15}
              onClickOutside={() => setIsTgPopoverOpen(false)}
              containerClassName="tg-popover-portal"
              content={
                <div className="tg-popover-card">
                  <div className="tg-popover-header">
                    <FaTelegramPlane color="#0088cc" />
                    <span>{t("notifications.tg.bot_title")}</span>
                  </div>

                  <div className="tg-qr-container">
                    {loadingTg ? (
                      <div className="tg-loader">...</div>
                    ) : (
                      <QRCode value={tgLink || "loading"} size={120} />
                    )}
                  </div>

                  <p className="tg-qr-text">
                    {t("notifications.tg.qr_text")}
                  </p>

                  <a
                    href={tgLink}
                    target="_blank"
                    rel="noreferrer"
                    className="tg-direct-link"
                  >
                    {t("notifications.tg.open_chat")}
                  </a>
                </div>
              }
            >
              <button
                className={`btn-tg-trigger ${
                  isTgPopoverOpen ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  fetchTgLink();
                  setIsTgPopoverOpen(!isTgPopoverOpen);
                }}
              >
                <FaTelegramPlane size={18} />
              </button>
            </Popover>

            <button
              onClick={handleMarkAllRead}
              className="btn-mark-read"
              title={t("notifications.mark_all_read")}
              disabled={unreadCount === 0}
            >
              <FaCheckDouble size={14} />
            </button>

            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="drawer-filters">
          <button
            className={`filter-btn ${filter === "ALL" ? "active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            {t("notifications.filters.all")}
          </button>

          <button
            className={`filter-btn ${filter === "MESSAGES" ? "active" : ""}`}
            onClick={() => setFilter("MESSAGES")}
          >
            {t("notifications.filters.messages")}
          </button>

          <button
            className={`filter-btn ${filter === "REMINDERS" ? "active" : ""}`}
            onClick={() => setFilter("REMINDERS")}
          >
            {t("notifications.filters.reminders")}
          </button>
        </div>

        <div className="drawer-content">
          {loading ? (
            <div className="loading-state">{t("common.loading")}</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              {filter === "ALL"
                ? t("notifications.empty_all")
                : t("notifications.empty_filter")}
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`drawer-item ${!n.isRead ? "unread" : ""} ${
                  n.eventType === "ORDER_STUCK_REMINDER"
                    ? "system-reminder"
                    : ""
                }`}
                onClick={() => handleNavigation(n)}
              >
                <div className="item-icon">{getIcon(n.eventType)}</div>

                <div className="item-body">
                  <div className="item-meta">
                    <span className="item-type">
                      {n.eventType === "ORDER_STUCK_REMINDER"
                        ? t("notifications.types.reminder")
                        : n.transactionType
                        ? t(
                            `notifications.transaction_types.${n.transactionType}`,
                            { defaultValue: n.transactionType }
                          )
                        : t("notifications.types.system")}
                    </span>

                    <span className="item-date">
                      {new Date(n.createdAt).toLocaleDateString("uk-UA")}
                    </span>
                  </div>

                  <p className="item-message">
                    <AutoTranslatedText text={n.message} />
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationDrawer;