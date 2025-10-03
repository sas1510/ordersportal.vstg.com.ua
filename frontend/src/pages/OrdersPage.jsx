import React, { useState, useEffect } from "react";
import YearMonthFilter from "../components/Orders1/YearMonthFilter";
import {CalculationItem} from "../components/Orders1/OrderComponents"; // зміни у компоненті
import axiosInstance from "../api/axios";
import FilterMenu from "../components/Orders1/FilterMenu";

export default function OrdersPage() {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [expandedCalc, setExpandedCalc] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [calculationsData, setCalculationsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleCalc = (id) => setExpandedCalc(expandedCalc === id ? null : id);
  const toggleOrder = (id) => setExpandedOrder(expandedOrder === id ? null : id);
  const handleFilterChange = (filterId) => setActiveFilter(filterId);




  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/get_orders_info/", {
          params: { year: selectedYear }
        });

        if (response.data?.status === "success") {
          const rawCalculations = response.data.data.calculation || [];
          const formatDateHuman = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            if (isNaN(date)) return null;
            return date.toLocaleDateString('uk-UA', {
              day: '2-digit',
              month: 'short', // вер., серп., тощо
              year: 'numeric'
            });
          };

          const formattedCalcs = rawCalculations.map(calc => {
          const orders = Array.isArray(calc.order)
            ? calc.order.map(order => ({
                id: order.Заказ_ID,
                number: order.name,
                date: formatDateHuman(order.ДатаЗаказа),
                status: order.СостояниеЗаказа,
                amount: order.СуммаЗаказа,
                count: Number(order.КоличествоКонструкцийВЗаказе),
                plan_production_max: formatDateHuman(order.ПлановаяДатаПроизводстваМакс),
                plan_production_min: formatDateHuman(order.ПлановаяДатаПроизводстваМин),
                paid: order.ОплаченоПоЗаказу,
                fact_production_min: formatDateHuman(order.ФактическаяДатаПроизводстваМин),
                fact_production_max: formatDateHuman(order.ФактическаяДатаПроизводстваМакс),
                produced_total: order.ПроизведеноВсего,
                fact_ready_min: formatDateHuman(order.ФактическаяДатаГотовностиМин),
                fact_ready_max: formatDateHuman(order.ФактическаяДатаГотовностиМакс),
                realization_date: formatDateHuman(order.ДатаРеализации),
                quantity_realized: order.КоличествоРеализовано,
                delivery_address: order.АдресДоставки,
                plan_departure: formatDateHuman(order.ПлановаяДатаВыезда),
                goods_in_delivery: order.КоличествоТоваровВДоставке,
                arrival_time: formatDateHuman(order.ВремяПрибытия),
                route_status: order.СостояниеМаршрута,
                execution_stage: order.ЭтапВыполненияЗаказа
              }))
            : [];

            const calcAmount = orders.reduce(
              (total, order) => total + parseFloat(order.amount || 0),
              0
            );

            const statusCounts = orders.reduce((acc, order) => {
              if (!order.execution_stage) return acc;
              acc[order.execution_stage] = (acc[order.execution_stage] || 0) + 1;
              return acc;
            }, {});

            return {
                id: calc.Просчет_ID,
                number: calc.name,
                date: formatDateHuman(calc.ДатаПросчета),
                count: calc.КоличествоКонструкцийВПросчете,
                message: calc.ПросчетСообщения,
                file: calc.File,
                order: orders,
                orderCountInCalc: orders.length,
                amount: calcAmount,
                statuses: statusCounts

              };
            });


          setCalculationsData(formattedCalcs);
        } else {
          setCalculationsData([]);
          console.error("Помилка отримання даних:", response.data.message);
        }
      } catch (error) {
        console.error("Помилка запиту:", error);
        setCalculationsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  return (
    <div className="portal-body">
      <div style={{ minHeight: '100vh', backgroundColor: '#e6e6e0', padding: '0 6% 60px 6%' }}>
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

          <div style={{ flex: 1, overflowY: 'auto', paddingLeft: '16px', paddingRight: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '50px', color: '#595959' }}>
                Завантаження даних...
              </div>
            ) : calculationsData.length > 0 ? (
              calculationsData.map(calc => (
                <CalculationItem
                  key={calc.id}
                  calc={calc}
                  isExpanded={expandedCalc === calc.number}
                  onToggle={() => toggleCalc(calc.number)}
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
