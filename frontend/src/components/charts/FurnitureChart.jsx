import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const FurnitureChart = ({ data }) => {
  const infoColor = '#5e83bf'; 
  const dangerColor = '#e46321';

  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return [...data].sort((a, b) => (b.OrdersCount || 0) - (a.OrdersCount || 0));
  }, [data]);

  const option = {
    // Фіксований відступ зліва 180px для всіх графіків
    grid: { top: 10, bottom: 20, left: 180, right: 60 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { show: false },
    yAxis: {
      type: 'category',
      data: sortedData.map(item => item.Furniture),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
       axisLabel: { color: '#606060', overflow: 'break', width: 220, align: 'left', margin: 170, fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: sortedData.map(item => item.OrdersCount),
      barWidth: 12,
      itemStyle: { color: infoColor, borderRadius: 6 },
      label: { 
        show: true, 
        position: 'right', 
        color: dangerColor, 
        fontWeight: 'bold',
        formatter: '{c} шт' 
      }
    }]
  };

  return <ReactECharts option={option} style={{ height: '500px' }} opts={{ renderer: 'svg' }} />;
};


export default FurnitureChart;