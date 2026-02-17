import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const ProfileSystemChart = ({ data }) => {
  const purpleColor = '#645388';
  const dangerColor = '#e46321';

  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return [...data].sort((a, b) => (b.OrdersCount || 0) - (a.OrdersCount || 0));
  }, [data]);

  const option = {
    grid: { top: 10, bottom: 20, left: 180, right: 60 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { show: false },
    yAxis: {
      type: 'category',
      data: sortedData.map(item => item.ProfileSystem),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#606060', align: 'left', margin: 170, fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: sortedData.map(item => item.OrdersCount),
      barWidth: 12,
      itemStyle: { color: purpleColor, borderRadius: 6 },
      label: { 
        show: true, 
        position: 'right', 
        color: dangerColor, 
        fontWeight: 'bold',
        formatter: '{c}' 
      }
    }]
  };

  return <ReactECharts option={option} style={{ height: '400px' }} opts={{ renderer: 'svg' }} />;
};


export default ProfileSystemChart;