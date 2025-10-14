import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../api/axios";
import { FaTimes, FaSave, FaRegCommentDots } from "react-icons/fa";
import "./CommentsModal.css";

const CommentsModal = ({ isOpen, onClose, orderId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const commentsEndRef = useRef(null);

  // Завантаження коментарів
  const fetchComments = async () => {
    if (!orderId) return;
    try {
      const res = await axiosInstance.get(`/orders/${orderId}/messages/`);
      // Не перевертаємо — залишаємо порядок "зверху старі, знизу нові"
      setComments(res.data);
    } catch (err) {
      console.error("Помилка при завантаженні коментарів:", err);
    }
  };

  // Скрол до останнього коментаря
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Виклик при відкритті модалки
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, orderId]);

  // Скрол при зміні коментарів
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Додавання нового коментаря
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/orders/${orderId}/add-message/`, {
        message: newComment.trim(),
      });
      setNewComment("");

      // Додаємо новий коментар у кінець списку без повторного fetch
      setComments((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Помилка при додаванні коментаря:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddComment();
  };

  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="comments-modal-border-top">
          <div className="comments-modal-header">
            <FaRegCommentDots size={20} style={{ marginRight: 8 }} />
            <h3>Історія коментарів</h3>
            <span className="icon icon-cross comments-close-btn" onClick={onClose}></span>
          </div>
        </div>

        <div className="comments-modal-body">
          {comments.length === 0 ? (
            <div className="comments-no-comments">Коментарів ще немає</div>
          ) : (
            <ul className="comments-list">
              {comments.map((c, idx) => (
                <li key={idx} className="comments-item">
                  <div className="comments-meta">
                    <strong>{c.author || "Користувач"}</strong>
                    <span>
                      {new Date(c.created_at || c.date).toLocaleString("uk-UA")}
                    </span>
                  </div>
                  <div className="comments-text">{c.message || c.text}</div>
                </li>
              ))}
              <div ref={commentsEndRef} />
            </ul>
          )}

          <form className="comments-form" onSubmit={handleSubmit}>
            <label>Новий коментар:</label>
            <textarea
              placeholder="Введіть коментар..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            ></textarea>
          </form>
        </div>

        <div className="comments-modal-footer">
          <button className="comments-btn-cancel" onClick={onClose}>
            <FaTimes size={16} color="#fff" /> Відмінити
          </button>

          <button
            className="comments-btn-save"
            onClick={handleAddComment}
            disabled={loading}
          >
            <FaSave size={16} color="#fff" /> {loading ? "Додаємо..." : "Зберегти"}
          </button>
        </div>

        <div className="comments-modal-border-bottom" />
      </div>
    </div>
  );
};

export default CommentsModal;
