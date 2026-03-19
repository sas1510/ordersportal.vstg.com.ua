import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const ProfileColorChart = ({ data, height = '500px' }) => {
  const chartRef = useRef(null);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));

  // Слідкуємо за темою
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // ПРИМУСОВИЙ РЕСАЙЗ: Коли змінюється висота, кажемо ECharts оновитися
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
    grid: { top: 20, bottom: 20, left: 180, right: 60 },
    xAxis: { show: false },
    yAxis: {
      type: 'category',
      data: sortedData.map(item => item.ProfileColor),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: isDark ? '#aaaaaa' : '#606060',
        overflow: 'break', 
        width: 250, 
        align: 'left', 
        margin: 170, 
        fontSize: 11 
      }
    },
    series: [{
      type: 'bar',
      data: sortedData.map(item => item.OrdersCount),
      barCategoryGap: '30%', // Це змушує бари заповнювати висоту
      barMaxWidth: 25, 
      itemStyle: { color: '#5e83bf', borderRadius: 6 },
      label: { 
        show: true, 
        position: 'right', 
        color: isDark ? '#eeeeee' : '#606060', 
        fontWeight: 'bold' 
      }
    }]
  }), [sortedData, isDark]);

  return (
    <ReactECharts 
      ref={chartRef}
      option={option} 
      // ВАЖЛИВО: height має бути 100%, щоб він брав висоту від chart-wrapper
      style={{ height: height, width: '100%' }} 
      opts={{ renderer: 'svg' }} 
      notMerge={true} 
    />
  );
};

export default ProfileColorChart;