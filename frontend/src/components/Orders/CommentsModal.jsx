// import React, { useState, useEffect, useRef, useCallback } from "react";
// import axiosInstance from "../../api/axios";
// import { FaTimes, FaSave, FaRegCommentDots } from "react-icons/fa";
// import "./CommentsModal.css";
// import { useNotification } from "../notification/Notifications.jsx";

// const AUTHOR_COLORS = [
//   "#4fd1ac",
//   "#ffee00",
//   "#612ae0",
//   "#141e29",
//   "#76b448",
//   "#53a9ff",
// ];

// const getAuthorColor = (author) => {
//   if (!author) return "#f0f0f0";

//   const str =
//     author.full_name ||
//     author.username ||
//     author.id_1c ||
//     "unknown";

//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   }

//   const index = Math.abs(hash) % AUTHOR_COLORS.length;
//   return AUTHOR_COLORS[index];
// };

// const CommentsModal = ({
//   isOpen,
//   onClose,
//   baseTransactionGuid,
//   transactionTypeId,
//   activePersonId, // 🔑 GUID дилера
// }) => {
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState("");
//   const [loading, setLoading] = useState(false);
//   const commentsEndRef = useRef(null);

//   const { addNotification } = useNotification();

//   /* ================= LOAD COMMENTS ================= */
//   const fetchComments = useCallback(async () => {
//     if (!baseTransactionGuid || !transactionTypeId) return;

//     try {
//       const res = await axiosInstance.get("/messages/", {
//         params: {
//           base_transaction_guid: baseTransactionGuid,
//           transaction_type_id: transactionTypeId,
//         },
//       });

//       setComments(res.data || []);
//     } catch (err) {
//       console.error("Помилка при завантаженні коментарів:", err);
//       addNotification("Не вдалося завантажити історію коментарів. Спробуйте відкрити модалку заново.");
//     }
//   }, [baseTransactionGuid, transactionTypeId]);

//   /* ================= OPEN / CLOSE ================= */
//   useEffect(() => {
//     if (isOpen) {
//       fetchComments();
//     } else {
//       setComments([]);
//       setNewComment("");
//     }
//   }, [isOpen, fetchComments]);

//   /* ================= SCROLL ================= */
//   useEffect(() => {
//     commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [comments]);

//   /* ================= ADD COMMENT ================= */
//   const handleAddComment = async () => {
//     if (!newComment.trim()) return;

//     setLoading(true);

//     try {
//       const res = await axiosInstance.post("/messages/create/", {
//         transaction_type_id: transactionTypeId,
//         base_transaction_guid: baseTransactionGuid,
//         message: newComment.trim(),
//       });

//       setNewComment("");
//       setComments((prev) => [...prev, res.data]);
//       addNotification("Коментар успішно додано!", "success");
//     } catch (err) {
//       // console.error("Помилка при додаванні коментаря:", err);
//       addNotification("Помилка при відправці коментаря. Перевірте з'єднання.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   /* ================= RENDER ================= */
//   return (
//     <div className="comments-modal-overlay" onClick={onClose}>
//       <div
//         className="comments-modal-window"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* ===== HEADER ===== */}
//         <div className="comments-modal-border-top">
//           <div className="comments-modal-header">
//             <FaRegCommentDots size={20} style={{ marginRight: 8 }} />
//             <h3>Історія коментарів</h3>
//             <span
//               className="icon icon-cross comments-close-btn"
//               onClick={onClose}
//             />
//           </div>
//         </div>

//         {/* ===== BODY ===== */}
//         <div className="comments-modal-body">
//           {comments.length === 0 ? (
//             <div className="comments-no-comments">
//               Коментарів ще немає
//             </div>
//           ) : (
//             <ul className="comments-list">
//               {comments.map((c) => {
//                 const isMine = c.author?.id_1c === activePersonId;

//                 return (
//                   <li
//                     key={c.id}
//                     className={`comments-item ${
//                       isMine ? "comment-right" : "comment-left"
//                     }`}
//                     style={{
//                       ["--author-color"]: getAuthorColor(c.author),
//                     }}
//                   >
//                     {/* META */}
//                     <div className="comments-meta">
//                       <strong className="comments-author">
//                         {c.author?.full_name || "Користувач"}
//                       </strong>

//                       <span className="comments-date">
//                         {new Date(c.created_at).toLocaleString("uk-UA")}
//                       </span>
//                     </div>


//                     {/* TEXT */}
//                     <div className="comments-text">
//                       {c.message}
//                     </div>
//                   </li>
//                 );
//               })}
//               <div ref={commentsEndRef} />
//             </ul>
//           )}

