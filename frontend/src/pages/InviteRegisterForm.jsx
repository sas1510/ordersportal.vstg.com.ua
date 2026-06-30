// // import { useState, useEffect, useMemo } from "react";
// // import { useParams } from "react-router-dom";
// // import axiosInstance from "../api/axios";
// // // Якщо ви створили файл useNotification.js у папці hooks:
// // import { useNotification } from "../hooks/useNotification";
// // import "./InviteRegisterForm.css";
// // import { QRCodeCanvas } from "qrcode.react";

// // const ROLE_LABELS = {
// //   admin: "Адміністратор",
// //   manager: "Менеджер",
// //   operator: "Оператор",
// //   director: "Директор",
// //   region_manager: "Регіональний менеджер",
// //   complaint_manager: "Менеджер скарг",
// //   customer: "Дилер",
// // };

// // /* ================= PHONE HELPERS (з ClientAddressModal) ================= */

// // const isValidPhoneUA = (phone) => {
// //   return /^\+380\d{9}$/.test(phone);
// // };

// // const formatPhoneInput = (value) => {
// //   let digits = value.replace(/[^\d]/g, "");

// //   if (!digits) return "";

// //   if (digits.startsWith("0")) digits = "38" + digits;
// //   else if (digits.startsWith("9")) digits = "380" + digits;
// //   else if (digits.startsWith("80")) digits = "3" + digits;

// //   return ("+" + digits).slice(0, 13);
// // };

// // export default function InviteRegisterForm() {
// //   const { code } = useParams();
// //   const { addNotification } = useNotification();

// //   const [formData, setFormData] = useState({
// //     full_name: "",
// //     phone_number: "",
// //     email: "",
// //     password: "",
// //   });

// //   const [info, setInfo] = useState({
// //     username: "",
// //     role: "",
// //     expire_date: "",
// //   });

// //   const [tgLink, setTgLink] = useState("");

// //   const [loading, setLoading] = useState(true);
// //   const [success, setSuccess] = useState(false);
// //   const [error, setError] = useState(null);

// //   /* ================= PASSWORD VALIDATION ================= */

// //   const passwordErrors = useMemo(() => {
// //     const p = formData.password;
// //     const errors = [];

// //     if (!p) return errors;
// //     if (p.length < 8) errors.push("Мінімум 8 символів");
// //     if (!/[a-z]/.test(p)) errors.push("Має містити малу літеру");
// //     if (!/[A-Z]/.test(p)) errors.push("Має містити велику літеру");
// //     if (!/[0-9]/.test(p)) errors.push("Має містити цифру");
// //     if (!/[!@#$%^&*()_+=\-{}[\]:;"'<>,.?/]/.test(p))
// //       errors.push("Має містити спецсимвол");

// //     return errors;
// //   }, [formData.password]);

// //   const isPasswordValid = passwordErrors.length === 0;

// //   const passwordStrength = useMemo(() => {
// //     const p = formData.password;
// //     let score = 0;

// //     if (!p) return { score: 0, label: "", color: "#ccc" };

// //     if (p.length >= 8) score++;
// //     if (/[a-z]/.test(p)) score++;
// //     if (/[A-Z]/.test(p)) score++;
// //     if (/[0-9]/.test(p)) score++;
// //     if (/[!@#$%^&*()_+=\-{}[\]:;"'<>,.?/]/.test(p)) score++;

// //     if (score <= 1) return { score, label: "Слабкий пароль", color: "#e74c3c" };
// //     if (score <= 3)
// //       return { score, label: "Середній пароль", color: "#f1c40f" };
// //     return { score, label: "Надійний пароль", color: "#2ecc71" };
// //   }, [formData.password]);

// //   /* ================= LOAD DATA ================= */

