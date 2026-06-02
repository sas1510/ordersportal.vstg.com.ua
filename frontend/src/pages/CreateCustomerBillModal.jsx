// // import React, { useEffect, useState } from "react";
// // import axiosInstance from "../api/axios";
// // import BillItemSelect from "./BillItemSelect";
// // import BillSelect from "./BillSelect";
// // import "./CreateCustomerBillModal.css";
// // import { useNotification } from "../hooks/useNotification";


// // const STEPS = {
// //   BASE: 1,
// //   ITEMS: 2,
// //   CONFIRM: 3,
// // };

// // const STEP_LABELS = {
// //   [STEPS.BASE]: "Вибір реквізитів",
// //   [STEPS.ITEMS]: "Додавання товарів",
// //   [STEPS.CONFIRM]: "Підтвердження",
// // };

// // export default function CreateCustomerBillModal({
// //   isOpen,
// //   onClose,
// //   onSuccess,
// // }) {
// //   useEffect(() => {
// //     const handleEsc = (event) => {
// //       if (event.key === "Escape") onClose();
// //     };

// //     window.addEventListener("keydown", handleEsc);
// //     document.body.style.overflow = "hidden";

// //     return () => {
// //       window.removeEventListener("keydown", handleEsc);
// //       document.body.style.overflow = "";
// //     };
// //   }, [onClose]);

// //   const { addNotification } = useNotification();
// //   const [step, setStep] = useState(STEPS.BASE);

// //   const [addresses, setAddresses] = useState([]);
// //   const [itemsList, setItemsList] = useState([]);
// //   const [ibans, setIbans] = useState([]);

// //   // const [selectedContragent, setSelectedContragent] = useState("");
// //   const [selectedIban, setSelectedIban] = useState("");
// //   const [selectedAddress, setSelectedAddress] = useState("");

// //   const [paymentDate, setPaymentDate] = useState("");
// //   const [deliveryDate, setDeliveryDate] = useState("");
// //   const [internalComment, setInternalComment] = useState("");

// //   const [orderItems, setOrderItems] = useState([
// //     {
// //       itemGUID: "",
// //       quantity: 1,
// //       price: 0,
// //       width: "",
// //       height: "",
// //     },
// //   ]);

// //   const [loading, setLoading] = useState(false);


// //   useEffect(() => {
// //     if (!isOpen) return;
// //     const fetchProfile = async () => {
// //       try {
// //         const res = await axiosInstance.get(`/payments/dealers/profile/`);
// //         const data = res.data || {};
// //         setAddresses(data.data.addresses || []);
// //         setIbans(data.data.accounts || []);
// //         setItemsList(data.data.nomenclature || []);
// //       } catch (err) {
// //         if (process.env.NODE_ENV === 'development') {
// //           console.error("Error fetching profile:", err);
// //         }
// //         addNotification(
// //           "Помилка завантаження профілю, спробуйте відкрити форму заново",
// //           "error",
// //         );
// //       }
// //     };
// //     fetchProfile();
// //   }, [isOpen, addNotification]);

// //   const handleAddItem = () => {
// //     setOrderItems((prev) => [
// //       ...prev,
// //       { itemGUID: "", quantity: 1, price: 0, width: "", height: "" },
// //     ]);
// //   };

// //   const handleRemoveItem = (index) => {
// //     setOrderItems((prev) =>
// //       prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
// //     );
// //   };

// //   const handleItemChange = (index, field, value) => {
// //     setOrderItems((prev) => {
// //       const copy = [...prev];
// //       copy[index][field] = value;
// //       return copy;
// //     });
// //   };

// //   const totalSum = orderItems.reduce(
// //     (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
// //     0,
// //   );

// //   /* ===================== SUBMIT ===================== */
// //   const handleSubmit = async () => {
// //     setLoading(true);

// //     const dto = {
// //       // OrderNumber: `ORD-${Date.now()}`,
// //       // selectedContragent: selectedContragent,
// //       IbanGUID: selectedIban,
// //       AddressGUID: selectedAddress,
// //       OrderSuma: totalSum,
// //       InternalComment: internalComment,
// //       OrderPaymentDate: paymentDate || null,
// //       OrderDeliveryDate: deliveryDate || null,
// //       OrderItemsLIST: orderItems.map((i) => ({
// //         ItemGUID: i.itemGUID,
// //         Count: Number(i.quantity) || 0,
// //         Price: Number(i.price) || 0,
// //         Width: i.width || null,
// //         Height: i.height || null,
// //       })),
// //       OrderCreateDate: new Date().toISOString(),
// //     };

