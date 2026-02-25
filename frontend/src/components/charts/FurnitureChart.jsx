import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const FurnitureChart = ({ data, height = '500px' }) => {
  const chartRef = useRef(null);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));

  // 1. Слідкуємо за темою
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // 2. ПРИМУСОВИЙ РЕСАЙЗ при зміні висоти (для Builder)
  useEffect(() => {
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.resize();
    }
  }, [height]);

  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return [...data].sort((a, b) => (b.OrdersCount || 0) - (a.OrdersCount || 0));
  }, [data]);

  const option = useMemo(() => ({
    // containLabel дозволяє графіку самому посунутися, якщо назви дуже довгі
    grid: { 
      top: 10, 
      bottom: 20, 
      left: 10, 
      right: 60, 
      containLabel: true 
    },
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      backgroundColor: isDark ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? '#555' : '#ccc',
      textStyle: { color: isDark ? '#eee' : '#1a1d23' }
    },
    xAxis: { show: false },
    yAxis: {
      type: 'category',
      data: sortedData.map(item => item.Furniture),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: isDark ? '#aaaaaa' : '#606060', 
        fontSize: 11,
        width: 170,          // Ширина зони тексту
        overflow: 'break',   // ПЕРЕНЕСЕННЯ ТЕКСТУ
        interval: 0,         // Показувати всі елементи
        lineHeight: 14,
        align: 'right'
      }
    },
    series: [{
      type: 'bar',
      data: sortedData.map(item => item.OrdersCount),
      barWidth: 12,
      itemStyle: { 
        color: '#645388', 
        borderRadius: 6 
      },
      label: { 
        show: true, 
        position: 'right', 
        color: isDark ? '#eeeeee' : '#606060', 
        fontWeight: 'bold',
        formatter: '{c} шт' 
      }
    }]
  }), [sortedData, isDark]);

  return (
    <ReactECharts 
      ref={chartRef}
      option={option} 
      // Використовує динамічну висоту від Builder або 500px за замовчуванням
      style={{ height: height, width: '100%' }} 
      opts={{ renderer: 'svg' }} 
      notMerge={true} 
    />
  );
};

export default FurnitureChart;