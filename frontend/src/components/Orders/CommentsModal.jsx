import React, { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance, { getAccessToken } from "../../api/axios";
import { FaRegCommentDots, FaPaperPlane } from "react-icons/fa";
import "./CommentsModal.css";
import { useNotification } from "../../hooks/useNotification";

const AUTHOR_COLORS = [
  "#4fd1ac",
  "#ffee00",
  "#612ae0",
  "#141e29",
  "#76b448",
  "#53a9ff",
];

const getAuthorColor = (author) => {
  const str = author?.full_name || author?.username || "unknown";
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % AUTHOR_COLORS.length;
  return AUTHOR_COLORS[index];
};

const CommentsModal = ({
  isOpen,
  onClose,
  baseTransactionGuid,
  transactionTypeId,
  manager,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const commentsEndRef = useRef(null);
  const socket = useRef(null);
  const reconnectTimeout = useRef(null); 

  const { addNotification } = useNotification();
  const chatId = `${transactionTypeId}_${baseTransactionGuid}`;

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/user/me/");
      setCurrentUser(res.data);
      return res.data;
    } catch (err) {
      console.error("Помилка профілю:", err);
      return null;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!baseTransactionGuid || !transactionTypeId) return;
    try {
      const res = await axiosInstance.get("/messages/", {
        params: {
          base_transaction_guid: baseTransactionGuid,
          transaction_type_id: transactionTypeId,
        },
      });
      setComments(res.data || []);
    } catch  {
      addNotification("Не вдалося завантажити історію", "error");
    }
  }, [baseTransactionGuid, transactionTypeId, addNotification]);

  const connectWS = useCallback(async () => {
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

    try {
      await axiosInstance.get("/user/me/");
    } catch  {
      console.error("Авторизація не вдалася, реконект через 5 сек...");
      reconnectTimeout.current = setTimeout(connectWS, 5000);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const ws_host = window.location.host;

    if (socket.current) {
      socket.current.onclose = null;
      socket.current.close();
    }

    const ws = new WebSocket(
      `${ws_scheme}://${ws_host}/ws/chat/${chatId}/?token=${token}`,
    );
    socket.current = ws;

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "chat_message") {
        setComments((prev) => [
          ...prev,
          {
            id: Date.now(),
            message: data.message,
            author: { full_name: data.author, id_1c: data.author_id_1c },
            created_at: data.timestamp,
          },
        ]);
      }

      if (data.type === "error" && data.message.includes("expired")) {
        ws.close();
      }
    };

    ws.onclose = (e) => {
      console.log(`WS закритo (код: ${e.code}). Перепідключення...`);

      if (isOpen) {
        reconnectTimeout.current = setTimeout(connectWS, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error("WS помилка:", err);
      ws.close();
    };
  }, [chatId, isOpen]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && baseTransactionGuid && transactionTypeId) {
      fetchCurrentUser();
      fetchHistory();
      connectWS();
    }

    return () => {
      if (socket.current) {
        socket.current.onclose = null; 
        socket.current.close();
      }
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [
    isOpen,
    baseTransactionGuid,
    transactionTypeId,
    fetchCurrentUser,
    fetchHistory,
    connectWS,
  ]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({
          message: newComment.trim(),
          recipient_guid: manager,
        }),
      );

      setNewComment("");

      const textarea = document.querySelector(".textarea-wrapper textarea");
      if (textarea) {
        textarea.style.height = "31px";
      }
    } else {
      addNotification(
        "З'єднання втрачено. Спробуйте оновити сторінку.",
        "error",
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div
        className="comments-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comments-modal-header">
          <FaRegCommentDots
            size={20}
            style={{ marginRight: 8, color: "#76b448" }}
          />
          <h3>Чат</h3>
          <span className="comments-close-x" onClick={onClose}>
            &times;
          </span>
        </div>

        <div className="comments-modal-body">
          {comments.length === 0 ? (
            <div className="comments-no-comments">Повідомлень ще немає</div>
          ) : (
            <ul className="comments-list">
              {comments.map((c, idx) => {
                const isMine = c.author?.id_1c === currentUser?.user_id_1c;
                return (
                  <li
                    key={idx}
                    className={`comments-item ${isMine ? "comment-right" : "comment-left"}`}
                    style={{ "--author-color": getAuthorColor(c.author) }}
                  >
                    <div className="comments-meta">
                      <strong className="comments-author">
                        {c.author?.full_name}
                      </strong>
                      <span className="comments-date">
                        {new Date(c.created_at || Date.now()).toLocaleString(
                          "uk-UA",
                        )}
                      </span>
                    </div>
                    <div className="comments-text">{c.message}</div>
                  </li>
                );
              })}
              <div ref={commentsEndRef} />
            </ul>
          )}
        </div>

        <div className="comments-form-container">
          <div className="textarea-wrapper">
            <textarea
              placeholder="Ваше повідомлення..."
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              rows="1"
            />
            <button
              className="btn-send-message"
              disabled={!newComment.trim()}
              onClick={handleAddComment}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