// //     try {
// //       await axiosInstance.post("/payments/create_invoice/", dto);
// //       addNotification("Рахунок успішно створено!", "success");
// //       onSuccess?.();
// //       onClose();
// //     } catch (error) {

// //       if (process.env.NODE_ENV === 'development') {
// //         console.error("Error creating bill:", error);
// //       }

// //       addNotification(
// //         "Не вдалося створити рахунок. Спробуйте ще раз.",
// //         "error",
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   if (!isOpen) return null;

// //   /* ===================== RENDER ===================== */
// //   return (
// //     <div className="bill-modal-overlay">
// //       <div className="bill-modal-window">
// //         <div className="bill-modal-header">
// //           <h3>
// //             🧾 Створення рахунку
// //             <span className="step-info"> • {STEP_LABELS[step]}</span>
// //           </h3>
// //           <button className="bill-close-btn" onClick={onClose}>
// //             ✕
// //           </button>
// //         </div>

// //         {/* ===== PROGRESS BAR ===== */}
// //         <div className="bill-progress-container">
// //           <div
// //             className="bill-progress-bar"
// //             style={{ width: `${(step / 3) * 100}%` }}
// //           ></div>
// //         </div>

// //         {/* ===== BODY (SCROLLABLE) ===== */}
// //         <div className="bill-form-scroll">
// //           <div className="bill-form">
// //             {/* STEP 1 */}
// //             {step === STEPS.BASE && (
// //               <>
// //                 <div className="bill-field">
// //                   <span className="bill-field__label">IBAN</span>
// //                   <BillSelect
// //                     value={selectedIban}
// //                     options={ibans}
// //                     placeholder="— оберіть IBAN —"
// //                     getValue={(i) => i.AccountGUID}
// //                     getLabel={(i) => `${i.NumberBills} — ${i.AccountName}`}
// //                     onChange={setSelectedIban}
// //                   />
// //                 </div>

// //                 <div className="bill-field">
// //                   <span className="bill-field__label">Адреса</span>
// //                   <BillSelect
// //                     value={selectedAddress}
// //                     options={addresses}
// //                     placeholder="— оберіть адресу —"
// //                     getValue={(a) => a.AddressKindGUID}
// //                     getLabel={(a) => `${a.AddressKind} — ${a.AddressValue}`}
// //                     onChange={setSelectedAddress}
// //                   />
// //                 </div>
// //               </>
// //             )}

// //             {/* STEP 2 */}
// //             {step === STEPS.ITEMS && (
// //               <>
// //                 {orderItems.map((item, idx) => (
// //                   <div key={idx} className="series-list-product">
// //                     <button
// //                       type="button"
// //                       className="remove-item-btn"
// //                       onClick={() => handleRemoveItem(idx)}
// //                       title="Видалити позицію"
// //                     >
// //                       ✕
// //                     </button>

// //                     {/* Товар */}
// //                     <div className="bill-field full">
// //                       <span className="bill-field__label">Товар</span>
// //                       <BillItemSelect
// //                         value={item.itemGUID}
// //                         items={itemsList}
// //                         placeholder="— оберіть товар —"
// //                         onChange={(val) =>
// //                           handleItemChange(idx, "itemGUID", val)
// //                         }
// //                       />
// //                     </div>

// //                     {/* К-сть + Ціна */}
// //                     <div className="bill-field">
// //                       <span className="bill-field__label">К-сть</span>
// //                       <input
// //                         type="number"
// //                         min="1"
// //                         className="bill-input"
// //                         value={item.quantity}
// //                         onChange={(e) =>
// //                           handleItemChange(idx, "quantity", e.target.value)
// //                         }
// //                       />
// //                     </div>

// //                     <div className="bill-field">
// //                       <span className="bill-field__label">Ціна</span>
// //                       <input
// //                         type="text"
// //                         className="bill-input"
// //                         value={item.price}
// //                         onChange={(e) =>
// //                           handleItemChange(
// //                             idx,
// //                             "price",
// //                             e.target.value.replace(/[^0-9.]/g, ""),
// //                           )
// //                         }
// //                       />
// //                     </div>