// //   useEffect(() => {
// //     axiosInstance
// //       .get(`/register/${code}/`)
// //       .then((res) => {
// //         const d = res.data;
// //         setFormData({
// //           full_name: d.full_name || "",
// //           phone_number: d.phone_number || "",
// //           email: d.email || "",
// //           password: "",
// //         });
// //         setInfo({
// //           username: d.username || "",
// //           role: d.role || "",
// //           expire_date: d.expire_date || "",
// //         });
// //         setTgLink(d.tg_link || "");
// //         setLoading(false);
// //       })
// //       .catch((err) => {
// //         setError(err.response?.data?.error || "Не вдалося завантажити дані");
// //         setLoading(false);
// //       });
// //   }, [code]);

// //   /* ================= SUBMIT ================= */

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setError(null);

// //     if (!isPasswordValid) {
// //       addNotification("Пароль не відповідає вимогам безпеки", "error");
// //       return;
// //     }

// //     if (formData.phone_number && !isValidPhoneUA(formData.phone_number)) {
// //       addNotification(
// //         "Некоректний формат телефону. Використовуйте +380XXXXXXXXX",
// //         "error",
// //       );
// //       return;
// //     }

// //     try {
// //       await axiosInstance.post(`/register/${code}/`, formData);
// //       setSuccess(true);
// //     } catch (err) {
// //       addNotification(
// //         err.response?.data?.error || "Помилка реєстрації",
// //         "error",
// //       );
// //     }
// //   };

// //   /* ================= STATES ================= */

// //   if (loading)
// //     return (
// //       <div className="portal-body align-center">
// //         <div className="loading-spinner"></div>
// //       </div>
// //     );

// //   if (error)
// //     return (
// //       <div className="portal-body align-center">
// //         <div className="panel invite-panel text-danger text-center invite-padding">
// //           {error}
// //         </div>
// //       </div>
// //     );

// //   if (success)
// //     return (
// //       <div className="portal-body align-center">
// //         <div className="panel invite-panel invite-padding shadow-sm">
// //           <div
// //             className="text-success"
// //             style={{
// //               display: "flex",
// //               alignItems: "center",
// //               justifyContent: "center",
// //               gap: "10px",
// //               marginTop: "20px",
// //             }}
// //           >
// //             <i className="fa-solid fa-circle-check font-size-32"></i>
// //             <span className="text-bold">
// //               Реєстрацію успішно завершено! Тепер ви можете увійти в систему.
// //             </span>
// //           </div>

// //           {tgLink && (
// //             <hr
// //               className="invite-border-bottom"
// //               style={{ margin: "20px 0", opacity: 0.3 }}
// //             />
// //           )}

// //           {tgLink && (
// //             <div className="qr-section column align-center gap-5 mt-5">
// //               <h3 className="font-size-18 uppercase text-info text-bold m-0">
// //                 <i className="fa-brands fa-telegram mr-10"></i>
// //                 Підключіть Telegram-бот
// //               </h3>
// //               <p className="text-muted font-size-14 text-center">
// //                 Відскануйте QR-код для отримання сповіщень про замовлення
// //               </p>

// //               <div
// //                 className="qr-image-wrapper"
// //                 style={{
// //                   background: "white",
// //                   padding: "15px",
// //                   borderRadius: "3px",
// //                   boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
// //                   marginTop: "10px",
// //                 }}
// //               >
// //                 <QRCodeCanvas
// //                   value={tgLink}
// //                   size={180}
// //                   level="H"
// //                   includeMargin={true}
// //                 />
// //               </div>

// //               <a
// //                 href={tgLink}
// //                 target="_blank"
// //                 rel="noreferrer"
// //                 className="btn-link mt-15"
// //                 style={{
// //                   textDecoration: "none",
// //                   color: "#ffffff",
// //                   backgroundColor: "#0088cc",
// //                   padding: "10px 10px",
// //                   borderRadius: "3px",
// //                   fontWeight: "bold",
// //                   display: "flex",
// //                   alignItems: "center",
// //                 }}
// //               >
// //                 <i
// //                   className="fa-brands fa-telegram mr-10"
// //                   style={{ fontSize: "20px" }}
// //                 ></i>
// //                 Перейти в Telegram
// //               </a>
// //             </div>
// //           )}

