import React, { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../../api/axios";
import { FaTimes, FaSave, FaRegCommentDots } from "react-icons/fa";
import "./CommentsModal.css";
import { useNotification } from "../notification/Notifications.jsx";

const AUTHOR_COLORS = [
  "#4fd1ac",
  "#ffee00",
  "#612ae0",
  "#141e29",
  "#76b448",
  "#53a9ff",
];

const getAuthorColor = (author) => {
  if (!author) return "#f0f0f0";

  const str =
    author.full_name ||
    author.username ||
    author.id_1c ||
    "unknown";

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AUTHOR_COLORS.length;
  return AUTHOR_COLORS[index];
};

const CommentsModal = ({
  isOpen,
  onClose,
  baseTransactionGuid,
  transactionTypeId,
  activePersonId, // 🔑 GUID дилера
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const commentsEndRef = useRef(null);

  const { addNotification } = useNotification();

  /* ================= LOAD COMMENTS ================= */
  const fetchComments = useCallback(async () => {
    if (!baseTransactionGuid || !transactionTypeId) return;

    try {
      const res = await axiosInstance.get("/messages/", {
        params: {
          base_transaction_guid: baseTransactionGuid,
          transaction_type_id: transactionTypeId,
        },
      });

      setComments(res.data || []);
    } catch (err) {
      console.error("Помилка при завантаженні коментарів:", err);
      addNotification("Не вдалося завантажити історію коментарів. Спробуйте відкрити модалку заново.");
    }
  }, [baseTransactionGuid, transactionTypeId]);

  /* ================= OPEN / CLOSE ================= */
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    } else {
      setComments([]);
      setNewComment("");
    }
  }, [isOpen, fetchComments]);

  /* ================= SCROLL ================= */
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  /* ================= ADD COMMENT ================= */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);

    try {
      const res = await axiosInstance.post("/messages/create/", {
        transaction_type_id: transactionTypeId,
        base_transaction_guid: baseTransactionGuid,
        message: newComment.trim(),
      });

      setNewComment("");
      setComments((prev) => [...prev, res.data]);
      addNotification("Коментар успішно додано!", "success");
    } catch (err) {
      // console.error("Помилка при додаванні коментаря:", err);
      addNotification("Помилка при відправці коментаря. Перевірте з'єднання.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* ================= RENDER ================= */
  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div
        className="comments-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="comments-modal-border-top">
          <div className="comments-modal-header">
            <FaRegCommentDots size={20} style={{ marginRight: 8 }} />
            <h3>Історія коментарів</h3>
            <span
              className="icon icon-cross comments-close-btn"
              onClick={onClose}
            />
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="comments-modal-body">
          {comments.length === 0 ? (
            <div className="comments-no-comments">
              Коментарів ще немає
            </div>
          ) : (
            <ul className="comments-list">
              {comments.map((c) => {
                const isMine = c.author?.id_1c === activePersonId;

                return (
                  <li
                    key={c.id}
                    className={`comments-item ${
                      isMine ? "comment-right" : "comment-left"
                    }`}
                    style={{
                      ["--author-color"]: getAuthorColor(c.author),
                    }}
                  >
                    {/* META */}
                    <div className="comments-meta">
                      <strong className="comments-author">
                        {c.author?.full_name || "Користувач"}
                      </strong>

                      <span className="comments-date">
                        {new Date(c.created_at).toLocaleString("uk-UA")}
                      </span>
                    </div>


                    {/* TEXT */}
                    <div className="comments-text">
                      {c.message}
                    </div>
                  </li>
                );
              })}
              <div ref={commentsEndRef} />
            </ul>
          )}

          {/* ===== FORM ===== */}
          <form className="comments-form" onSubmit={(e) => e.preventDefault()}>
            <label>Новий коментар:</label>
            <textarea
              placeholder="Введіть коментар..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
          </form>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="comments-modal-footer">
          <button
            className="comments-btn-cancel"
            onClick={onClose}
          >
            <FaTimes size={16} /> Відмінити
          </button>

          <button
            className="comments-btn-save"
            onClick={handleAddComment}
            disabled={loading}
          >
            <FaSave size={16} />
            {loading ? " Додаємо..." : " Зберегти"}
          </button>
        </div>

        <div className="comments-modal-border-bottom" />
      </div>
    </div>
  );
};

export default CommentsModal;
