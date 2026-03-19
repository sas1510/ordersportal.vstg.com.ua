import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

const CommentManager = ({ targetType, targetId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Завантажити коментарі для даного об'єкта
  const fetchComments = async () => {
    try {
      const res = await axiosInstance.get(`/comments/list`, {
        params: { targetType, targetId }
      });
      setComments(res.data);
    } catch (error) {
      console.error("Помилка при завантаженні коментарів:", error);
    }
  };

  useEffect(() => {
    if (targetId) fetchComments();
  }, [targetType, targetId]);

  // Додати новий коментар
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await axiosInstance.post("/comments/create", {
        text: newComment,
        targetType,
        targetId
      });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Помилка при додаванні коментаря:", error);
      alert("Помилка: " + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mt-6 mx-auto px-6">
      <h3 className="text-xl font-semibold text-[#003d66] mb-4">
        Коментарі
      </h3>

      <form onSubmit={handleAddComment} className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Напишіть коментар..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
          rows={3}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#003d66] text-white font-semibold px-4 py-2 rounded-md hover:bg-[#00509e] disabled:opacity-60"
        >
          {loading ? "Додаємо..." : "Додати коментар"}
        </button>
      </form>

      <div className="space-y-3">
        {comments.length === 0 && <p>Коментарів ще немає.</p>}
        {comments.map((c) => (
          <div
            key={c.id}
            className="p-3 bg-gray-50 border border-gray-200 rounded-md shadow-sm"
          >
            <p className="text-gray-800">{c.text}</p>
            <small className="text-gray-500">
              {new Date(c.createdAt).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentManager;