// //                     {/* Ширина + Висота */}
// //                     <div className="bill-field">
// //                       <span className="bill-field__label">Ширина (мм)</span>
// //                       <input
// //                         type="number"
// //                         className="bill-input"
// //                         value={item.width}
// //                         onChange={(e) =>
// //                           handleItemChange(idx, "width", e.target.value)
// //                         }
// //                       />
// //                     </div>

// //                     <div className="bill-field">
// //                       <span className="bill-field__label">Висота (мм)</span>
// //                       <input
// //                         type="number"
// //                         className="bill-input"
// //                         value={item.height}
// //                         onChange={(e) =>
// //                           handleItemChange(idx, "height", e.target.value)
// //                         }
// //                       />
// //                     </div>
// //                   </div>
// //                 ))}

// //                 <button className="add-product-btn" onClick={handleAddItem}>
// //                   ➕ Додати позицію
// //                 </button>
// //               </>
// //             )}

// //             {/* STEP 3 */}
// //             {step === STEPS.CONFIRM && (
// //               <>
// //                 <div className="bill-field">
// //                   <span className="bill-field__label">Сума рахунку</span>
// //                   <input
// //                     className="bill-input"
// //                     disabled
// //                     value={totalSum.toFixed(2)}
// //                   />
// //                 </div>

// //                 <div className="bill-field">
// //                   <span className="bill-field__label">Дата оплати</span>
// //                   <input
// //                     type="date"
// //                     className="bill-input"
// //                     value={paymentDate}
// //                     onChange={(e) => setPaymentDate(e.target.value)}
// //                   />
// //                 </div>

// //                 <div className="bill-field">
// //                   <span className="bill-field__label">Дата відвантаження</span>
// //                   <input
// //                     type="date"
// //                     className="bill-input"
// //                     value={deliveryDate}
// //                     onChange={(e) => setDeliveryDate(e.target.value)}
// //                   />
// //                 </div>

// //                 <div className="bill-field">
// //                   <span className="bill-field__label">Коментар</span>
// //                   <textarea
// //                     className="bill-textarea"
// //                     value={internalComment}
// //                     onChange={(e) => setInternalComment(e.target.value)}
// //                   />
// //                 </div>
// //               </>
// //             )}
// //           </div>
// //         </div>

// //         {/* ===== FOOTER ===== */}
// //         <div className="bill-modal-footer">
// //           {step > 1 && (
// //             <button
// //               className="bill-btn-cancel"
// //               onClick={() => setStep(step - 1)}
// //             >
// //               ← Назад
// //             </button>
// //           )}

// //           {step < 3 && (
// //             <button
// //               className="bill-btn-save"
// //               onClick={() => {
// //                 // 1. Перевірка для першого кроку
// //                 if (step === STEPS.BASE) {
// //                   if (!selectedIban || !selectedAddress) {
// //                     addNotification(
// //                       "Будь ласка, оберіть IBAN та адресу доставки",
// //                       "info",
// //                     );
// //                     return;
// //                   }
// //                 }

// //                 // 2. Перевірка для другого кроку
// //                 if (step === STEPS.ITEMS) {
// //                   const hasInvalidItems = orderItems.some(
// //                     (i) =>
// //                       !i.itemGUID ||
// //                       Number(i.quantity) <= 0 ||
// //                       Number(i.price) <= 0,
// //                   );

// //                   if (orderItems.length === 0 || hasInvalidItems) {
// //                     addNotification(
// //                       "Перевірте товари: назва, кількість та ціна мають бути заповнені",
// //                       "info",
// //                     );
// //                     return;
// //                   }
// //                 }

                
// //                 setStep(step + 1);
// //               }}

// //               style={{
// //                 opacity:
// //                   (step === STEPS.BASE &&
// //                     (!selectedIban || !selectedAddress)) ||
// //                   (step === STEPS.ITEMS && orderItems.some((i) => !i.itemGUID))
// //                     ? 0.7
// //                     : 1,
// //               }}
// //             >
// //               Далі →
// //             </button>
// //           )}

// //           {step === 3 && (
// //             <button
// //               className="bill-btn-save"
// //               disabled={loading}
// //               onClick={handleSubmit}
// //             >
// //               {loading ? "Створюємо…" : "Створити рахунок"}
// //             </button>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// import React, { useEffect, useState } from "react";
// import axiosInstance from "../api/axios";
// import BillItemSelect from "./BillItemSelect";
// import BillSelect from "./BillSelect";
// import "./CreateCustomerBillModal.css";
// import { useNotification } from "../hooks/useNotification";
// import { useTranslation } from "react-i18next";
// import AutoTranslatedText from "../components/ui/AutoTranslatedText";
// import { FaPlus } from "react-icons/fa";

// const STEPS = {
//   BASE: 1,
//   ITEMS: 2,
//   CONFIRM: 3,
// };

// export default function CreateCustomerBillModal({
//   isOpen,
//   onClose,
//   onSuccess,
// }) {
//   const { t } = useTranslation();

//   const STEP_LABELS = {
//     [STEPS.BASE]: t("create_bill.steps.details"),
//     [STEPS.ITEMS]: t("create_bill.steps.items"),
//     [STEPS.CONFIRM]: t("create_bill.steps.confirm"),
//   };

//   useEffect(() => {
//     const handleEsc = (event) => {
//       if (event.key === "Escape") onClose();
//     };

//     window.addEventListener("keydown", handleEsc);
//     document.body.style.overflow = "hidden";

//     return () => {
//       window.removeEventListener("keydown", handleEsc);
//       document.body.style.overflow = "";
//     };
//   }, [onClose]);

//   const { addNotification } = useNotification();
//   const [step, setStep] = useState(STEPS.BASE);

//   const [addresses, setAddresses] = useState([]);
//   const [itemsList, setItemsList] = useState([]);
//   const [ibans, setIbans] = useState([]);
//   const [organisation, setOrganisation] = useState([]);

//   const [selectedIban, setSelectedIban] = useState("");
//   const [selectedAddress, setSelectedAddress] = useState("");

//   const [paymentDate, setPaymentDate] = useState("");
//   const [deliveryDate, setDeliveryDate] = useState("");
//   const [internalComment, setInternalComment] = useState("");

//   const [orderItems, setOrderItems] = useState([
//     {
//       itemGUID: "",
//       quantity: 1,
//       price: 0,
//       width: "",
//       height: "",
//     },
//   ]);

//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!isOpen) return;
//     const fetchProfile = async () => {
//       try {
//         const res = await axiosInstance.get(`/payments/dealers/profile/`);
//         const data = res.data || {};
//         setAddresses(data.data.addresses || []);
//         setIbans(data.data.accounts || []);
//         setItemsList(data.data.nomenclature || []);
//         setOrganisation(data.data.organizations || []);
//       } catch (err) {
//         if (process.env.NODE_ENV === 'development') {
//           console.error("Error fetching profile:", err);
//         }
//         addNotification(t("create_bill.notifications.profile_error"), "error");
//       }
//     };
//     fetchProfile();
//   }, [isOpen, addNotification, t]);

//   const handleAddItem = () => {
//     setOrderItems((prev) => [
//       ...prev,
//       { itemGUID: "", quantity: 1, price: 0, width: "", height: "" },
//     ]);
//   };

//   const handleRemoveItem = (index) => {
//     setOrderItems((prev) =>
//       prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
//     );
//   };

//   const handleItemChange = (index, field, value) => {
//     setOrderItems((prev) => {
//       const copy = [...prev];
//       copy[index][field] = value;
//       return copy;
//     });
//   };

//   const totalSum = orderItems.reduce(
//     (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
//     0,
//   );

//   const handleSubmit = async () => {
//     setLoading(true);

//     const dto = {
//       IbanGUID: selectedIban,
//       AddressGUID: selectedAddress,
//       OrderSuma: totalSum,
//       InternalComment: internalComment,
//       OrderPaymentDate: paymentDate || null,
//       OrderDeliveryDate: deliveryDate || null,
//       OrderItemsLIST: orderItems.map((i) => ({
//         ItemGUID: i.itemGUID,
//         Count: Number(i.quantity) || 0,
//         Price: Number(i.price) || 0,
//         Width: i.width || null,
//         Height: i.height || null,
//       })),
//       OrderCreateDate: new Date().toISOString(),
//     };