//           {/* ===== FORM ===== */}
//           <form className="comments-form" onSubmit={(e) => e.preventDefault()}>
//             <label>Новий коментар:</label>
//             <textarea
//               placeholder="Введіть коментар..."
//               value={newComment}
//               onChange={(e) => setNewComment(e.target.value)}
//               rows={3}
//             />
//           </form>
//         </div>

//         {/* ===== FOOTER ===== */}
//         <div className="comments-modal-footer">
//           <button
//             className="comments-btn-cancel"
//             onClick={onClose}
//           >
//             <FaTimes size={16} /> Відмінити
//           </button>

//           <button
//             className="comments-btn-save"
//             onClick={handleAddComment}
//             disabled={loading}
//           >
//             <FaSave size={16} />
//             {loading ? " Додаємо..." : " Зберегти"}
//           </button>
//         </div>

//         <div className="comments-modal-border-bottom" />
//       </div>
//     </div>
//   );
// };

// export default CommentsModal;
















// import React, { useState, useEffect, useRef, useCallback } from "react";
// import axiosInstance from "../../api/axios";
// import { FaTimes, FaSave, FaRegCommentDots } from "react-icons/fa";
// import "./CommentsModal.css";
// import { useNotification } from "../notification/Notifications.jsx";

// const AUTHOR_COLORS = ["#4fd1ac", "#ffee00", "#612ae0", "#141e29", "#76b448", "#53a9ff"];

// const getAuthorColor = (author) => {
//   const str = author?.full_name || author?.username || "unknown";
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   const index = Math.abs(hash) % AUTHOR_COLORS.length;
//   return AUTHOR_COLORS[index];
// };

// const CommentsModal = ({ isOpen, onClose, baseTransactionGuid, transactionTypeId, activePersonId }) => {
//   const [comments, setComments] = useState([]);
//   const [newComment, setNewComment] = useState("");
//   const [loading, setLoading] = useState(false);
//   const commentsEndRef = useRef(null);
//   const socket = useRef(null); // Реф для сокета

//   const { addNotification } = useNotification();

//   // Формуємо унікальний ID для кімнати чату
//   const chatId = `${transactionTypeId}_${baseTransactionGuid}`;

//   /* ================= LOAD HISTORY (HTTP) ================= */
//   const fetchComments = useCallback(async () => {
//     if (!baseTransactionGuid || !transactionTypeId) return;
//     try {
//       const res = await axiosInstance.get("/messages/", {
//         params: { base_transaction_guid: baseTransactionGuid, transaction_type_id: transactionTypeId },
//       });
//       setComments(res.data || []);
//     } catch (err) {
//       console.error("Помилка при завантаженні історії:", err);
//     }
//   }, [baseTransactionGuid, transactionTypeId]);



//   /* ================= LOAD HISTORY (HTTP) ================= */
// const fetchHistory = useCallback(async () => {
//   // Перевіряємо наявність обов'язкових параметрів перед запитом
//   if (!baseTransactionGuid || !transactionTypeId) {
//     console.warn("fetchHistory: Відсутні параметри для запиту");
//     return;
//   }

//   try {
//     const res = await axiosInstance.get("/messages/", {
//       params: { 
//         base_transaction_guid: baseTransactionGuid, 
//         transaction_type_id: transactionTypeId 
//       },
//     });


//     const history = (res.data || []).map(msg => ({
//       id: msg.id,
//       message: msg.message, 
//       author: msg.author,   
//       created_at: msg.created_at, 
//       is_read: msg.is_read
//     }));

//     setComments(history);
//   } catch (err) {
//     console.error("Помилка при завантаженні історії повідомлень:", err);
//     addNotification("Не вдалося завантажити історію чату", "error");
//   }
// }, [baseTransactionGuid, transactionTypeId, addNotification]);


// useEffect(() => {
//   // 1. Якщо модалка відкрита - підключаємось
//   if (isOpen && baseTransactionGuid && transactionTypeId) {
//     fetchHistory(); // завантажуємо історію (HTTP)

//     const connectWS = () => {
//       const token = localStorage.getItem("access");
//       const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
//       const ws_host = window.location.host;

//       socket.current = new WebSocket(
//         `${ws_scheme}://${ws_host}/ws/chat/${chatId}/?token=${token}`
//       );

//       socket.current.onmessage = (e) => {
//         const data = JSON.parse(e.data);
        
//         if (data.type === 'error' && data.message.includes("Сесія застаріла")) {
//           axiosInstance.get("/user/me/")
//             .then(() => {
//               if (socket.current) socket.current.close();
//               connectWS();
//             })
//             .catch(() => {
//                addNotification("Сесія завершена. Будь ласка, перезайдіть.", "error");
//             });
//           return;
//         }

