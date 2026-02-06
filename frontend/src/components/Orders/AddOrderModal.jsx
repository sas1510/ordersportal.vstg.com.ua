// import React, { useState, useEffect } from "react";
// import "./AddOrderModal.css"; // має містити alertify-стиль

// const AddOrderModal = ({ isOpen, onClose, onSave }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     client: "",
//     price: "",
//   });

//   useEffect(() => {
//     if (isOpen) document.body.classList.add("ajs-no-overflow");
//     else document.body.classList.remove("ajs-no-overflow");
//   }, [isOpen]);

//   if (!isOpen) return null;

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave(formData);
//     setFormData({ name: "", client: "", price: "" });
//     onClose();
//   };

//   return (
//     <div className="ajs-modal ajs-fade ajs-in" role="dialog">
//       <div className="ajs-dimmer" onClick={onClose}></div>

//       <div className="ajs-dialog ajs-slideIn">
//         <div className="ajs-header">Новий прорахунок</div>

//         <div className="ajs-body">
//           <form onSubmit={handleSubmit} className="add-order-form">
//             <label>
//               Назва прорахунку:
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 required
//               />
//             </label>

//             <label>
//               Клієнт:
//               <input
//                 type="text"
//                 name="client"
//                 value={formData.client}
//                 onChange={handleChange}
//                 required
//               />
//             </label>

//             <label>
//               Ціна (грн):
//               <input
//                 type="number"
//                 name="price"
//                 value={formData.price}
//                 onChange={handleChange}
//                 required
//               />
//             </label>

//             <div className="ajs-footer">
//               <button
//                 type="button"
//                 className="ajs-button ajs-cancel"
//                 onClick={onClose}
//               >
//                 Скасувати
//               </button>
//               <button type="submit" className="ajs-button ajs-ok">
//                 Зберегти
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddOrderModal;