//     try {
//       await axiosInstance.post("/payments/create_invoice/", dto);
//       addNotification(t("create_bill.notifications.success"), "success");
//       onSuccess?.();
//       onClose();
//     } catch (error) {
//       if (process.env.NODE_ENV === 'development') {
//         console.error("Error creating bill:", error);
//       }
//       addNotification(t("create_bill.notifications.submit_error"), "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="bill-modal-overlay">
//       <div className="bill-modal-window">
//         <div className="bill-modal-header">
//           <h3>
//             🧾 {t("create_bill.title")}
//             <span className="step-info"> • {STEP_LABELS[step]}</span>
//           </h3>
//           <button className="bill-close-btn" onClick={onClose}>
//             ✕
//           </button>
//         </div>

//         <div className="bill-progress-container">
//           <div
//             className="bill-progress-bar"
//             style={{ width: `${(step / 3) * 100}%` }}
//           ></div>
//         </div>

//         <div className="bill-form-scroll">
//           <div className="bill-form">
//             {step === STEPS.BASE && (
//               <>
//                 <div className="bill-field">
//                   <span className="bill-field__label">{t("create_bill.fields.iban")}</span>
//                   <BillSelect
//                     value={selectedIban}
//                     options={ibans}
//                     placeholder={t("create_bill.placeholders.iban")}
//                     getValue={(i) => i.AccountGUID}
//                     getLabel={(i) => `${i.NumberBills} — ${i.AccountName}`}
//                     onChange={setSelectedIban}
//                   />
//                 </div>

//                 <div className="bill-field">
//                   <span className="bill-field__label">{t("create_bill.fields.address")}</span>
//                   <BillSelect
//                     value={selectedAddress}
//                     options={addresses}
//                     placeholder={t("create_bill.placeholders.address")}
//                     getValue={(a) => a.AddressKindGUID}
//                     getLabel={(a) => `${a.AddressKind} — ${a.AddressValue}`}
//                     onChange={setSelectedAddress}
//                   />
//                 </div>
//               </>
//             )}

//             {step === STEPS.ITEMS && (
//               <>
//                 {orderItems.map((item, idx) => (
//                   <div key={idx} className="series-list-product">
//                     <button
//                       type="button"
//                       className="remove-item-btn"
//                       onClick={() => handleRemoveItem(idx)}
//                       title={t("create_bill.actions.remove_item")}
//                     >
//                       ✕
//                     </button>

//                     <div className="bill-field full">
//                       <span className="bill-field__label">{t("create_bill.fields.product")}</span>
//                       <BillItemSelect
//                         value={item.itemGUID}
//                         items={itemsList}
//                         placeholder={t("create_bill.placeholders.product")}
//                         onChange={(val) =>
//                           handleItemChange(idx, "itemGUID", val)
//                         }
//                       />
//                     </div>

//                     <div className="bill-field">
//                       <span className="bill-field__label">{t("create_bill.fields.quantity")}</span>
//                       <input
//                         type="number"
//                         min="1"
//                         className="bill-input"
//                         value={item.quantity}
//                         onChange={(e) =>
//                           handleItemChange(idx, "quantity", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div className="bill-field">
//                       <span className="bill-field__label">{t("create_bill.fields.price")}</span>
//                       <input
//                         type="text"
//                         className="bill-input"
//                         value={item.price}
//                         onChange={(e) =>
//                           handleItemChange(
//                             idx,
//                             "price",
//                             e.target.value.replace(/[^0-9.]/g, ""),
//                           )
//                         }
//                       />
//                     </div>

//                     <div className="bill-field">
//                       <span className="bill-field__label">{t("create_bill.fields.width")}</span>
//                       <input
//                         type="number"
//                         className="bill-input"
//                         value={item.width}
//                         onChange={(e) =>
//                           handleItemChange(idx, "width", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div className="bill-field">
//                       <span className="bill-field__label">{t("create_bill.fields.height")}</span>
//                       <input
//                         type="number"
//                         className="bill-input"
//                         value={item.height}
//                         onChange={(e) =>
//                           handleItemChange(idx, "height", e.target.value)
//                         }
//                       />
//                     </div>
//                   </div>
//                 ))}

//                 <button 
//                   className="add-product-btn no-wrap" 
//                   onClick={handleAddItem}
//                   style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
//                 >
//                   <FaPlus/> 
//                   <span>{t("create_bill.actions.add_item")}</span>
//                 </button>
//               </>
//             )}