// //           {/* Кнопка повернення до входу */}
// //           <div className="mt-5 text-center">
// //             <a
// //               href="/login"
// //               className="text-info font-size-14"
// //               style={{ textDecoration: "none" }}
// //             >
// //               Повернутися до входу
// //             </a>
// //           </div>
// //         </div>
// //       </div>
// //     );

// //   /* ================= RENDER ================= */

// //   return (
// //     <div className="portal-body">
// //       <div className="invite-wrapper">
// //         <div className="invite-padding">
// //           <div className="panel invite-panel column gap-5 shadow-sm">
// //             {/* Header */}
// //             <div className="invite-header-container invite-border-bottom invite-pb-10">
// //               <div className="header uppercase text-info font-size-18 text-bold">
// //                 <i className="fa-solid fa-user-plus mr-10"></i>
// //                 Завершення реєстрації
// //               </div>
// //             </div>

// //             {/* Static Info Card */}
// //             <div className="invite-info-card">
// //               <div className="invite-info-card-header invite-border-bottom uppercase font-size-16 mb-3">
// //                 Параметри доступу від адміністратора:
// //               </div>

// //               <div className="invite-info-grid mt-3">
// //                 <div className="invite-info-block">
// //                   <label>Ваш логін в систему</label>
// //                   <div className="invite-info-data text-bold">
// //                     {info.username || "—"}
// //                   </div>
// //                 </div>

// //                 <div className="invite-info-block">
// //                   <label>Тип аккаунта</label>
// //                   <span className="invite-role-badge">
// //                     {ROLE_LABELS[info.role] || info.role}
// //                   </span>
// //                 </div>

// //                 <div className="invite-info-block">
// //                   <label>Акаунт активний до:</label>
// //                   {info.expire_date ? (
// //                     <span className="expire-date">
// //                       {new Date(info.expire_date).toLocaleDateString("uk-UA")}
// //                     </span>
// //                   ) : (
// //                     <span className="text-success text-bold">Безстроково</span>
// //                   )}
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Form */}
// //             <form onSubmit={handleSubmit} className="column invite-gap-4">
// //               {/* WARNINGS */}
// //               <div className="invite-section-intro">
// //                 <h2 className="font-size-24 text-dark m-0">Персональні дані</h2>
// //                 <div className="text-danger font-size-16">
// //                   <p className="m-0">
// //                     Перевірте та за потреби відредагуйте контактні дані та
// //                     встановіть пароль.
// //                   </p>
// //                   <p className="m-0 text-danger text-bold">
// //                     Важливо: збережіть свій логін та пароль!
// //                   </p>
// //                 </div>
// //               </div>

// //               <div className="invite-form-grid">
// //                 {/* FULL NAME */}
// //                 <div className="invite-input-group">
// //                   <label className="invite-required">Повне ім’я (ПІБ)</label>
// //                   <input
// //                     name="full_name"
// //                     value={formData.full_name}
// //                     onChange={(e) =>
// //                       setFormData((p) => ({ ...p, full_name: e.target.value }))
// //                     }
// //                     required
// //                   />
// //                 </div>

// //                 {/* EMAIL */}
// //                 <div className="invite-input-group">
// //                   <label className="invite-required">Email</label>
// //                   <input
// //                     type="email"
// //                     name="email"
// //                     value={formData.email}
// //                     onChange={(e) =>
// //                       setFormData((p) => ({ ...p, email: e.target.value }))
// //                     }
// //                     required
// //                   />
// //                 </div>

// //                 {/* PHONE */}
// //                 <div className="invite-input-group">
// //                   <label>Телефон</label>
// //                   <input
// //                     name="phone_number"
// //                     placeholder="+380XXXXXXXXX"
// //                     value={formData.phone_number}
// //                     maxLength={13}
// //                     onChange={(e) => {
// //                       const val = e.target.value;
// //                       if (e.nativeEvent.inputType === "deleteContentBackward") {
// //                         setFormData((p) => ({ ...p, phone_number: val }));
// //                       } else {
// //                         setFormData((p) => ({
// //                           ...p,
// //                           phone_number: formatPhoneInput(val),
// //                         }));
// //                       }
// //                     }}
// //                   />
// //                 </div>

