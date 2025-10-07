import React, { useState } from "react";
import "./CommentsModal.css";

const CommentsModal = ({ isOpen, onClose, comments = [], onAddComment }) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim() === "") return;
    onAddComment(newComment.trim());
    setNewComment("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="calc-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="calc-modal-header">
          <span className="icon icon-comments"></span>
          <h3>Історія коментарів</h3>
          <span className="icon icon-cross close-btn" onClick={onClose}></span>
        </div>

        {/* Body */}
        <div className="calc-modal-body">
          {comments.length === 0 ? (
            <div className="no-comments">Коментарів ще немає</div>
          ) : (
            <ul className="comments-list">
              {comments.map((c, idx) => (
                <li key={idx} className="comment-item">
                  <div className="comment-meta">
                    <strong>{c.author || "Користувач"}</strong>
                    <span>{new Date(c.date).toLocaleString("uk-UA")}</span>
                  </div>
                  <div className="comment-text">{c.text}</div>
                </li>
              ))}
            </ul>
          )}

          <form className="comment-form" onSubmit={handleSubmit}>
            <label>Новий коментар:</label>
            <textarea
              placeholder="Введіть коментар..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            ></textarea>
          </form>
        </div>

        {/* Footer */}
        <div className="calc-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            ✖ Відмінити
          </button>
          <button className="btn-save" onClick={handleSubmit}>
            💾 Зберегти
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
