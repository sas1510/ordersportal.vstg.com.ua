// // // // import React, { useEffect, useState } from "react";
// // // // import axiosInstance from "../api/axios";
// // // // import "./CustomerBillsPage.css";
// // // // import { FaFilePdf, FaSearch, FaSpinner } from "react-icons/fa";
// // // // import DealerSelect from "./DealerSelect";
// // // // import { useDealerContext } from "../hooks/useDealerContext";
// // // // import CreateCustomerBillModal from "./CreateCustomerBillModal";
// // // // import { useNotification } from "../hooks/useNotification";
// // // // import { useTranslation } from "react-i18next";

// // // // /* =========================
// // // //    HELPERS
// // // //    ========================= */
// // // // const getCurrentMonthRange = () => {
// // // //   const now = new Date();
// // // //   const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
// // // //     .toISOString()
// // // //     .split("T")[0];
// // // //   const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
// // // //     .toISOString()
// // // //     .split("T")[0];
// // // //   return { dateFrom, dateTo };
// // // // };

// // // // // Updated locale to en-US for English formatting
// // // // const formatDate = (d, lang = "en-US") => (d ? new Date(d).toLocaleDateString(lang) : "—");
// // // // const formatMoney = (v, lang = "en-US") =>
// // // //   Number(v || 0).toLocaleString(lang, { minimumFractionDigits: 2 });

// // // // /* =========================
// // // //    COMPONENT
// // // //    ========================= */
// // // // const CustomerBillsPage = () => {
// // // //   const { t, i18n } = useTranslation();
// // // //   const currentLang = i18n.language || "en-US";

// // // //   const { dealerGuid, setDealerGuid, isAdmin, currentUser } = useDealerContext();
// // // //   const { addNotification } = useNotification();
// // // //   const USER_ROLE = currentUser?.role;

// // // //   const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();
// // // //   const [bills, setBills] = useState([]);
// // // //   const [dateFrom, setDateFrom] = useState(defaultFrom);
// // // //   const [dateTo, setDateTo] = useState(defaultTo);
// // // //   const [loading, setLoading] = useState(!isAdmin);
// // // //   const [_error, setError] = useState("");
// // // //   const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

// // // //   const [pdfDownloadingId, setPdfDownloadingId] = useState(null);

// // // //   const fetchBills = async () => {
// // // //     setLoading(true);
// // // //     setError("");
// // // //     try {
// // // //       const params = { date_from: dateFrom, date_to: dateTo };
// // // //       if (isAdmin && dealerGuid) params.contractor = dealerGuid;
// // // //       if (isAdmin && !dealerGuid) {
// // // //         setBills([]);
// // // //         setLoading(false);
// // // //         return;
// // // //       }