// //                 {/* PASSWORD */}
// //                 <div className="invite-input-group">
// //                   <label className="invite-required">Новий пароль</label>
// //                   <input
// //                     type="password"
// //                     name="password"
// //                     value={formData.password}
// //                     onChange={(e) =>
// //                       setFormData((p) => ({ ...p, password: e.target.value }))
// //                     }
// //                     required
// //                   />

// //                   {formData.password && (
// //                     <div className="password-strength-wrapper">
// //                       <div className="password-strength-bar">
// //                         <div
// //                           className="password-strength-fill"
// //                           style={{
// //                             width: `${(passwordStrength.score / 5) * 100}%`,
// //                             backgroundColor: passwordStrength.color,
// //                           }}
// //                         />
// //                       </div>
// //                       <div
// //                         className="password-strength-label"
// //                         style={{ color: passwordStrength.color }}
// //                       >
// //                         {passwordStrength.label}
// //                       </div>
// //                     </div>
// //                   )}

// //                   {passwordErrors.length > 0 && (
// //                     <ul className="password-rules">
// //                       {passwordErrors.map((e, i) => (
// //                         <li key={i}>{e}</li>
// //                       ))}
// //                     </ul>
// //                   )}
// //                 </div>
// //               </div>

// //               <div className="invite-border-top pt-5">
// //                 <button
// //                   type="submit"
// //                   className={`invite-btn-submit ${!isPasswordValid ? "not-ready" : ""}`}
// //                 >
// //                   <span>Створити профіль</span>
// //                   <i className="fa-solid fa-arrow-right ml-10"></i>
// //                 </button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// import { useState, useEffect, useMemo } from "react";
// import { useParams, Link } from "react-router-dom"; 
// import axiosInstance from "../api/axios";
// import { useNotification } from "../hooks/useNotification";
// import { useTranslation } from "react-i18next"; 
// import "./InviteRegisterForm.css";
// import { QRCodeCanvas } from "qrcode.react";

// export default function InviteRegisterForm() {
//   const { code } = useParams();
//   const { addNotification } = useNotification();
//   const { t } = useTranslation();

 
//   const ROLE_LABELS = {
//     admin: t("roles.admin"),
//     manager: t("roles.manager"),
//     operator: t("roles.operator"),
//     director: t("roles.director"),
//     region_manager: t("roles.region_manager"),
//     complaint_manager: t("roles.complaint_manager"),
//     customer: t("roles.customer"),
//   };

//   const [formData, setFormData] = useState({
//     full_name: "",
//     phone_number: "",
//     email: "",
//     password: "",
//   });

//   const [info, setInfo] = useState({
//     username: "",
//     role: "",
//     expire_date: "",
//   });

//   const [tgLink, setTgLink] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState(null);


//   const isValidPhoneUA = (phone) => /^\+380\d{9}$/.test(phone);

//   const formatPhoneInput = (value) => {
//     let digits = value.replace(/[^\d]/g, "");
//     if (!digits) return "";
//     if (digits.startsWith("0")) digits = "38" + digits;
//     else if (digits.startsWith("9")) digits = "380" + digits;
//     else if (digits.startsWith("80")) digits = "3" + digits;
//     return ("+" + digits).slice(0, 13);
//   };


//   const passwordErrors = useMemo(() => {
//     const p = formData.password;
//     const errors = [];
//     if (!p) return errors;
//     if (p.length < 8) errors.push(t("invite.password_rules.min_length"));
//     if (!/[a-z]/.test(p)) errors.push(t("invite.password_rules.lowercase"));
//     if (!/[A-Z]/.test(p)) errors.push(t("invite.password_rules.uppercase"));
//     if (!/[0-9]/.test(p)) errors.push(t("invite.password_rules.number"));
//     if (!/[!@#$%^&*()_+=\-{}[\]:;"'<>,.?/]/.test(p)) errors.push(t("invite.password_rules.special"));
//     return errors;
//   }, [formData.password, t]);

//   const isPasswordValid = passwordErrors.length === 0;

//   const passwordStrength = useMemo(() => {
//     const p = formData.password;
//     let score = 0;
//     if (!p) return { score: 0, label: "", color: "#ccc" };
//     if (p.length >= 8) score++;
//     if (/[a-z]/.test(p)) score++;
//     if (/[A-Z]/.test(p)) score++;
//     if (/[0-9]/.test(p)) score++;
//     if (/[!@#$%^&*()_+=\-{}[\]:;"'<>,.?/]/.test(p)) score++;

//     if (score <= 1) return { score, label: t("invite.strength.weak"), color: "#e74c3c" };
//     if (score <= 3) return { score, label: t("invite.strength.medium"), color: "#f1c40f" };
//     return { score, label: t("invite.strength.strong"), color: "#2ecc71" };
//   }, [formData.password, t]);

//   /* ================= LOAD DATA ================= */
//   useEffect(() => {
//     axiosInstance
//       .get(`/register/${code}/`)
//       .then((res) => {
//         const d = res.data;
//         setFormData((prev) => ({
//           ...prev,
//           full_name: d.full_name || "",
//           phone_number: d.phone_number || "",
//           email: d.email || "",
//         }));
//         setInfo({
//           username: d.username || "",
//           role: d.role || "",
//           expire_date: d.expire_date || "",
//         });
//         setTgLink(d.tg_link || "");
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.response?.data?.error || t("invite.errors.load_fail"));
//         setLoading(false);
//       });
//   }, [code, t]);

//   /* ================= SUBMIT ================= */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);

//     if (!isPasswordValid) {
//       addNotification(t("invite.errors.invalid_password"), "error");
//       return;
//     }

//     if (formData.phone_number && !isValidPhoneUA(formData.phone_number)) {
//       addNotification(t("invite.errors.invalid_phone"), "error");
//       return;
//     }

//     try {
//       await axiosInstance.post(`/register/${code}/`, formData);
//       setSuccess(true);
//     } catch (err) {
//       addNotification(err.response?.data?.error || t("invite.errors.reg_fail"), "error");
//     }
//   };

//   if (loading)
//     return (
//       <div className="portal-body align-center">
//         <div className="loading-spinner"></div>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="portal-body align-center">
//         <div className="panel invite-panel text-danger text-center invite-padding">{error}</div>
//       </div>
//     );

//   if (success)
//     return (
//       <div className="portal-body align-center">
//         <div className="panel invite-panel invite-padding shadow-sm">
//           <div className="text-success" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
//             <i className="fa-solid fa-circle-check font-size-32"></i>
//             <span className="text-bold">{t("invite.success_message")}</span>
//           </div>

//           {tgLink && (
//             <>
//               <hr className="invite-border-bottom" style={{ margin: "20px 0", opacity: 0.3 }} />
//               <div className="qr-section column align-center gap-5 mt-5">
//                 <h3 className="font-size-18 uppercase text-info text-bold m-0">
//                   <i className="fa-brands fa-telegram mr-10"></i>
//                   {t("invite.tg.title")}
//                 </h3>
//                 <p className="text-muted font-size-14 text-center">{t("invite.tg.description")}</p>
//                 <div className="qr-image-wrapper" style={{ background: "white", padding: "15px", borderRadius: "3px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", marginTop: "10px" }}>
//                   <QRCodeCanvas value={tgLink} size={180} level="H" includeMargin={true} />
//                 </div>
//                 <a href={tgLink} target="_blank" rel="noreferrer" className="btn-link mt-15" style={{ textDecoration: "none", color: "#ffffff", backgroundColor: "#0088cc", padding: "10px 10px", borderRadius: "3px", fontWeight: "bold", display: "flex", alignItems: "center" }}>
//                   <i className="fa-brands fa-telegram mr-10" style={{ fontSize: "20px" }}></i>
//                   {t("invite.tg.button")}
//                 </a>
//               </div>
//             </>
//           )}

//           <div className="mt-5 text-center">
//             <Link to="/login" className="text-info font-size-14" style={{ textDecoration: "none" }}>
//               {t("invite.back_to_login")}
//             </Link>
//           </div>
//         </div>
//       </div>
//     );

//   return (
//     <div className="portal-body">
//       <div className="invite-wrapper">
//         <div className="invite-padding">
//           <div className="panel invite-panel column gap-5 shadow-sm">
//             <div className="invite-header-container invite-border-bottom invite-pb-10">
//               <div className="header uppercase text-info font-size-18 text-bold">
//                 <i className="fa-solid fa-user-plus mr-10"></i>
//                 {t("invite.header")}
//               </div>
//             </div>

//             <div className="invite-info-card">
//               <div className="invite-info-card-header invite-border-bottom uppercase font-size-16 mb-3">
//                 {t("invite.admin_params")}
//               </div>
//               <div className="invite-info-grid mt-3">
//                 <div className="invite-info-block">
//                   <label>{t("invite.label_login")}</label>
//                   <div className="invite-info-data text-bold">{info.username || "—"}</div>
//                 </div>
//                 <div className="invite-info-block">
//                   <label>{t("invite.label_role")}</label>
//                   <span className="invite-role-badge">{ROLE_LABELS[info.role] || info.role}</span>
//                 </div>
//                 <div className="invite-info-block">
//                   <label>{t("invite.label_expire")}</label>
//                   {info.expire_date ? (
//                     <span className="expire-date">{new Date(info.expire_date).toLocaleDateString()}</span>
//                   ) : (
//                     <span className="text-success text-bold">{t("invite.unlimited")}</span>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <form onSubmit={handleSubmit} className="column invite-gap-4">
//               <div className="invite-section-intro">
//                 <h2 className="font-size-24 text-dark m-0">{t("invite.personal_data")}</h2>
//                 <div className="font-size-16">
//                   <p className="m-0 text-muted">{t("invite.warning_edit")}</p>
//                   <p className="m-0 text-danger text-bold">{t("invite.warning_save")}</p>
//                 </div>
//               </div>

//               <div className="invite-form-grid">
//                 <div className="invite-input-group">
//                   <label className="invite-required">{t("invite.label_fullname")}</label>
//                   <input
//                     name="full_name"
//                     value={formData.full_name}
//                     onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
//                     required
//                   />
//                 </div>

//                 <div className="invite-input-group">
//                   <label className="invite-required">{t("invite.label_email")}</label>
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
//                     required
//                   />
//                 </div>

//                 <div className="invite-input-group">
//                   <label>{t("invite.label_phone")}</label>
//                   <input
//                     name="phone_number"
//                     placeholder="+380XXXXXXXXX"
//                     value={formData.phone_number}
//                     maxLength={13}
//                     onChange={(e) => {
//                       const val = e.target.value;
//                       if (e.nativeEvent.inputType === "deleteContentBackward") {
//                         setFormData((p) => ({ ...p, phone_number: val }));
//                       } else {
//                         setFormData((p) => ({ ...p, phone_number: formatPhoneInput(val) }));
//                       }
//                     }}
//                   />
//                 </div>

//                 <div className="invite-input-group">
//                   <label className="invite-required">{t("invite.label_password")}</label>
//                   <input
//                     type="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
//                     required
//                   />

//                   {formData.password && (
//                     <div className="password-strength-wrapper">
//                       <div className="password-strength-bar">
//                         <div
//                           className="password-strength-fill"
//                           style={{
//                             width: `${(passwordStrength.score / 5) * 100}%`,
//                             backgroundColor: passwordStrength.color,
//                           }}
//                         />
//                       </div>
//                       <div className="password-strength-label" style={{ color: passwordStrength.color }}>
//                         {passwordStrength.label}
//                       </div>
//                     </div>
//                   )}

//                   {passwordErrors.length > 0 && (
//                     <ul className="password-rules">
//                       {passwordErrors.map((e, i) => (
//                         <li key={i}>{e}</li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               </div>

//               <div className="invite-border-top pt-5">
//                 <button type="submit" className={`invite-btn-submit ${!isPasswordValid ? "not-ready" : ""}`}>
//                   <span>{t("invite.btn_submit")}</span>
//                   <i className="fa-solid fa-arrow-right ml-10"></i>
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../api/axios";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next";
import "./InviteRegisterForm.css";
import { QRCodeCanvas } from "qrcode.react";

export default function InviteRegisterForm() {
  const { code } = useParams();
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const ROLE_LABELS = {
    admin: t("roles.admin"),
    manager: t("roles.manager"),
    operator: t("roles.operator"),
    director: t("roles.director"),
    region_manager: t("roles.region_manager"),
    complaint_manager: t("roles.complaint_manager"),
    customer: t("roles.customer"),
  };

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
  });

  const [info, setInfo] = useState({
    username: "",
    role: "",
    expire_date: "",
  });

  const getErrorMessage = (errorText) => {
    if (errorText === "Це посилання вже використано") return t("invite.errors.invite_used");
    if (errorText === "Це посилання більше не активне") return t("invite.errors.invite_expired");
    if (errorText === "Invalid invite code") return t("invite.errors.invalid_code");
    

    return t("invite.errors.reg_fail");
  };

  const [tgLink, setTgLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  /* ================= HELPERS ================= */
  
  // Міжнародне форматування: дозволяємо лише цифри та "+" на початку
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    // Дозволяємо лише "+" (на початку) і цифри
    const cleaned = val.replace(/(?!^\+)[^\d]/g, "");
    setFormData((p) => ({ ...p, phone_number: cleaned }));
  };

  /* ================= PASSWORD VALIDATION ================= */
 /* ================= PASSWORD VALIDATION ================= */
const passwordErrors = useMemo(() => {
  const p = formData.password;
  const errors = [];
  if (!p) return errors;

  if (p.length < 6) {
    errors.push(t("invite.password_rules.min_length"));
  }

  return errors;
}, [formData.password, t]);

const isPasswordValid = passwordErrors.length === 0;

const passwordStrength = useMemo(() => {
  const p = formData.password;

  if (!p) {
    return { score: 0, label: "", color: "#ccc" };
  }

  if (p.length < 6) {
    return {
      score: 1,
      label: t("invite.strength.weak"),
      color: "#e74c3c",
    };
  }

  if (p.length < 10) {
    return {
      score: 3,
      label: t("invite.strength.medium"),
      color: "#f1c40f",
    };
  }

  return {
    score: 5,
    label: t("invite.strength.strong"),
    color: "#2ecc71",
  };
}, [formData.password, t]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    axiosInstance
      .get(`/register/${code}/`)
      .then((res) => {
        const d = res.data;
        setFormData((prev) => ({
          ...prev,
          full_name: d.full_name || "",
          phone_number: d.phone_number || "",
          email: d.email || "",
        }));
        setInfo({
          username: d.username || "",
          role: d.role || "",
          expire_date: d.expire_date || "",
        });
        setTgLink(d.tg_link || "");
        setLoading(false);
      })
      .catch((err) => {
          const serverError = err.response?.data?.error;
          setError(getErrorMessage(serverError));
          setLoading(false);
        });
  }, [code, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      addNotification(t("invite.errors.invalid_password"), "error");
      return;
    }

    try {
      setSuccess(true);      await axiosInstance.post(`/register/${code}/`, formData);

    } catch (err) {
      addNotification(err.response?.data?.error || t("invite.errors.reg_fail"), "error");
    }
  };

  if (loading) return <div className="portal-body align-center"><div className="loading-spinner"></div></div>;
  if (error) return <div className="portal-body align-center"><div className="panel invite-panel text-danger text-center invite-padding">{error}</div></div>;

  if (success)
    return (
      <div className="portal-body align-center">
        <div className="panel invite-panel invite-padding shadow-sm">
          <div className="text-success text-center" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
            <i className="fa-solid fa-circle-check font-size-32"></i>
            <span className="text-bold">{t("invite.success_message")}</span>
          </div>

          {tgLink && (
            <div className="qr-section column align-center gap-5 mt-5">
              <h3 className="font-size-18 uppercase text-info text-bold m-0">{t("invite.tg.title")}</h3>
              <div className="qr-image-wrapper" style={{ background: "white", padding: "15px", borderRadius: "3px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", marginTop: "10px" }}>
                <QRCodeCanvas value={tgLink} size={180} level="H" includeMargin={true} />
              </div>
              <a href={tgLink} target="_blank" rel="noreferrer" className="btn-link mt-15" style={{ textDecoration: "none", color: "#ffffff", backgroundColor: "#0088cc", padding: "10px 20px", borderRadius: "3px", fontWeight: "bold" }}>
                {t("invite.tg.button")}
              </a>
            </div>
          )}

          <div className="mt-5 text-center">
            <Link to="/login" className="text-info font-size-14" style={{ textDecoration: "none" }}>{t("invite.back_to_login")}</Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="portal-body">
      <div className="invite-wrapper">
        <div className="invite-padding">
          <div className="panel invite-panel column gap-5 shadow-sm">
            <div className="invite-header-container invite-border-bottom invite-pb-10">
              <div className="header uppercase text-info font-size-18 text-bold">
                <i className="fa-solid fa-user-plus mr-10"></i>
                {t("invite.header")}
              </div>
            </div>

            <div className="invite-info-card">
              <div className="invite-info-card-header invite-border-bottom uppercase font-size-16 mb-3">
                {t("invite.admin_params")}
              </div>
              <div className="invite-info-grid mt-3">
                <div className="invite-info-block">
                  <label>{t("invite.label_login")}</label>
                  <div className="invite-info-data text-bold">{info.username || "—"}</div>
                </div>
                <div className="invite-info-block">
                  <label>{t("invite.label_role")}</label>
                  <span className="invite-role-badge">{ROLE_LABELS[info.role] || info.role}</span>
                </div>
                <div className="invite-info-block">
                  <label>{t("invite.label_expire")}</label>
                  {info.expire_date ? (
                    <span className="expire-date">{new Date(info.expire_date).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-success text-bold">{t("invite.unlimited")}</span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="column invite-gap-4">
              <div className="invite-section-intro">
                <h2 className="font-size-24 text-dark m-0">{t("invite.personal_data")}</h2>
                <p className="m-0 text-muted">{t("invite.warning_edit")}</p>
                <p className="m-0 text-danger text-bold">{t("invite.warning_save")}</p>
              </div>

              <div className="invite-form-grid">
                <div className="invite-input-group">
                  <label className="invite-required">{t("invite.label_fullname")}</label>
                  <input
                    name="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="invite-input-group">
                  <label className="invite-required">{t("invite.label_email")}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="invite-input-group">
                  <label>{t("invite.label_phone")}</label>
                  <input
                    name="phone_number"
                    placeholder="+1234567890"
                    value={formData.phone_number}
                    onChange={handlePhoneChange}
                  />
                </div>

                <div className="invite-input-group">
                  <label className="invite-required">{t("invite.label_password")}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    required
                  />

                  {formData.password && (
                    <div className="password-strength-wrapper">
                      <div className="password-strength-bar">
                        <div className="password-strength-fill" style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color }} />
                      </div>
                      <div className="password-strength-label" style={{ color: passwordStrength.color }}>{passwordStrength.label}</div>
                    </div>
                  )}

                  {passwordErrors.length > 0 && (
                    <ul className="password-rules">
                      {passwordErrors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>
              </div>

              <div className="invite-border-top pt-5">
                <button type="submit" className={`invite-btn-submit ${!isPasswordValid ? "not-ready" : ""}`}>
                  <span>{t("invite.btn_submit")}</span>
                  <i className="fa-solid fa-arrow-right ml-10"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