//             {step === STEPS.CONFIRM && (
//               <>
//                 <div className="bill-field">
//                   <span className="bill-field__label">{t("create_bill.fields.total")}</span>
//                   <input
//                     className="bill-input"
//                     disabled
//                     value={totalSum.toFixed(2)}
//                   />
//                 </div>

//                 <div className="bill-field">
//                   <span className="bill-field__label">{t("create_bill.fields.payment_date")}</span>
//                   <input
//                     type="date"
//                     className="bill-input"
//                     value={paymentDate}
//                     onChange={(e) => setPaymentDate(e.target.value)}
//                   />
//                 </div>

//                 <div className="bill-field">
//                   <span className="bill-field__label">{t("create_bill.fields.delivery_date")}</span>
//                   <input
//                     type="date"
//                     className="bill-input"
//                     value={deliveryDate}
//                     onChange={(e) => setDeliveryDate(e.target.value)}
//                   />
//                 </div>

//                 <div className="bill-field">
//                   <span className="bill-field__label">{t("create_bill.fields.comment")}</span>
//                   <textarea
//                     className="bill-textarea"
//                     value={internalComment}
//                     onChange={(e) => setInternalComment(e.target.value)}
//                   />
//                 </div>
//               </>
//             )}
//           </div>
//         </div>

//         <div className="bill-modal-footer">
//           {step > 1 && (
//             <button
//               className="bill-btn-cancel"
//               onClick={() => setStep(step - 1)}
//             >
//               ← {t("common.back")}
//             </button>
//           )}

//           {step < 3 && (
//             <button
//               className="bill-btn-save"
//               onClick={() => {
//                 if (step === STEPS.BASE) {
//                   if (!selectedIban || !selectedAddress) {
//                     addNotification(t("create_bill.validation.step1"), "info");
//                     return;
//                   }
//                 }

//                 if (step === STEPS.ITEMS) {
//                   const hasInvalidItems = orderItems.some(
//                     (i) =>
//                       !i.itemGUID ||
//                       Number(i.quantity) <= 0 ||
//                       Number(i.price) <= 0,
//                   );

//                   if (orderItems.length === 0 || hasInvalidItems) {
//                     addNotification(t("create_bill.validation.step2"), "info");
//                     return;
//                   }
//                 }
//                 setStep(step + 1);
//               }}
//             >
//               {t("common.next")} →
//             </button>
//           )}

//           {step === 3 && (
//             <button
//               className="bill-btn-save"
//               disabled={loading}
//               onClick={handleSubmit}
//             >
//               {loading ? t("create_bill.actions.creating") : t("create_bill.actions.submit")}
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import BillItemSelect from "./BillItemSelect";
import BillSelect from "./BillSelect";
import "./CreateCustomerBillModal.css";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next";
import AutoTranslatedText from "../components/ui/AutoTranslatedText";
import { FaPlus } from "react-icons/fa";

const STEPS = {
  BASE: 1,
  ITEMS: 2,
  CONFIRM: 3,
};

export default function CreateCustomerBillModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation();

  const STEP_LABELS = {
    [STEPS.BASE]: t("create_bill.steps.details"),
    [STEPS.ITEMS]: t("create_bill.steps.items"),
    [STEPS.CONFIRM]: t("create_bill.steps.confirm"),
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const { addNotification } = useNotification();
  const [step, setStep] = useState(STEPS.BASE);

  const [addresses, setAddresses] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [ibans, setIbans] = useState([]);
  const [organisation, setOrganisation] = useState([]);

  // Стани для форми
  const [selectedOrgCode, setSelectedOrgCode] = useState("");
  const [selectedOrgAccount, setSelectedOrgAccount] = useState("");
  const [selectedIban, setSelectedIban] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");

  const [paymentDate, setPaymentDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [internalComment, setInternalComment] = useState("");

  const [orderItems, setOrderItems] = useState([
    {
      itemGUID: "",
      quantity: 1,
      price: 0,
      width: "",
      height: "",
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get(`/payments/dealers/profile/`);
        const data = res.data || {};
        setAddresses(data.data.addresses || []);
        setIbans(data.data.accounts || []);
        setItemsList(data.data.nomenclature || []);
        setOrganisation(data.data.organizations || []);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching profile:", err);
        }
        addNotification(t("create_bill.notifications.profile_error"), "error");
      }
    };
    fetchProfile();
  }, [isOpen, addNotification, t]);

  // Фільтрація унікальних організацій для першого селекту
  const uniqueOrganizations = Array.from(
    new Map(organisation.map((org) => [org.OrganizationCode, org])).values()
  );

  // Фільтрація рахунків для обраної організації
  const filteredAccounts = organisation.filter(
    (org) => org.OrganizationCode === selectedOrgCode
  );

  // Хендлер зміни організації (скидає обраний раніше рахунок)
  const handleOrganizationChange = (orgCode) => {
    setSelectedOrgCode(orgCode);
    setSelectedOrgAccount("");
  };

  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { itemGUID: "", quantity: 1, price: 0, width: "", height: "" },
    ]);
  };

  const handleRemoveItem = (index) => {
    setOrderItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const totalSum = orderItems.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0,
  );

  const handleSubmit = async () => {
    setLoading(true);

    const dto = {
      IbanGUID: selectedIban || null, // Тепер необов'язкове поле
      OrganizationGUID: selectedOrgAccount || null, // Передаємо обраний LinkReg конкретного рахунку організації
      AddressGUID: selectedAddress,
      OrderSuma: totalSum,
      InternalComment: internalComment,
      OrderPaymentDate: paymentDate || null,
      OrderDeliveryDate: deliveryDate || null,
      OrderItemsLIST: orderItems.map((i) => ({
        ItemGUID: i.itemGUID,
        Count: Number(i.quantity) || 0,
        Price: Number(i.price) || 0,
        Width: i.width || null,
        Height: i.height || null,
      })),
      OrderCreateDate: new Date().toISOString(),
    };

    try {
      await axiosInstance.post("/payments/create_invoice/", dto);
      addNotification(t("create_bill.notifications.success"), "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error creating bill:", error);
      }
      addNotification(t("create_bill.notifications.submit_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bill-modal-overlay">
      <div className="bill-modal-window">
        <div className="bill-modal-header">
          <h3>
            🧾 {t("create_bill.title")}
            <span className="step-info"> • {STEP_LABELS[step]}</span>
          </h3>
          <button className="bill-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="bill-progress-container">
          <div
            className="bill-progress-bar"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <div className="bill-form-scroll">
          <div className="bill-form">
            {step === STEPS.BASE && (
              <>
                {/* 1. Селект для вибору Організації */}
                <div className="bill-field">
                  <span className="bill-field__label">
                    {t("create_bill.fields.organization", "Організація")}
                  </span>
                  <BillSelect
                    value={selectedOrgCode}
                    options={uniqueOrganizations}
                    placeholder={t("create_bill.placeholders.organization", "Оберіть організацію")}
                    getValue={(org) => org.OrganizationCode}
                    getLabel={(org) => `${org.WorkingName} (${org.FullName})`}
                    onChange={handleOrganizationChange}
                  />
                </div>

                {/* 2. Селект для вибору Рахунку організації */}
                <div className="bill-field">
                  <span className="bill-field__label">
                    {t("create_bill.fields.org_account", "Рахунок для оплати")}
                  </span>
                  <BillSelect
                    value={selectedOrgAccount}
                    options={filteredAccounts}
                    placeholder={
                      selectedOrgCode 
                        ? t("create_bill.placeholders.org_account", "Оберіть рахунок") 
                        : t("create_bill.placeholders.select_org_first", "Спочатку оберіть організацію")
                    }
                    disabled={!selectedOrgCode}
                    getValue={(org) => org.LinkReg}
                    getLabel={(org) => `${org.AccountNameInRegBase} — ${org.AccountNumberInRegBase}`}
                    onChange={setSelectedOrgAccount}
                  />
                </div>

                {/* 3. Поле IBAN (Необов'язкове) */}
                <div className="bill-field">
                  <span className="bill-field__label">
                    {t("create_bill.fields.iban")}{" "}
                  
                  </span>
                  <BillSelect
                    value={selectedIban}
                    options={ibans}
                    placeholder={t("create_bill.placeholders.iban")}
                    getValue={(i) => i.AccountGUID}
                    getLabel={(i) => `${i.NumberBills} — ${i.AccountName}`}
                    onChange={setSelectedIban}
                  />
                </div>

                {/* 4. Адреса */}
                <div className="bill-field">
                  <span className="bill-field__label">{t("create_bill.fields.address")}</span>
                  <BillSelect
                    value={selectedAddress}
                    options={addresses}
                    placeholder={t("create_bill.placeholders.address")}
                    getValue={(a) => a.AddressKindGUID}
                    getLabel={(a) => `${a.AddressKind} — ${a.AddressValue}`}
                    onChange={setSelectedAddress}
                  />
                </div>
              </>
            )}

            {step === STEPS.ITEMS && (
              <>
                {orderItems.map((item, idx) => (
                  <div key={idx} className="series-list-product">
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => handleRemoveItem(idx)}
                      title={t("create_bill.actions.remove_item")}
                    >
                      ✕
                    </button>

                    <div className="bill-field full">
                      <span className="bill-field__label">{t("create_bill.fields.product")}</span>
                      <BillItemSelect
                        value={item.itemGUID}
                        items={itemsList}
                        placeholder={t("create_bill.placeholders.product")}
                        onChange={(val) =>
                          handleItemChange(idx, "itemGUID", val)
                        }
                      />
                    </div>

                    <div className="bill-field">
                      <span className="bill-field__label">{t("create_bill.fields.quantity")}</span>
                      <input
                        type="number"
                        min="1"
                        className="bill-input"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", e.target.value)
                        }
                      />
                    </div>

                    <div className="bill-field">
                      <span className="bill-field__label">{t("create_bill.fields.price")}</span>
                      <input
                        type="text"
                        className="bill-input"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "price",
                            e.target.value.replace(/[^0-9.]/g, ""),
                          )
                        }
                      />
                    </div>

                    <div className="bill-field">
                      <span className="bill-field__label">{t("create_bill.fields.width")}</span>
                      <input
                        type="number"
                        className="bill-input"
                        value={item.width}
                        onChange={(e) =>
                          handleItemChange(idx, "width", e.target.value)
                        }
                      />
                    </div>

                    <div className="bill-field">
                      <span className="bill-field__label">{t("create_bill.fields.height")}</span>
                      <input
                        type="number"
                        className="bill-input"
                        value={item.height}
                        onChange={(e) =>
                          handleItemChange(idx, "height", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}

                <button 
                  className="add-product-btn no-wrap" 
                  onClick={handleAddItem}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
                >
                  <FaPlus/> 
                  <span>{t("create_bill.actions.add_item")}</span>
                </button>
              </>
            )}

            {step === STEPS.CONFIRM && (
              <>
                <div className="bill-field">
                  <span className="bill-field__label">{t("create_bill.fields.total")}</span>
                  <input
                    className="bill-input"
                    disabled
                    value={totalSum.toFixed(2)}
                  />
                </div>

                <div className="bill-field">
                  <span className="bill-field__label">{t("create_bill.fields.payment_date")}</span>
                  <input
                    type="date"
                    className="bill-input"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <div className="bill-field">
                  <span className="bill-field__label">{t("create_bill.fields.delivery_date")}</span>
                  <input
                    type="date"
                    className="bill-input"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>

                <div className="bill-field">
                  <span className="bill-field__label">{t("create_bill.fields.comment")}</span>
                  <textarea
                    className="bill-textarea"
                    value={internalComment}
                    onChange={(e) => setInternalComment(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bill-modal-footer">
          {step > 1 && (
            <button
              className="bill-btn-cancel"
              onClick={() => setStep(step - 1)}
            >
              ← {t("common.back")}
            </button>
          )}

          {step < 3 && (
            <button
              className="bill-btn-save"
              onClick={() => {
                if (step === STEPS.BASE) {
                  // Валідація: Організаційний рахунок та Адреса є обов'язковими, IBAN — ні
                  if (!selectedOrgAccount || !selectedAddress) {
                    addNotification(t("create_bill.validation.step1"), "info");
                    return;
                  }
                }

                if (step === STEPS.ITEMS) {
                  const hasInvalidItems = orderItems.some(
                    (i) =>
                      !i.itemGUID ||
                      Number(i.quantity) <= 0 ||
                      Number(i.price) <= 0,
                  );

                  if (orderItems.length === 0 || hasInvalidItems) {
                    addNotification(t("create_bill.validation.step2"), "info");
                    return;
                  }
                }
                setStep(step + 1);
              }}
            >
              {t("common.next")} →
            </button>
          )}

          {step === 3 && (
            <button
              className="bill-btn-save"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? t("create_bill.actions.creating") : t("create_bill.actions.submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}