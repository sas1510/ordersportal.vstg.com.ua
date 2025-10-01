// // OrdersPage.jsx
// import React, { useState, useEffect } from "react";
// import CalculationList from "../components/Order/CalculationList";
// import { mockCalculations } from "../components/Order/mockCalculations";
// import FilterMenu from "../components/Order/FilterMenu";
// import '../styles/portal.css' // 👈 імпорт меню

// const OrdersPage = () => {
//   const [allCalculations, setAllCalculations] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeFilter, setActiveFilter] = useState("all");

//   useEffect(() => {
//     setAllCalculations(mockCalculations);
//   }, []);

//   const filteredCalculations = allCalculations
//     .map((calc) => {
//       const filteredOrders = calc.items.filter((order) => {
//         let statusMatch = true;
//         switch (activeFilter) {
//           case "new": statusMatch = order['ЭтапВыполненияЗаказа'] === "Новий"; break;
//           case "processing": statusMatch = order['ЭтапВыполненияЗаказа'] === "В обробці"; break;
//           case "waiting-payment": statusMatch = parseFloat(order['СуммаЗаказа']) - parseFloat(order['ОплаченоПоЗаказу']) > 0; break;
//           case "waiting-confirm": statusMatch = order['СостояниеЗаказа'] !== "Подтверждено"; break;
//           case "production": statusMatch = !!order['ФактическаяДатаПроизводстваМакс']; break;
//           case "ready": statusMatch = !!order['ФактическаяДатаГотовностиМакс']; break;
//           case "delivered": statusMatch = !!order['ДатаРеализации']; break;
//           case "rejected": statusMatch = order['ЭтапВыполненияЗаказа'] === "Відмова"; break;
//           default: statusMatch = true;
//         }

//         const searchMatch = order.name.toLowerCase().includes(searchQuery.toLowerCase());
//         return statusMatch && searchMatch;
//       });

//       return { ...calc, items: filteredOrders };
//     })
//     .filter((calc) => calc.items.length > 0);

//   return (
//     <div className="orders-page row w-100" style={{ padding: "1% 10% 0 10%" }}>
//     {/* Бокове меню */}
//     <div className="sidebar p-2" style={{ height: "calc(100vh - 3%)", overflowY: "auto" }}>
//       <FilterMenu
//         calculations={allCalculations}
//         onSelect={(filterId, searchValue) => {
//           setActiveFilter(filterId);
//           setSearchQuery(searchValue);
//         }}
//       />
//     </div>

//   {/* Контент */}
//   <div className="calculations-wrapper column gap-4 w-100" style={{ height: "calc(100vh - 3%)", overflow: "hidden" }}>
//     <h1>Список прорахунків та замовлень</h1>
//     <div style={{ flex: 1, overflowY: "auto" }}>
//       <CalculationList calculations={filteredCalculations} />
//     </div>
//   </div>
// </div>


//       );
//     };

// export default OrdersPage;
import React, { useState } from "react";
import YearMonthFilter from "../components/Orders1/YearMonthFilter";
import FilterMenu from "../components/Orders1/FilterMenu";
import { CalculationItem } from "../components/Orders1/OrderComponents";

export default function OrdersPage() {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const toggleCalc = (id) => setExpandedCalc(expandedCalc === id ? null : id);
  const toggleOrder = (id) => setExpandedOrder(expandedOrder === id ? null : id);
  const handleFilterChange = (filterId) => setActiveFilter(filterId);

  const calculationsData = [
    {
      id: "37",
      date: "16 вер 2025 р.",
      constructions: 55,
      orders: 4,
      sum: 158932,
      file: "37.zkz",
      status: "Очікують оплату",
      items: [
        {
          orderId: "01-277764",
          orderDate: "29 серп 2024 р.",
          constructions: 20,
          documents: 1,
          pdf: "01-277764.pdf",
          orderSum: 41423,
          debt: 0,
          stage: "Відвантажений",
          workflow: {
            order: { date: "29 серпня 2024 р.", completed: true },
            payment: { date: "Оплачено", completed: true },
            confirmation: { date: "Підтверджено", completed: true },
            production: { date: "9 вересня 2024 р.", completed: true },
            readiness: { date: "9 вересня 2024 р.", completed: true },
            delivery: { date: "12 вересня 2024 р.", completed: true }
          },
          subOrders: [
            { id: "01-277766", date: "29 серп 2024 р.", constructions: 20, pdf: "01-277766.pdf", sum: 65535, debt: 0, status: "Відвантажений" },
            { id: "01-277767", date: "29 серп 2024 р.", constructions: 14, pdf: "01-277767.pdf", sum: 50941, debt: 0, status: "Відвантажений" }
          ]
        }
      ]
    }
  ];

  return (
    <div className="portal-body">
    <div style={{ minHeight: '100vh', backgroundColor: '#e6e6e0', padding: '0 10% 60px 10%' }}>
      <div className="px-4 pt-0 sticky top-0 bg-[#e6e6e0] z-10">
        <YearMonthFilter selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', padding: '16px' }}>
        <FilterMenu calculations={calculationsData} onSelect={handleFilterChange} />
          <div style={{
          width: '1px', 
          backgroundColor: '#ccc', 
          margin: '0 16px',
          borderLeft: '1px dashed #d4d4d4'
        }}></div>

        <div style={{ flex: 1, overflowY: 'auto', paddingLeft: '16px' }}>
          {calculationsData?.length > 0 ? (
            calculationsData.map(calc => (
              <CalculationItem
                key={calc.id}
                calc={calc}
                isExpanded={expandedCalc === calc.id}
                onToggle={() => toggleCalc(calc.id)}
                expandedOrderId={expandedOrder}
                onOrderToggle={toggleOrder}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', marginTop: '50px', color: '#595959' }}>
              Немає даних прорахунків
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