//         if (data.type === 'chat_message') {
//           setComments((prev) => [...prev, {
//             id: Date.now(),
//             message: data.message,
//             author: { 
//                 full_name: data.author, 
//                 id_1c: data.author_id_1c 
//             },
//             created_at: data.timestamp
//           }]);
//         }
//       };

//       socket.current.onclose = (e) => {
//         console.log("WS з'єднання розірвано:", e.code);
//       };
//     };

//     connectWS();
//   }

//   // 2. Ця функція (cleanup) виконається ПРИ ЗАКРИТТІ модалки (isOpen стає false)
//   // Або при демонтажі компонента
//   return () => {
//     if (socket.current) {
//       console.log("Закриваємо WebSocket з'єднання...");
//       socket.current.close();
//       socket.current = null; // Очищуємо реф
//     }
//   };
// }, [isOpen, chatId, fetchHistory]); // chatId залежить від baseTransactionGuid та transactionTypeId

//   /* ================= SCROLL ================= */
//   useEffect(() => {
//     commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [comments]);

//   /* ================= SEND MESSAGE (via WebSocket) ================= */
//   const handleAddComment = () => {
//     if (!newComment.trim()) return;

//     if (socket.current?.readyState === WebSocket.OPEN) {
//       // Відправляємо через сокет
//       socket.current.send(JSON.stringify({ 
//         'message': newComment.trim(),
//         // Додаємо метадані, щоб бекенд знав, куди зберегти
//         'base_transaction_guid': baseTransactionGuid,
//         'transaction_type_id': transactionTypeId
//       }));
      
//       setNewComment("");
//       addNotification("Відправлено", "success");
//     } else {
//       addNotification("З'єднання втрачено. Спробуйте оновити сторінку.");
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="comments-modal-overlay" onClick={onClose}>
//       <div className="comments-modal-window" onClick={(e) => e.stopPropagation()}>
//         <div className="comments-modal-border-top">
//            <div className="comments-modal-header">
//              <FaRegCommentDots size={20} style={{ marginRight: 8 }} />
//              <h3>Історія коментарів</h3>
//              <span
//                className="icon icon-cross comments-close-btn"
//                onClick={onClose}
//              />
//            </div>
//         </div>

//         <div className="comments-modal-body">
//           {comments.length === 0 ? (
//             <div className="comments-no-comments">Коментарів ще немає</div>
//           ) : (
//             <ul className="comments-list">
//               {comments.map((c, idx) => {
//                 const isMine = c.author?.id_1c === activePersonId;
//                 return (
//                   <li key={idx} className={`comments-item ${isMine ? "comment-right" : "comment-left"}`}
//                       style={{ "--author-color": getAuthorColor(c.author) }}>
//                     <div className="comments-meta">
//                       <strong className="comments-author">{c.author?.full_name || "Користувач"}</strong>
//                       <span className="comments-date">{new Date(c.created_at).toLocaleString("uk-UA")}</span>
//                     </div>
//                     <div className="comments-text">{c.message}</div>
//                   </li>
//                 );
//               })}
//               <div ref={commentsEndRef} />
//             </ul>
//           )}

//           <form className="comments-form" onSubmit={(e) => e.preventDefault()}>
//             <textarea
//               placeholder="Введіть повідомлення..."
//               value={newComment}
//               onChange={(e) => setNewComment(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
//               rows={3}
//             />
//           </form>
//         </div>

//         <div className="comments-modal-footer">
//           <button className="comments-btn-cancel" onClick={onClose}><FaTimes /> Відмінити</button>
//           <button className="comments-btn-save" onClick={handleAddComment} disabled={!newComment.trim()}>
//             <FaSave /> Надіслати
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CommentsModal;




import React, { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../../api/axios";
import { FaTimes, FaSave, FaRegCommentDots } from "react-icons/fa";
import "./CommentsModal.css";
import { useNotification } from "../notification/Notifications.jsx";

const AUTHOR_COLORS = ["#4fd1ac", "#ffee00", "#612ae0", "#141e29", "#76b448", "#53a9ff"];

const getAuthorColor = (author) => {
  const str = author?.full_name || author?.username || "unknown";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % AUTHOR_COLORS.length;
  return AUTHOR_COLORS[index];
};

const CommentsModal = ({ isOpen, onClose, baseTransactionGuid, transactionTypeId, manager }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null); // Стан для активного юзера
  const commentsEndRef = useRef(null);
  const socket = useRef(null);

  const { addNotification } = useNotification();
  const chatId = `${transactionTypeId}_${baseTransactionGuid}`;

  /* ================= GET CURRENT USER ================= */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/user/me/");
      // Припускаємо, що бекенд повертає об'єкт, де є user_id_1C або подібне
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Не вдалося отримати дані користувача:", err);
    }
  }, []);

  /* ================= LOAD HISTORY ================= */
  const fetchHistory = useCallback(async () => {
    if (!baseTransactionGuid || !transactionTypeId) return;
    try {
      const res = await axiosInstance.get("/messages/", {
        params: { 
          base_transaction_guid: baseTransactionGuid, 
          transaction_type_id: transactionTypeId 
        },
      });
      setComments(res.data || []);
    } catch (err) {
      console.error("Помилка при завантаженні історії:", err);
      addNotification("Не вдалося завантажити історію чату", "error");
    }
  }, [baseTransactionGuid, transactionTypeId, addNotification]);

  /* ================= WS LOGIC & INITIAL LOAD ================= */
 /* ================= WS LOGIC & INITIAL LOAD ================= */
useEffect(() => {
  if (isOpen && baseTransactionGuid && transactionTypeId) {
    fetchCurrentUser();
    fetchHistory();

    const connectWS = () => {
      const token = localStorage.getItem("access");
      const ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
      const ws_host = window.location.host;

      socket.current = new WebSocket(
        `${ws_scheme}://${ws_host}/ws/chat/${chatId}/?token=${token}`
      );

      socket.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        
        if (data.type === 'error' && data.message.includes("Сесія застаріла")) {
          axiosInstance.get("/user/me/").then(() => {
            if (socket.current) socket.current.close();
            connectWS();
          });
          return;
        }

        if (data.type === 'chat_message') {
          // 1. Оновлюємо список повідомлень
          setComments((prev) => [...prev, {
            id: Date.now(),
            message: data.message,
            author: { 
              full_name: data.author, 
              id_1c: data.author_id_1c 
            },
            created_at: data.timestamp
          }]);

          // 2. 🔥 ЛОГІКА СПОВІЩЕННЯ:
          // Якщо автор повідомлення НЕ я (currentUser ще може вантажитись, 
          // тому порівнюємо з отриманим ID з localStorage або стану)
          const isNotMe = data.author_id_1c !== currentUser?.user_id_1c;
          
          if (isNotMe) {
            addNotification(`Нове повідомлення від ${data.author}`, "warning", 0);
          }
        }
      };

      socket.current.onclose = (e) => {
        console.log("WS з'єднання розірвано:", e.code);
      };
    };

    connectWS();
  }

  return () => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
  };
}, [isOpen, chatId, fetchHistory, fetchCurrentUser, currentUser?.user_id_1c, addNotification]);

  /* ================= SCROLL ================= */
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ 
        'message': newComment.trim(),
        // 'base_transaction_guid': baseTransactionGuid,
        // 'transaction_type_id': transactionTypeId,
        'recipient_guid': manager
      }));
      setNewComment("");
    } else {
      addNotification("З'єднання втрачено. Перепідключення...");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-modal-window" onClick={(e) => e.stopPropagation()}>
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


        <div className="comments-modal-body">
          {comments.length === 0 ? (
            <div className="comments-no-comments">Коментарів ще немає</div>
          ) : (
            <ul className="comments-list">
              {comments.map((c, idx) => {
                // ПОРІВНЯННЯ: автор повідомлення vs поточний юзер з /user/me/
                const isMine = c.author?.id_1c === currentUser?.user_id_1c;

                return (
                  <li key={idx} 
                      className={`comments-item ${isMine ? "comment-right" : "comment-left"}`}
                      style={{ "--author-color": getAuthorColor(c.author) }}>
                    <div className="comments-meta">
                      <strong className="comments-author">{c.author?.full_name || "Користувач"}</strong>
                      <span className="comments-date">{new Date(c.created_at).toLocaleString("uk-UA")}</span>
                    </div>
                    <div className="comments-text">{c.message}</div>
                  </li>
                );
              })}
              <div ref={commentsEndRef} />
            </ul>
          )}

          <form className="comments-form" onSubmit={(e) => e.preventDefault()}>
            <textarea
              placeholder="Введіть повідомлення..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
              rows={3}
            />
          </form>
        </div>

        <div className="comments-modal-footer">
          <button className="comments-btn-cancel" onClick={onClose}><FaTimes /> Закрити</button>
          <button className="comments-btn-save" onClick={handleAddComment} disabled={!newComment.trim()}>
            <FaSave /> Надіслати
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;