// // // //       const res = await axiosInstance.get("/payments/dealers/bills/", {
// // // //         params,
// // // //       });
// // // //       setBills(res.data?.items || []);
// // // //     } catch (err) {
// // // //       setError(t("bills.error_loading"));
// // // //       if (process.env.NODE_ENV === 'development') {
// // // //         console.error("Error fetching bills:", err);
// // // //       }
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   const handleDownloadPDF = async (billGuid, billNumber) => {
// // // //     if (!billGuid || billGuid === "undefined") {
// // // //       addNotification(t("bills.error_invalid_id"), "error");
// // // //       return;
// // // //     }

// // // //     setPdfDownloadingId(billGuid);

// // // //     try {
// // // //       const response = await axiosInstance.post(
// // // //         `/payments/get_bill_pdf/${billGuid}/`,
// // // //         {
// // // //           BillGuid: billGuid,
// // // //           contractor_guid: dealerGuid,
// // // //         },
// // // //         { responseType: "blob" },
// // // //       );

// // // //       const blob = new Blob([response.data], { type: "application/pdf" });
// // // //       const url = window.URL.createObjectURL(blob);
// // // //       const link = document.createElement("a");
// // // //       link.href = url;
// // // //       link.setAttribute(
// // // //         "download",
// // // //         `Bill_${billNumber || billGuid.slice(0, 8)}.pdf`,
// // // //       );
// // // //       document.body.appendChild(link);
// // // //       link.click();
// // // //       link.remove();
// // // //       window.URL.revokeObjectURL(url);

// // // //       addNotification(t("bills.file_downloaded"), "success");
// // // //     } catch (err) {
// // // //       if (process.env.NODE_ENV === 'development') {
// // // //         console.error("PDF Download Error:", err);
// // // //       }
// // // //       addNotification(t("bills.error_downloading"), "error");
// // // //     } finally {
// // // //       setPdfDownloadingId(null);
// // // //     }
// // // //   };

// // // //   useEffect(() => {
// // // //     if (!isAdmin || (isAdmin && dealerGuid)) fetchBills();
// // // //   }, [dealerGuid, isAdmin]);

// // // //   if (loading) {
// // // //     return (
// // // //       <div className="loading-spinner-wrapper">
// // // //         <div className="loading-spinner"></div>
// // // //         <div className="loading-text">
// // // //           {t("common.loading")}
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className="portal-body">
// // // //       <div className="max-w-[1334px] mx-auto ">
// // // //         <div className="customer-bills-header">
// // // //           <h1 className="page-title">{t("bills.title")}</h1>
// // // //           <div className="bills-filter">
// // // //             <input
// // // //               type="date"
// // // //               value={dateFrom}
// // // //               onChange={(e) => setDateFrom(e.target.value)}
// // // //             />
// // // //             <input
// // // //               type="date"
// // // //               value={dateTo}
// // // //               onChange={(e) => setDateTo(e.target.value)}
// // // //             />
// // // //             {isAdmin && (
// // // //               <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
// // // //             )}
// // // //             <button
// // // //               className="btn btn-filter-bill"
// // // //               onClick={fetchBills}
// // // //               disabled={isAdmin && !dealerGuid}
// // // //             >
// // // //               <FaSearch /> {t("common.search")}
// // // //             </button>
// // // //             {USER_ROLE === "customer" && (
// // // //               <button
// // // //                 className="btn btn-create-bill"
// // // //                 onClick={() => setIsCreateBillOpen(true)}
// // // //               >
// // // //                 + {t("bills.add_bill")}
// // // //               </button>
// // // //             )}
// // // //           </div>
// // // //         </div>

// // // //         <div className="customer-bills-panel">
// // // //           <table className="customer-bills-table">
// // // //             <thead>
// // // //               <tr>
// // // //                 <th>{t("bills.date")}</th>
// // // //                 <th>{t("bills.bill_number")}</th>
// // // //                 <th className="center">{t("bills.amount")}</th>
// // // //                 <th className="center">{t("bills.file")}</th>
// // // //               </tr>
// // // //             </thead>
// // // //             <tbody>
// // // //               {bills.map((b) => (
// // // //                 <tr key={b.BillGuid}>
// // // //                   <td>{formatDate(b.BillDate, currentLang)}</td>
// // // //                   <td className="text-bold">{b.BillNumber}</td>
// // // //                   <td className="center">{formatMoney(b.TotalAmount, currentLang)}</td>
// // // //                   <td className="center">
// // // //                     <button
// // // //                       className="btn-bill-download"
// // // //                       disabled={pdfDownloadingId !== null}
// // // //                       onClick={() => handleDownloadPDF(b.BillGuid, b.BillNumber)}
// // // //                     >
// // // //                       {pdfDownloadingId === b.BillGuid ? (
// // // //                         <FaSpinner className="pdf-icon spinning" />
// // // //                       ) : (
// // // //                         <FaFilePdf className="pdf-icon" />
// // // //                       )}
// // // //                       <span>{pdfDownloadingId === b.BillGuid ? "" : "PDF"}</span>
// // // //                     </button>
// // // //                   </td>
// // // //                 </tr>
// // // //               ))}
// // // //             </tbody>
// // // //           </table>
// // // //           {bills.length === 0 && (
// // // //             <div className="no-data-placeholder">
// // // //                {t("bills.no_bills_found")}
// // // //             </div>
// // // //           )}
// // // //         </div>

// // // //         <CreateCustomerBillModal
// // // //           isOpen={isCreateBillOpen}
// // // //           onClose={() => setIsCreateBillOpen(false)}
// // // //           onSuccess={fetchBills}
// // // //         />
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default CustomerBillsPage;

// // // import React, { useEffect, useState } from "react";
// // // import axiosInstance from "../api/axios";
// // // import "./CustomerBillsPage.css";
// // // import { FaFilePdf, FaSearch, FaSpinner } from "react-icons/fa";
// // // import DealerSelect from "./DealerSelect";
// // // import { useDealerContext } from "../hooks/useDealerContext";
// // // import CreateCustomerBillModal from "./CreateCustomerBillModal";
// // // import { useNotification } from "../hooks/useNotification";
// // // import { useTranslation } from "react-i18next";
// // // import { QRCodeSVG } from "qrcode.react"; // Імпортуємо бібліотеку для QR

// // // /* =========================
// // //    HELPERS
// // //    ========================= */
// // // const getCurrentMonthRange = () => {
// // //   const now = new Date();
// // //   const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
// // //     .toISOString()
// // //     .split("T")[0];
// // //   const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
// // //     .toISOString()
// // //     .split("T")[0];
// // //   return { dateFrom, dateTo };
// // // };

// // // const formatDate = (d, lang = "en-US") => (d ? new Date(d).toLocaleDateString(lang) : "—");
// // // const formatMoney = (v, lang = "en-US") =>
// // //   Number(v || 0).toLocaleString(lang, { minimumFractionDigits: 2 });

// // // /**
// // //  * Генерація рядка за стандартом НБУ (Версія 001)
// // //  */
// // // const generateNbuQrPayload = (bill, edrpouList = []) => {
// // //   const orgEdrpou = edrpouList[0]?.EDRPOU || "39093726"; 
// // //   const iban = bill.InvoiceNumber || "";
// // //   const receiver = bill.Receiver || "ТзОВ 'Євро Віндоус'";
// // //   const amount = Number(bill.TotalAmount || 0).toFixed(2);
// // //   const purpose = `Оплата за рахунком № ${bill.BillNumber} від ${formatDate(bill.BillDate, "uk-UA")}`;

// // //   const fields = [
// // //     " ".repeat(23),              // 1. Код старту застосунку
// // //     "BCD",                       // 2. Службова мітка
// // //     "001",                       // 3. Версія формату
// // //     "1",                         // 4. Кодування (1 = UTF-8)
// // //     "UCT",                       // 5. Функція (Ukrainian Credit Transfer)
// // //     "",                          // 6. BIC банку (пусте)
// // //     receiver,                    // 7. Отримувач
// // //     iban,                        // 8. Рахунок отримувача (IBAN)
// // //     `UAH${amount}`,              // 9. Сума/валюта
// // //     orgEdrpou,                   // 10. Код отримувача (ЄДРПОУ)
// // //     "",                          // 11. Ціль (пусте)
// // //     "",                          // 12. Reference (пусте)
// // //     purpose,                     // 13. Призначення платежу
// // //     ""                           // 14. Відображення (пусте)
// // //   ];

// // //   return fields.join("\n");
// // // };

// // // /* =========================
// // //    COMPONENT
// // //    ========================= */
// // // const CustomerBillsPage = () => {
// // //   const { t, i18n } = useTranslation();
// // //   const currentLang = i18n.language || "en-US";

// // //   const { dealerGuid, setDealerGuid, isAdmin, currentUser } = useDealerContext();
// // //   const { addNotification } = useNotification();
// // //   const USER_ROLE = currentUser?.role;

// // //   const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();
// // //   const [bills, setBills] = useState([]);
// // //   const [edrpouData, setEdrpouData] = useState([]); 
// // //   const [dateFrom, setDateFrom] = useState(defaultFrom);
// // //   const [dateTo, setDateTo] = useState(defaultTo);
// // //   const [loading, setLoading] = useState(!isAdmin);
// // //   const [_error, setError] = useState("");
// // //   const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

// // //   const [pdfDownloadingId, setPdfDownloadingId] = useState(null);
  
// // //   // Зберігає BillGuid рахунку, для якого зараз відкрито QR-код inline
// // //   const [expandedQrBillId, setExpandedQrBillId] = useState(null);

// // //   const fetchBills = async () => {
// // //     setLoading(true);
// // //     setError("");
// // //     try {
// // //       const params = { date_from: dateFrom, date_to: dateTo };
// // //       if (isAdmin && dealerGuid) params.contractor = dealerGuid;
// // //       if (isAdmin && !dealerGuid) {
// // //         setBills([]);
// // //         setLoading(false);
// // //         return;
// // //       }

// // //       const res = await axiosInstance.get("/payments/dealers/bills/", {
// // //         params,
// // //       });
// // //       setBills(res.data?.items || []);
// // //       setEdrpouData(res.data?.edrpou || []); 
// // //     } catch (err) {
// // //       setError(t("bills.error_loading"));
// // //       if (process.env.NODE_ENV === 'development') {
// // //         console.error("Error fetching bills:", err);
// // //       }
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const handleDownloadPDF = async (billGuid, billNumber) => {
// // //     if (!billGuid || billGuid === "undefined") {
// // //       addNotification(t("bills.error_invalid_id"), "error");
// // //       return;
// // //     }

// // //     setPdfDownloadingId(billGuid);

// // //     try {
// // //       const response = await axiosInstance.post(
// // //         `/payments/get_bill_pdf/${billGuid}/`,
// // //         {
// // //           BillGuid: billGuid,
// // //           contractor_guid: dealerGuid,
// // //         },
// // //         { responseType: "blob" },
// // //       );

// // //       const blob = new Blob([response.data], { type: "application/pdf" });
// // //       const url = window.URL.createObjectURL(blob);
// // //       const link = document.createElement("a");
// // //       link.href = url;
// // //       link.setAttribute(
// // //         "download",
// // //         `Bill_${billNumber || billGuid.slice(0, 8)}.pdf`,
// // //       );
// // //       document.body.appendChild(link);
// // //       link.click();
// // //       link.remove();
// // //       window.URL.revokeObjectURL(url);

// // //       addNotification(t("bills.file_downloaded"), "success");
// // //     } catch (err) {
// // //       if (process.env.NODE_ENV === 'development') {
// // //         console.error("PDF Download Error:", err);
// // //       }
// // //       addNotification(t("bills.error_downloading"), "error");
// // //     } finally {
// // //       setPdfDownloadingId(null);
// // //     }
// // //   };

// // //   const toggleQrCode = (billGuid) => {
// // //     if (expandedQrBillId === billGuid) {
// // //       setExpandedQrBillId(null); // закрити, якщо клікнули повторно
// // //     } else {
// // //       setExpandedQrBillId(billGuid); // відкрити для цього рахунку
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     if (!isAdmin || (isAdmin && dealerGuid)) fetchBills();
// // //   }, [dealerGuid, isAdmin]);

// // //   if (loading) {
// // //     return (
// // //       <div className="loading-spinner-wrapper">
// // //         <div className="loading-spinner"></div>
// // //         <div className="loading-text">
// // //           {t("common.loading")}
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="portal-body">
// // //       <div className="max-w-[1334px] mx-auto ">
// // //         <div className="customer-bills-header">
// // //           <h1 className="page-title">{t("bills.title")}</h1>
// // //           <div className="bills-filter">
// // //             <input
// // //               type="date"
// // //               value={dateFrom}
// // //               onChange={(e) => setDateFrom(e.target.value)}
// // //             />
// // //             <input
// // //               type="date"
// // //               value={dateTo}
// // //               onChange={(e) => setDateTo(e.target.value)}
// // //             />
// // //             {isAdmin && (
// // //               <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
// // //             )}
// // //             <button
// // //               className="btn btn-filter-bill"
// // //               onClick={fetchBills}
// // //               disabled={isAdmin && !dealerGuid}
// // //             >
// // //               <FaSearch /> {t("common.search")}
// // //             </button>
// // //             {USER_ROLE === "customer" && (
// // //               <button
// // //                 className="btn btn-create-bill"
// // //                 onClick={() => setIsCreateBillOpen(true)}
// // //               >
// // //                 + {t("bills.add_bill")}
// // //               </button>
// // //             )}
// // //           </div>
// // //         </div>

// // //         <div className="customer-bills-panel">
// // //           <table className="customer-bills-table">
// // //             <thead>
// // //               <tr>
// // //                 <th>{t("bills.date")}</th>
// // //                 <th>{t("bills.bill_number")}</th>
// // //                 <th className="center">{t("bills.amount")}</th>
// // //                 <th className="center">{t("bills.file")}</th>
// // //               </tr>
// // //             </thead>
// // //             <tbody>
// // //               {bills.map((b) => (
// // //                 <React.Fragment key={b.BillGuid}>
// // //                   {/* Основний рядок рахунку */}
// // //                   <tr>
// // //                     <td>{formatDate(b.BillDate, currentLang)}</td>
// // //                     <td className="text-bold">{b.BillNumber}</td>
// // //                     <td className="center">{formatMoney(b.TotalAmount, currentLang)}</td>
// // //                     <td className="center">
// // //                       <div className="bill-actions-cell">
// // //                         {/* Кнопка скачування PDF */}
// // //                         <button
// // //                           className="btn-bill-download"
// // //                           disabled={pdfDownloadingId !== null}
// // //                           onClick={() => handleDownloadPDF(b.BillGuid, b.BillNumber)}
// // //                         >
// // //                           {pdfDownloadingId === b.BillGuid ? (
// // //                             <FaSpinner className="pdf-icon spinning" />
// // //                           ) : (
// // //                             <FaFilePdf className="pdf-icon" />
// // //                           )}
// // //                           <span>{pdfDownloadingId === b.BillGuid ? "" : "PDF"}</span>
// // //                         </button>

// // //                         {/* Нова кнопка показу QR-коду поруч */}
// // //                         <button
// // //                           className={`btn-bill-qr ${expandedQrBillId === b.BillGuid ? "active" : ""}`}
// // //                           onClick={() => toggleQrCode(b.BillGuid)}
// // //                           title="Показати QR-код для оплати"
// // //                         >
// // //                           {/* <FaQrCode className="qr-icon" /> */}
// // //                           <span>QR</span>
// // //                         </button>
// // //                       </div>
// // //                     </td>
// // //                   </tr>

// // //                   {/* Додатковий під-рядок, що розгортається з QR кодом */}
// // //                   {expandedQrBillId === b.BillGuid && (
// // //                     <tr className="qr-delivery-row">
// // //                       <td colSpan="4">
// // //                         <div className="qr-inline-panel">
// // //                           <div className="qr-inline-code">
// // //                             <QRCodeSVG
// // //                               value={generateNbuQrPayload(b, edrpouData)}
// // //                               size={160}
// // //                               level="M"
// // //                               includeMargin={true}
// // //                             />
// // //                           </div>
// // //                           <div className="qr-inline-info">
// // //                             <h4>Швидка оплата через додаток банку (НБУ QR)</h4>
// // //                             <p className="qr-help-text">
// // //                               Зчитайте цей код камерою у додатку вашого банку (Приват24, Монобанк тощо) для автоматичного заповнення реквізитів.
// // //                             </p>
// // //                             <div className="qr-details-grid">
// // //                               <span><strong>Отримувач:</strong> {b.Receiver}</span>
// // //                               <span><strong>Рахунок (IBAN):</strong> <code className="qr-code-style">{b.InvoiceNumber}</code></span>
// // //                               <span><strong>Сума:</strong> {formatMoney(b.TotalAmount, "uk-UA")} {b.Currency || "грн"}</span>
// // //                               <span><strong>Призначення:</strong> Оплата за рахунком № {b.BillNumber}</span>
// // //                             </div>
// // //                           </div>
// // //                         </div>
// // //                       </td>
// // //                     </tr>
// // //                   )}
// // //                 </React.Fragment>
// // //               ))}
// // //             </tbody>
// // //           </table>
// // //           {bills.length === 0 && (
// // //             <div className="no-data-placeholder">
// // //                {t("bills.no_bills_found")}
// // //             </div>
// // //           )}
// // //         </div>

// // //         <CreateCustomerBillModal
// // //           isOpen={isCreateBillOpen}
// // //           onClose={() => setIsCreateBillOpen(false)}
// // //           onSuccess={fetchBills}
// // //         />
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default CustomerBillsPage;


// // import React, { useEffect, useState } from "react";
// // import axiosInstance from "../api/axios";
// // import "./CustomerBillsPage.css";
// // import { FaFilePdf, FaSearch, FaSpinner, FaTimes } from "react-icons/fa"; // Додав FaTimes для закриття
// // import DealerSelect from "./DealerSelect";
// // import { useDealerContext } from "../hooks/useDealerContext";
// // import CreateCustomerBillModal from "./CreateCustomerBillModal";
// // import { useNotification } from "../hooks/useNotification";
// // import { useTranslation } from "react-i18next";
// // import { QRCodeSVG } from "qrcode.react"; 

// // /* =========================
// //    HELPERS
// //    ========================= */
// // const getCurrentMonthRange = () => {
// //   const now = new Date();
// //   const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
// //     .toISOString()
// //     .split("T")[0];
// //   const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
// //     .toISOString()
// //     .split("T")[0];
// //   return { dateFrom, dateTo };
// // };

// // const formatDate = (d, lang = "en-US") => (d ? new Date(d).toLocaleDateString(lang) : "—");
// // const formatMoney = (v, lang = "en-US") =>
// //   Number(v || 0).toLocaleString(lang, { minimumFractionDigits: 2 });

// // /**
// //  * Генерація рядка за стандартом НБУ (Версія 001)
// //  */
// // const generateNbuQrPayload = (bill, edrpouList = []) => {
// //   const orgEdrpou = edrpouList[0]?.EDRPOU || "39093726"; 
// //   const iban = bill.InvoiceNumber || "";
// //   const receiver = bill.Receiver || "ТзОВ 'Євро Віндоус'";
// //   const amount = Number(bill.TotalWithVAT || 0).toFixed(2);
// //   const purpose = `Оплата згідно рахунку №${bill.BillNumber_2} від ${formatDate(bill.BillDate, "uk-UA")}. У сумі ${amount} грн, в т.ч. ПДВ ${formatMoney(bill.VAT_Amount, "uk-UA")} грн.`;

// //   const fields = [
// //     " ".repeat(23),              // 1. Код старту застосунку
// //     "BCD",                       // 2. Службова мітка
// //     "001",                       // 3. Версія формату
// //     "1",                         // 4. Кодування (1 = UTF-8)
// //     "UCT",                       // 5. Функція (Ukrainian Credit Transfer)
// //     "",                          // 6. BIC банку (пусте)
// //     receiver,                    // 7. Отримувач
// //     iban,                        // 8. Рахунок отримувача (IBAN)
// //     `UAH${amount}`,              // 9. Сума/валюта
// //     orgEdrpou,                   // 10. Код отримувача (ЄДРПОУ)
// //     "",                          // 11. Ціль (пусте)
// //     "",                          // 12. Reference (пусте)
// //     purpose,                     // 13. Призначення платежу
// //     ""                           // 14. Відображення (пусте)
// //   ];

// //   return fields.join("\n");
// // };

// // /* =========================
// //    COMPONENT
// //    ========================= */
// // const CustomerBillsPage = () => {
// //   const { t, i18n } = useTranslation();
// //   const currentLang = i18n.language || "en-US";

// //   const { dealerGuid, setDealerGuid, isAdmin, currentUser } = useDealerContext();
// //   const { addNotification } = useNotification();
// //   const USER_ROLE = currentUser?.role;

// //   const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();
// //   const [bills, setBills] = useState([]);
// //   const [edrpouData, setEdrpouData] = useState([]); 
// //   const [dateFrom, setDateFrom] = useState(defaultFrom);
// //   const [dateTo, setDateTo] = useState(defaultTo);
// //   const [loading, setLoading] = useState(!isAdmin);
// //   const [_error, setError] = useState("");
// //   const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

// //   const [pdfDownloadingId, setPdfDownloadingId] = useState(null);
  
// //   // Тепер зберігаємо весь об'єкт рахунку, який вибрали для оплати через QR
// //   const [activeQrBill, setActiveQrBill] = useState(null);

// //   const fetchBills = async () => {
// //     setLoading(true);
// //     setError("");
// //     try {
// //       const params = { date_from: dateFrom, date_to: dateTo };
// //       if (isAdmin && dealerGuid) params.contractor = dealerGuid;
// //       if (isAdmin && !dealerGuid) {
// //         setBills([]);
// //         setLoading(false);
// //         return;
// //       }

// //       const res = await axiosInstance.get("/payments/dealers/bills/", {
// //         params,
// //       });
// //       setBills(res.data?.items || []);
// //       setEdrpouData(res.data?.edrpou || []); 
// //     } catch (err) {
// //       setError(t("bills.error_loading"));
// //       if (process.env.NODE_ENV === 'development') {
// //         console.error("Error fetching bills:", err);
// //       }
// //     } finally {
// //       loading && setLoading(false);
// //     }
// //   };

// //   const handleDownloadPDF = async (billGuid, billNumber) => {
// //     if (!billGuid || billGuid === "undefined") {
// //       addNotification(t("bills.error_invalid_id"), "error");
// //       return;
// //     }

// //     setPdfDownloadingId(billGuid);

// //     try {
// //       const response = await axiosInstance.post(
// //         `/payments/get_bill_pdf/${billGuid}/`,
// //         {
// //           BillGuid: billGuid,
// //           contractor_guid: dealerGuid,
// //         },
// //         { responseType: "blob" },
// //       );

// //       const blob = new Blob([response.data], { type: "application/pdf" });
// //       const url = window.URL.createObjectURL(blob);
// //       const link = document.createElement("a");
// //       link.href = url;
// //       link.setAttribute(
// //         "download",
// //         `Bill_${billNumber || billGuid.slice(0, 8)}.pdf`,
// //       );
// //       document.body.appendChild(link);
// //       link.click();
// //       link.remove();
// //       window.URL.revokeObjectURL(url);

// //       addNotification(t("bills.file_downloaded"), "success");
// //     } catch (err) {
// //       if (process.env.NODE_ENV === 'development') {
// //         console.error("PDF Download Error:", err);
// //       }
// //       addNotification(t("bills.error_downloading"), "error");
// //     } finally {
// //       setPdfDownloadingId(null);
// //     }
// //   };

// //   useEffect(() => {
// //     if (!isAdmin || (isAdmin && dealerGuid)) fetchBills();
// //   }, [dealerGuid, isAdmin]);

// //   if (loading) {
// //     return (
// //       <div className="loading-spinner-wrapper">
// //         <div className="loading-spinner"></div>
// //         <div className="loading-text">
// //           {t("common.loading")}
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="portal-body">
// //       <div className="max-w-[1334px] mx-auto ">
// //         <div className="customer-bills-header">
// //           <h1 className="page-title">{t("bills.title")}</h1>
// //           <div className="bills-filter">
// //             <input
// //               type="date"
// //               value={dateFrom}
// //               onChange={(e) => setDateFrom(e.target.value)}
// //             />
// //             <input
// //               type="date"
// //               value={dateTo}
// //               onChange={(e) => setDateTo(e.target.value)}
// //             />
// //             {isAdmin && (
// //               <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
// //             )}
// //             <button
// //               className="btn btn-filter-bill"
// //               onClick={fetchBills}
// //               disabled={isAdmin && !dealerGuid}
// //             >
// //               <FaSearch /> {t("common.search")}
// //             </button>
// //             {USER_ROLE === "customer" && (
// //               <button
// //                 className="btn btn-create-bill"
// //                 onClick={() => setIsCreateBillOpen(true)}
// //               >
// //                 + {t("bills.add_bill")}
// //               </button>
// //             )}
// //           </div>
// //         </div>

// //         <div className="customer-bills-panel">
// //           <table className="customer-bills-table">
// //             <thead>
// //               <tr>
// //                 <th>{t("bills.date")}</th>
// //                 <th>{t("bills.bill_number")}</th>
// //                 <th className="center">{t("bills.amount")}</th>
// //                 <th className="center">{t("bills.file")}</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {bills.map((b) => (
// //                 <tr key={b.BillGuid}>
// //                   <td>{formatDate(b.BillDate, currentLang)}</td>
// //                   <td className="text-bold">{b.BillNumber}</td>
// //                   <td className="center">{formatMoney(b.TotalAmount, currentLang)}</td>
// //                   <td className="center">
// //                     <div className="bill-actions-cell">
// //                       {/* Кнопка скачування PDF */}
// //                       <button
// //                         className="btn-bill-download"
// //                         disabled={pdfDownloadingId !== null}
// //                         onClick={() => handleDownloadPDF(b.BillGuid, b.BillNumber)}
// //                       >
// //                         {pdfDownloadingId === b.BillGuid ? (
// //                           <FaSpinner className="pdf-icon spinning" />
// //                         ) : (
// //                           <FaFilePdf className="pdf-icon" />
// //                         )}
// //                         <span>{pdfDownloadingId === b.BillGuid ? "" : "PDF"}</span>
// //                       </button>

// //                       {/* Кнопка, яка тепер відкриває модалку */}
// //                       <button
// //                         className="btn-bill-qr"
// //                         onClick={() => setActiveQrBill(b)}
// //                         title="Показати QR-код для оплати"
// //                       >
// //                         <span>QR</span>
// //                       </button>
// //                     </div>
// //                   </td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //           {bills.length === 0 && (
// //             <div className="no-data-placeholder">
// //                {t("bills.no_bills_found")}
// //             </div>
// //           )}
// //         </div>

// //         <CreateCustomerBillModal
// //           isOpen={isCreateBillOpen}
// //           onClose={() => setIsCreateBillOpen(false)}
// //           onSuccess={fetchBills}
// //         />

// //         {/* =========================
// //             МОДАЛЬНЕ ВІКНО QR-КОДУ
// //            ========================= */}
// //         {activeQrBill && (
// //           <div className="qr-modal-overlay" onClick={() => setActiveQrBill(null)}>
// //             <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
// //               <button className="qr-modal-close" onClick={() => setActiveQrBill(null)}>
// //                 <FaTimes />
// //               </button>
              
// //               <div className="qr-modal-body">
// //                 <div className="qr-modal-code-wrapper">
// //                   <QRCodeSVG
// //                     value={generateNbuQrPayload(activeQrBill, edrpouData)}
// //                     size={220} // Збільшено розмір для зручнішого сканування у модалці
// //                     level="M"
// //                     includeMargin={true}
// //                   />
// //                 </div>
                
// //                 <div className="qr-modal-info">
// //                   <h3>Швидка оплата (НБУ QR)</h3>
// //                   <p className="qr-modal-help-text">
// //                     Відкрийте додаток вашого банку (Приват24, Монобанк тощо), оберіть «Сканувати QR-код» та наведіть камеру.
// //                   </p>
                  
// //                   <div className="qr-modal-details">
// //                     <div><strong>Отримувач:</strong> <span>{activeQrBill.Receiver}</span></div>
// //                     <div><strong>Рахунок (IBAN):</strong> <code className="qr-code-style">{activeQrBill.InvoiceNumber}</code></div>
// //                     <div><strong>Сума:</strong> <span className="qr-modal-amount">{formatMoney(activeQrBill.TotalAmount, "uk-UA")} {activeQrBill.Currency || "грн"}</span></div>
// //                     <div><strong>Призначення:</strong> <span>Оплата згідно рахунку №{activeQrBill.BillNumber_2} від {formatDate(activeQrBill.BillDate, "uk-UA")}. У сумі {formatMoney(activeQrBill.TotalWithVAT, "uk-UA")} грн, в т.ч. ПДВ {formatMoney(activeQrBill.VAT_Amount, "uk-UA")} грн.</span></div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         )}

// //       </div>
// //     </div>
// //   );
// // };

// // export default CustomerBillsPage;
// import React, { useEffect, useState } from "react";
// import axiosInstance from "../api/axios";
// import "./CustomerBillsPage.css";
// import { FaFilePdf, FaSearch, FaSpinner, FaTimes, FaCopy } from "react-icons/fa"; 
// import DealerSelect from "./DealerSelect";
// import { useDealerContext } from "../hooks/useDealerContext";
// import CreateCustomerBillModal from "./CreateCustomerBillModal";
// import { useNotification } from "../hooks/useNotification";
// import { useTranslation } from "react-i18next";
// import { QRCodeSVG } from "qrcode.react"; 

// /* =========================
//    HELPERS
//    ========================= */
// const getCurrentMonthRange = () => {
//   const now = new Date();
//   const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
//     .toISOString()
//     .split("T")[0];
//   const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
//     .toISOString()
//     .split("T")[0];
//   return { dateFrom, dateTo };
// };

// const formatDate = (d, lang = "en-US") => (d ? new Date(d).toLocaleDateString(lang) : "—");
// const formatMoney = (v, lang = "en-US") =>
//   Number(v || 0).toLocaleString(lang, { minimumFractionDigits: 2 });

// /**
//  * Генерація рядка за стандартом НБУ (Версія 001)
//  */
// const generateNbuQrPayload = (bill, edrpouList = []) => {
//   const orgEdrpou = edrpouList[0]?.EDRPOU || "39093726"; 
//   const iban = bill.InvoiceNumber || "";
//   const receiver = bill.Receiver || "ТзОВ 'Євро Віндоус'";
//   const amount = Number(bill.TotalWithVAT || 0).toFixed(2);
//   const purpose = `Оплата згідно рахунку №${bill.BillNumber_2} від ${formatDate(bill.BillDate, "uk-UA")}. У сумі ${amount} грн, в т.ч. ПДВ ${formatMoney(bill.VAT_Amount, "uk-UA")} грн.`;

//   const fields = [
//     " ".repeat(23),              // 1. Код старту застосунку
//     "BCD",                       // 2. Службова мітка
//     "001",                       // 3. Версія формату
//     "1",                         // 4. Кодування (1 = UTF-8)
//     "UCT",                       // 5. Функція (Ukrainian Credit Transfer)
//     "",                          // 6. BIC банку (пусте)
//     receiver,                    // 7. Отримувач
//     iban,                        // 8. Рахунок отримувача (IBAN)
//     `UAH${amount}`,              // 9. Сума/валюта
//     orgEdrpou,                   // 10. Код отримувача (ЄДРПОУ)
//     "",                          // 11. Ціль (пусте)
//     "",                          // 12. Reference (пусте)
//     purpose,                     // 13. Призначення платежу
//     ""                           // 14. Відображення (пусте)
//   ];

//   return fields.join("\n");
// };

// /* =========================
//    COMPONENT
//    ========================= */
// const CustomerBillsPage = () => {
//   const { t, i18n } = useTranslation();
//   const currentLang = i18n.language || "en-US";

//   const { dealerGuid, setDealerGuid, isAdmin, currentUser } = useDealerContext();
//   const { addNotification } = useNotification();
//   const USER_ROLE = currentUser?.role;

//   const { dateFrom: defaultFrom, dateTo: defaultTo } = getCurrentMonthRange();
//   const [bills, setBills] = useState([]);
//   const [edrpouData, setEdrpouData] = useState([]); 
//   const [dateFrom, setDateFrom] = useState(defaultFrom);
//   const [dateTo, setDateTo] = useState(defaultTo);
//   const [loading, setLoading] = useState(!isAdmin);
//   const [_error, setError] = useState("");
//   const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

//   const [pdfDownloadingId, setPdfDownloadingId] = useState(null);
//   const [activeQrBill, setActiveQrBill] = useState(null);

//   const fetchBills = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const params = { date_from: dateFrom, date_to: dateTo };
//       if (isAdmin && dealerGuid) params.contractor = dealerGuid;
//       if (isAdmin && !dealerGuid) {
//         setBills([]);
//         setLoading(false);
//         return;
//       }

//       const res = await axiosInstance.get("/payments/dealers/bills/", {
//         params,
//       });
//       setBills(res.data?.items || []);
//       setEdrpouData(res.data?.edrpou || []); 
//     } catch (err) {
//       setError(t("bills.error_loading"));
//       if (process.env.NODE_ENV === 'development') {
//         console.error("Error fetching bills:", err);
//       }
//     } finally {
//       loading && setLoading(false);
//     }
//   };

//   const handleDownloadPDF = async (billGuid, billNumber) => {
//     if (!billGuid || billGuid === "undefined") {
//       addNotification(t("bills.error_invalid_id"), "error");
//       return;
//     }

//     setPdfDownloadingId(billGuid);

//     try {
//       const response = await axiosInstance.post(
//         `/payments/get_bill_pdf/${billGuid}/`,
//         {
//           BillGuid: billGuid,
//           contractor_guid: dealerGuid,
//         },
//         { responseType: "blob" },
//       );

//       const blob = new Blob([response.data], { type: "application/pdf" });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute(
//         "download",
//         `Bill_${billNumber || billGuid.slice(0, 8)}.pdf`,
//       );
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);

//       addNotification(t("bills.file_downloaded"), "success");
//     } catch (err) {
//       if (process.env.NODE_ENV === 'development') {
//         console.error("PDF Download Error:", err);
//       }
//       addNotification(t("bills.error_downloading"), "error");
//     } finally {
//       setPdfDownloadingId(null);
//     }
//   };

//   // Функція для копіювання тексту в буфер
//   const handleCopyText = (text, message = "Скопійовано!") => {
//     if (!text) return;
//     navigator.clipboard.writeText(text)
//       .then(() => {
//         addNotification(message, "success");
//       })
//       .catch((err) => {
//         console.error("Помилка копіювання:", err);
//         addNotification("Не вдалося скопіювати", "error");
//       });
//   };

//   useEffect(() => {
//     if (!isAdmin || (isAdmin && dealerGuid)) fetchBills();
//   }, [dealerGuid, isAdmin]);

//   if (loading) {
//     return (
//       <div className="loading-spinner-wrapper">
//         <div className="loading-spinner"></div>
//         <div className="loading-text">
//           {t("common.loading")}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="portal-body">
//       <div className="max-w-[1334px] mx-auto ">
//         <div className="customer-bills-header">
//           <h1 className="page-title">{t("bills.title")}</h1>
//           <div className="bills-filter">
//             <input
//               type="date"
//               value={dateFrom}
//               onChange={(e) => setDateFrom(e.target.value)}
//             />
//             <input
//               type="date"
//               value={dateTo}
//               onChange={(e) => setDateTo(e.target.value)}
//             />
//             {isAdmin && (
//               <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
//             )}
//             <button
//               className="btn btn-filter-bill"
//               onClick={fetchBills}
//               disabled={isAdmin && !dealerGuid}
//             >
//               <FaSearch /> {t("common.search")}
//             </button>
//             {USER_ROLE === "customer" && (
//               <button
//                 className="btn btn-create-bill"
//                 onClick={() => setIsCreateBillOpen(true)}
//               >
//                 + {t("bills.add_bill")}
//               </button>
//             )}
//           </div>
//         </div>

//         <div className="customer-bills-panel">
//           <table className="customer-bills-table">
//             <thead>
//               <tr>
//                 <th>{t("bills.date")}</th>
//                 <th>{t("bills.bill_number")}</th>
//                 <th className="center">{t("bills.amount")}</th>
//                 <th className="center">{t("bills.file")}</th>
//               </tr>
//             </thead>
//             <tbody>
//               {bills.map((b) => (
//                 <tr key={b.BillGuid}>
//                   <td>{formatDate(b.BillDate, currentLang)}</td>
//                   <td className="text-bold">{b.BillNumber}</td>
//                   <td className="center">{formatMoney(b.TotalAmount, currentLang)}</td>
//                   <td className="center">
//                     <div className="bill-actions-cell">
//                       <button
//                         className="btn-bill-download"
//                         disabled={pdfDownloadingId !== null}
//                         onClick={() => handleDownloadPDF(b.BillGuid, b.BillNumber)}
//                       >
//                         {pdfDownloadingId === b.BillGuid ? (
//                           <FaSpinner className="pdf-icon spinning" />
//                         ) : (
//                           <FaFilePdf className="pdf-icon" />
//                         )}
//                         <span>{pdfDownloadingId === b.BillGuid ? "" : "PDF"}</span>
//                       </button>

//                       <button
//                         className="btn-bill-qr"
//                         onClick={() => setActiveQrBill(b)}
//                         title="Показати QR-код для оплати"
//                       >
//                         <span>QR</span>
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {bills.length === 0 && (
//             <div className="no-data-placeholder">
//                {t("bills.no_bills_found")}
//             </div>
//           )}
//         </div>

//         <CreateCustomerBillModal
//           isOpen={isCreateBillOpen}
//           onClose={() => setIsCreateBillOpen(false)}
//           onSuccess={fetchBills}
//         />

//         {/* =========================
//             МОДАЛЬНЕ ВІКНО QR-КОДУ ТА ОПЛАТИ
//            ========================= */}
//         {activeQrBill && (
//           <div className="qr-modal-overlay" onClick={() => setActiveQrBill(null)}>
//             <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
//               <button className="qr-modal-close" onClick={() => setActiveQrBill(null)}>
//                 <FaTimes />
//               </button>
              
//               <div className="qr-modal-body">
//                 <div className="qr-modal-code-wrapper">
//                   <QRCodeSVG
//                     value={generateNbuQrPayload(activeQrBill, edrpouData)}
//                     size={220}
//                     level="M"
//                     includeMargin={true}
//                   />
                  
//                   {/* КНОПКИ ШВИДКОГО ПЕРЕХОДУ ДО БАНКІВ */}
//                   <div className="bank-pay-buttons">
//                     <a 
//                       href="https://www.privat24.ua/" 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       className="btn-bank btn-privat"
//                       title="Відкрити Приват24"
//                     >
//                       Оплатити через <span className="font-bold">Приват24</span>
//                     </a>
//                     <a 
//                       href="https://send.monobank.ua/" 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       className="btn-bank btn-mono"
//                       title="Відкрити Monobank"
//                     >
//                       Оплатити через <span className="font-bold">Monobank</span>
//                     </a>
//                   </div>

//                   {/* КНОПКИ ДЛЯ ОПЛАТИ НА ПК ТА СМАРТФОНАХ */}
// {/* КНОПКИ ДЛЯ ОПЛАТИ НА ПК ТА СМАРТФОНАХ */}
// <div className="bank-pay-buttons">
//   {/* Автозаповнення реквізитів у веб-Приват24 для ПК */}
//   <a 
//     href={`https://next.privat24.ua/payments/form/${encodeURIComponent(
//       JSON.stringify({
//         companyIban: activeQrBill.InvoiceNumber || "",
//         companyEdrpou: edrpouData[0]?.EDRPOU || "39093726",
//         amount: Number(activeQrBill.TotalWithVAT || 0).toFixed(2),
//         description: `Оплата згідно рахунку №${activeQrBill.BillNumber_2} від ${formatDate(activeQrBill.BillDate, "uk-UA")}. У сумі ${Number(activeQrBill.TotalWithVAT || 0).toFixed(2)} грн, в т.ч. ПДВ ${formatMoney(activeQrBill.VAT_Amount, "uk-UA")} грн.`
//       })
//     )}`}
//     target="_blank" 
//     rel="noopener noreferrer" 
//     className="btn-bank btn-privat-web"
//     title="Перейти в Приват24 з готовими реквізитами"
//   >
//     Онлайн-оплата в <span className="font-bold">Приват24 (ПК)</span>
//   </a>

//   {/* Якщо у вас з'явиться LiqPay/Mono еквайринг */}
//   {/* <button 
//     onClick={handleOnlineCheckout} 
//     className="btn-bank btn-card-online"
//   >
//     Оплатити карткою <span className="font-bold">Visa / Mastercard</span>
//   </button> 
//   */}
// </div>
//                 </div>
                
//                 <div className="qr-modal-info">
//                   <h3>Швидка оплата (НБУ QR)</h3>
//                   <p className="qr-modal-help-text">
//                     Відкрийте додаток вашого банку (Приват24, Монобанк тощо), оберіть «Сканувати QR-код» або клікніть на реквізит нижче, щоб скопіювати його.
//                   </p>
                  
//                   <div className="qr-modal-details">
//                     <div className="copy-row">
//                       <strong>Отримувач:</strong> 
//                       <span className="copyable-text" onClick={() => handleCopyText(activeQrBill.Receiver, "Назву отримувача скопійовано!")}>
//                         {activeQrBill.Receiver} <FaCopy className="copy-icon" />
//                       </span>
//                     </div>

//                     <div className="copy-row">
//                       <strong>ЄДРПОУ:</strong> 
//                       <span className="copyable-text" onClick={() => handleCopyText(edrpouData[0]?.EDRPOU || "39093726", "ЄДРПОУ скопійовано!")}>
//                         {edrpouData[0]?.EDRPOU || "39093726"} <FaCopy className="copy-icon" />
//                       </span>
//                     </div>

//                     <div className="copy-row">
//                       <strong>Рахунок (IBAN):</strong> 
//                       <span className="copyable-text iban-code" onClick={() => handleCopyText(activeQrBill.InvoiceNumber, "IBAN скопійовано!")}>
//                         <code>{activeQrBill.InvoiceNumber}</code> <FaCopy className="copy-icon" />
//                       </span>
//                     </div>

//                     <div className="copy-row">
//                       <strong>Сума:</strong> 
//                       <span className="copyable-text qr-modal-amount" onClick={() => handleCopyText(Number(activeQrBill.TotalAmount || 0).toFixed(2), "Суму скопійовано!")}>
//                         {formatMoney(activeQrBill.TotalAmount, "uk-UA")} {activeQrBill.Currency || "грн"} <FaCopy className="copy-icon" />
//                       </span>
//                     </div>

//                     <div className="copy-row legacy-row">
//                       <strong>Призначення:</strong> 
//                       <span 
//                         className="copyable-text text-sm" 
//                         onClick={() => handleCopyText(
//                           `Оплата згідно рахунку №${activeQrBill.BillNumber_2} від ${formatDate(activeQrBill.BillDate, "uk-UA")}. У сумі ${Number(activeQrBill.TotalWithVAT || 0).toFixed(2)} грн, в т.ч. ПДВ ${formatMoney(activeQrBill.VAT_Amount, "uk-UA")} грн.`, 
//                           "Призначення платежу скопійовано!"
//                         )}
//                       >
//                         Оплата згідно рахунку №{activeQrBill.BillNumber_2} від {formatDate(activeQrBill.BillDate, "uk-UA")}. У сумі {Number(activeQrBill.TotalWithVAT || 0).toFixed(2)} грн, в т.ч. ПДВ {formatMoney(activeQrBill.VAT_Amount, "uk-UA")} грн.
//                         <FaCopy className="copy-icon" />
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default CustomerBillsPage;


import React, { useEffect, useState, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import "./CustomerBillsPage.css";
import { FaFilePdf, FaSearch, FaSpinner, FaTimes, FaCopy } from "react-icons/fa"; 
import DealerSelect from "./DealerSelect";
import { useDealerContext } from "../hooks/useDealerContext";
import CreateCustomerBillModal from "./CreateCustomerBillModal";
import { useNotification } from "../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react"; 

/* =========================
   HELPERS
   ========================= */
const getCurrentMonthRange = () => {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { dateFrom, dateTo };
};

const formatDate = (d, lang = "en-US") => (d ? new Date(d).toLocaleDateString(lang) : "—");
const formatMoney = (v, lang = "en-US") =>
  Number(v || 0).toLocaleString(lang, { minimumFractionDigits: 2 });

/**
 * Генерація рядка за стандартом НБУ (Версія 001)
 */
const generateNbuQrPayload = (bill, edrpouList = []) => {
  const orgEdrpou = edrpouList[0]?.EDRPOU || "39093726"; 
  const iban = bill.InvoiceNumber || "";
  const receiver = bill.Receiver || "ТзОВ 'Євро Віндоус'";
  const amount = Number(bill.TotalWithVAT || 0).toFixed(2);
  const purpose = `Оплата згідно рахунку №${bill.BillNumber_2} від ${formatDate(bill.BillDate, "uk-UA")}. У сумі ${amount} грн, в т.ч. ПДВ ${formatMoney(bill.VAT_Amount, "uk-UA")} грн.`;

  const fields = [
    " ".repeat(23),              // 1. Код старту застосунку
    "BCD",                       // 2. Службова мітка
    "001",                       // 3. Версія формату
    "1",                         // 4. Кодування (1 = UTF-8)
    "UCT",                       // 5. Функція (Ukrainian Credit Transfer)
    "",                          // 6. BIC банку (пусте)
    receiver,                    // 7. Отримувач
    iban,                        // 8. Рахунок отримувача (IBAN)
    `UAH${amount}`,              // 9. Сума/валюта
    orgEdrpou,                   // 10. Код отримувача (ЄДРПОУ)
    "",                          // 11. Ціль (пусте)
    "",                          // 12. Reference (пусте)
    purpose,                     // 13. Призначення платежу
    ""                           // 14. Відображення (пусте)
  ];

  return fields.join("\n");
};

/* =========================
   COMPONENT
   ========================= */
const CustomerBillsPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en-US";

  const { dealerGuid, setDealerGuid, isAdmin, currentUser } = useDealerContext();
  const { addNotification } = useNotification();
  const USER_ROLE = currentUser?.role;

  const defaultDates = useMemo(() => getCurrentMonthRange(), []);
  const [bills, setBills] = useState([]);
  const [edrpouData, setEdrpouData] = useState([]); 
  const [dateFrom, setDateFrom] = useState(defaultDates.dateFrom);
  const [dateTo, setDateTo] = useState(defaultDates.dateTo);
  const [loading, setLoading] = useState(!isAdmin);
  const [_error, setError] = useState("");
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

  const [pdfDownloadingId, setPdfDownloadingId] = useState(null);
  const [activeQrBill, setActiveQrBill] = useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { date_from: dateFrom, date_to: dateTo };
      if (isAdmin && dealerGuid) params.contractor = dealerGuid;
      if (isAdmin && !dealerGuid) {
        setBills([]);
        setLoading(false);
        return;
      }

      const res = await axiosInstance.get("/payments/dealers/bills/", { params });
      setBills(res.data?.items || []);
      setEdrpouData(res.data?.edrpou || []); 
    } catch (err) {
      setError(t("bills.error_loading"));
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching bills:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, isAdmin, dealerGuid, t]);

  const handleDownloadPDF = useCallback(async (billGuid, billNumber) => {
    if (!billGuid || billGuid === "undefined") {
      addNotification(t("bills.error_invalid_id"), "error");
      return;
    }

    setPdfDownloadingId(billGuid);

    try {
      const response = await axiosInstance.post(
        `/payments/get_bill_pdf/${billGuid}/`,
        {
          BillGuid: billGuid,
          contractor_guid: dealerGuid,
        },
        { responseType: "blob" },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Bill_${billNumber || billGuid.slice(0, 8)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addNotification(t("bills.file_downloaded"), "success");
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("PDF Download Error:", err);
      }
      addNotification(t("bills.error_downloading"), "error");
    } finally {
      setPdfDownloadingId(null);
    }
  }, [dealerGuid, addNotification, t]);

  const handleCopyText = useCallback((text, message = "Скопійовано!") => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => {
        addNotification(message, "success");
      })
      .catch((err) => {
        console.error("Помилка копіювання:", err);
        addNotification("Не вдалося скопіювати", "error");
      });
  }, [addNotification]);

  useEffect(() => {
    if (!isAdmin || (isAdmin && dealerGuid)) {
      fetchBills();
    }
  }, [dealerGuid, isAdmin, fetchBills]);

  // Винесено обчислення призначення платежу для активного модального вікна
  const currentPurpose = useMemo(() => {
    if (!activeQrBill) return "";
    const formattedDate = formatDate(activeQrBill.BillDate, "uk-UA");
    const formattedTotal = Number(activeQrBill.TotalWithVAT || 0).toFixed(2);
    const formattedVat = formatMoney(activeQrBill.VAT_Amount, "uk-UA");
    return `Оплата згідно рахунку №${activeQrBill.BillNumber_2} від ${formattedDate}. У сумі ${formattedTotal} грн, в т.ч. ПДВ ${formattedVat} грн.`;
  }, [activeQrBill]);

  const currentEdrpou = edrpouData[0]?.EDRPOU || "39093726";

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="portal-body">
      <div className="max-w-[1334px] mx-auto ">
        <div className="customer-bills-header">
          <h1 className="page-title">{t("bills.title")}</h1>
          <div className="bills-filter">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            {isAdmin && (
              <DealerSelect value={dealerGuid} onChange={setDealerGuid} />
            )}
            <button
              className="btn btn-filter-bill"
              onClick={fetchBills}
              disabled={isAdmin && !dealerGuid}
            >
              <FaSearch /> {t("common.search")}
            </button>
            {USER_ROLE === "customer" && (
              <button
                className="btn btn-create-bill"
                onClick={() => setIsCreateBillOpen(true)}
              >
                + {t("bills.add_bill")}
              </button>
            )}
          </div>
        </div>

        <div className="customer-bills-panel">
          <table className="customer-bills-table">
            <thead>
              <tr>
                <th>{t("bills.date")}</th>
                <th>{t("bills.bill_number")}</th>
                <th className="center">{t("bills.amount")}</th>
                <th className="center">{t("bills.file")}</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.BillGuid}>
                  <td>{formatDate(b.BillDate, currentLang)}</td>
                  <td className="text-bold">{b.BillNumber}</td>
                  <td className="center">{formatMoney(b.TotalAmount, currentLang)}</td>
                  <td className="center row align-center">
                    <div className="bill-actions-cell">
                      <button
                        className="btn-bill-download"
                        disabled={pdfDownloadingId !== null}
                        onClick={() => handleDownloadPDF(b.BillGuid, b.BillNumber)}
                      >
                        {pdfDownloadingId === b.BillGuid ? (
                          <FaSpinner className="pdf-icon spinning" />
                        ) : (
                          <FaFilePdf className="pdf-icon" />
                        )}
                        <span>{pdfDownloadingId === b.BillGuid ? "" : "PDF"}</span>
                      </button>

                      
                    </div>
                     <div className="bill-actions-cell">
                    <button
                        className="btn-bill-qr"
                        onClick={() => setActiveQrBill(b)}
                        title="Показати QR-код для оплати"
                      >
                        <span>QR</span>
                      </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bills.length === 0 && (
            <div className="no-data-placeholder">
               {t("bills.no_bills_found")}
            </div>
          )}
        </div>

        <CreateCustomerBillModal
          isOpen={isCreateBillOpen}
          onClose={() => setIsCreateBillOpen(false)}
          onSuccess={fetchBills}
        />

        {/* =========================
            МОДАЛЬНЕ ВІКНО QR-КОДУ ТА ОПЛАТИ
           ========================= */}
        {activeQrBill && (
          <div className="qr-modal-overlay" onClick={() => setActiveQrBill(null)}>
            <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="qr-modal-close" onClick={() => setActiveQrBill(null)}>
                <FaTimes />
              </button>
              
              <div className="qr-modal-body">
                <div className="qr-modal-code-wrapper">
                  <QRCodeSVG
                    value={generateNbuQrPayload(activeQrBill, edrpouData)}
                    size={220}
                    level="M"
                    includeMargin={true}
                  />
                  
                  {/* КНОПКИ ШВИДКОГО ПЕРЕХОДУ ДО БАНКІВ */}
                  {/* <div className="bank-pay-buttons">
 
            <a 
              href="https://www.privat24.ua/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-bank btn-privat text-[14px]"
              title="Відкрити Приват24"
            >
              Відкрити <span className="font-bold">Приват24</span>
            </a>
            <br/>

            <a 
              href="https://online.monobank.ua/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-bank btn-mono text-[14px]"
              title="Відкрити Monobank"
            >
              Відкрити <span className="font-bold">Monobank</span>
            </a>
            <br/>
      
            <a 
              href="https://online.oschadbank.ua/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-bank btn-oschad text-[14px]"
              title="Відкрити Ощадбанк"
            >
              Відкрити <span className="font-bold">Ощадбанк</span>
            </a>
            
          </div> */}
                </div>
                
                <div className="qr-modal-info">
                  <h3>Швидка оплата (НБУ QR)</h3>
                  <p className="qr-modal-help-text">
                    Відкрийте додаток вашого банку (Приват24, Монобанк тощо), оберіть «Сканувати QR-код» або клікніть на реквізит нижче, щоб скопіювати його.
                  </p>
                  
                  <div className="qr-modal-details">
                    <div className="copy-row">
                      <div className="row">
                      <strong>Отримувач:</strong> <FaCopy className="copy-icon !w-3 !h-3 mt-1" onClick={() => handleCopyText(activeQrBill.Receiver, "Назву отримувача скопійовано!")}/> <br></br> 
                      </div>  
                      <span className="copyable-text" onClick={() => handleCopyText(activeQrBill.Receiver, "Назву отримувача скопійовано!")}>
                        {activeQrBill.Receiver} 
                      </span>
                    </div>

                    <div className="copy-row">
                      <div className="row">
                      <strong>ЄДРПОУ:</strong> <FaCopy className="copy-icon !w-3 !h-3 mt-1" onClick={() => handleCopyText(currentEdrpou, "ЄДРПОУ скопійовано!")} /> <br></br> 
                      </div>
                      <span className="copyable-text" onClick={() => handleCopyText(currentEdrpou, "ЄДРПОУ скопійовано!")}>
                        {currentEdrpou} 
                      </span>
                    </div>

                    <div className="copy-row">
                      <div className="row">
                      <strong>Рахунок (IBAN):</strong> <br></br> <FaCopy className="copy-icon !w-3 !h-3 mt-1" onClick={() => handleCopyText(activeQrBill.InvoiceNumber, "IBAN скопійовано!")}/>
                      </div>
                      <span className="copyable-text iban-code" onClick={() => handleCopyText(activeQrBill.InvoiceNumber, "IBAN скопійовано!")}>
                        <code>{activeQrBill.InvoiceNumber}</code> 
                      </span>
                    </div>

                    <div className="copy-row">
                      <div className="row">
                      <strong>Сума:</strong> <FaCopy className="copy-icon  !w-3 !h-3 mt-1" onClick={() => handleCopyText(Number(activeQrBill.TotalWithVAT || 0).toFixed(2), "Суму скопійовано!")} /> <br></br> 
                      </div>
                      <span className="copyable-text qr-modal-amount row" onClick={() => handleCopyText(Number(activeQrBill.TotalWithVAT || 0).toFixed(2), "Суму скопійовано!")}>
                        {formatMoney(activeQrBill.TotalWithVAT, "uk-UA")} {activeQrBill.Currency || "грн"} 
                      </span>
                    </div>

                    <div className="copy-row legacy-row">
                      <div className="row">
                      <strong >Призначення:</strong> <FaCopy className="copy-icon !w-3 !h-3 mt-1 " onClick={() => handleCopyText(currentPurpose, "Призначення платежу скопійовано!")}/> <br></br> 
                      </div>
                      <span 
                        className="copyable-text text-sm row" 
                        onClick={() => handleCopyText(currentPurpose, "Призначення платежу скопійовано!")}
                      >
                        {currentPurpose}
                        
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerBillsPage;