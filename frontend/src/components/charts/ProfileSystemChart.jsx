import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const ProfileSystemChart = ({ data, height = '500px' }) => {
  const chartRef = useRef(null);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
    grid: { 
      top: 10, 
      bottom: 20, 
      left: 10,      
      right: 60,

    },
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      backgroundColor: isDark ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      textStyle: { color: isDark ? '#eee' : '#1a1d23' }
    },
    xAxis: { show: false },
    yAxis: {
      type: 'category',
      data: sortedData.map(item => item.ProfileSystem),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: isDark ? '#aaaaaa' : '#606060',
        overflow: 'break', 
        width: 220, 
        align: 'left', 
        margin: 170, 
        fontSize: 11 
      }
    },
    series: [{
      type: 'bar',
      data: sortedData.map(item => item.OrdersCount),
      barWidth: 12,
      itemStyle: { color: '#d3c527', borderRadius: 6 },
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
      style={{ height: height, width: '100%' }} 
      opts={{ renderer: 'svg' }} 
      notMerge={true} 
    />
  );
};

export default ProfileSystemChart;