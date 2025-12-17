// import React, { useState, useContext } from 'react';
// import axiosInstance from '../api/axios';
// import ContractorsSelect from '../components/ContractorsSelect';
// import { RoleContext } from '../context/RoleContext';

// export default function WdsPromotion() {
//   const today = new Date();
//   const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 2);

//   const formatDate = (date) => date.toISOString().split('T')[0];

//   const { role: userRole } = useContext(RoleContext);
//   const [dateFrom, setDateFrom] = useState(formatDate(firstDayOfMonth));
//   const [dateTo, setDateTo] = useState(formatDate(today));
//   const [contractor, setContractor] = useState('');
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');

//   const fetchData = async () => {
//     if (!dateFrom || !dateTo) return;

//     setLoading(true);
//     setData([]);
//     setMessage('');

//     try {
//       const res = await axiosInstance.get('/promotions/orders', {
//         params: { startDate: dateFrom, endDate: dateTo, kontrKod: contractor }
//       });

//       if (!res.data || res.data.length === 0) {
//         setMessage('Акцій/замовлень поки немає.');
//       } else {
//         setData(res.data);
//       }
//     } catch (err) {
//       console.error(err);
//       setMessage('Помилка при завантаженні даних');
//     }

//     setLoading(false);
//   };

//   // if (userRole === 'Dealer') {
//   //   return <p className="mt-3 text-danger">Доступ обмежений для дилерів</p>;
//   // }

//   return (
//     <div className="container mt-4">
//       <h2>Акційні WDS</h2>

//       {/* Вибір контрагента */}
//       <ContractorsSelect value={contractor} onChange={setContractor} role={userRole} />

//       <div className="mb-3 mt-2">
//         <label>Дата з:</label>
//         <input
//           type="date"
//           className="form-control"
//           value={dateFrom}
//           onChange={e => setDateFrom(e.target.value)}
//         />

//         <label>Дата по:</label>
//         <input
//           type="date"
//           className="form-control"
//           value={dateTo}
//           onChange={e => setDateTo(e.target.value)}
//         />

//         <button className="btn btn-primary mt-2" onClick={fetchData} disabled={loading}>
//           {loading ? 'Завантаження...' : 'Показати'}
//         </button>
//       </div>

//       {message && <p className="mt-3">{message}</p>}

//       {data.length > 0 && (
//         <table className="table table-striped">
//           <thead>
//             <tr>
//               <th>№ замовл.</th>
//               <th>Серія</th>
//               <th>Акційний WDS код</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, idx) => (
//               <tr key={idx}>
//                 <td>{row.order_number}</td>
//                 <td>{row.seria_number}</td>
//                 <td>{row.kod_wds}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }
