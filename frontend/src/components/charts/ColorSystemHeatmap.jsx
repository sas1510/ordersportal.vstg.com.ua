import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const ColorSystemHeatmap = ({ data }) => {
  // Визначаємо унікальні осі
  const colors = useMemo(() => [...new Set((data || []).map((d) => d.color))], [data]);
  const systems = useMemo(() => [...new Set((data || []).map((d) => d.system))], [data]);

  // Мапимо дані у формат [indexSystem, indexColor, value]
  const heatData = useMemo(() => (data || []).map((d) => [
    systems.indexOf(d.system),
    colors.indexOf(d.color),
    d.value || 0,
  ]), [data, systems, colors]);

  const maxVal = useMemo(() => Math.max(...(data || []).map((d) => d.value || 0), 1), [data]);

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      formatter: (p) => `<b>${systems[p.value[0]]}</b><br/>${colors[p.value[1]]}<br/>Замовлень: <b>${p.value[2]}</b>`
    },
    grid: { 
      top: 40, 
      bottom: 60, 
      left: 180, 
      right: 60,
      containLabel: false 
    },
    xAxis: {
      type: 'category',
      data: systems,
      axisLabel: { rotate: 30, interval: 0, fontSize: 10, color: '#606060' },
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: colors,
      axisLabel: { fontSize: 11, color: '#606060' },
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: true,
      orient: 'vertical',
      right: 5,
      top: 'center',
      itemWidth: 15,
      inRange: {
        color: ['#bfd5f3', '#5e83bf'] // Від світлого до основного кольору теми
      }
    },
    series: [{
      name: 'Перетин',
      type: 'heatmap',
      data: heatData,
      label: {
        show: true,
        formatter: (p) => p.value[2] > 0 ? p.value[2] : '',
        color: '#fff'
        // color: '#000000'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  // Динамічна висота залежно від кількості кольорів (мінімум 300px)
  const chartHeight = Math.max(300, colors.length * 35 + 100);

  return (
    <ReactECharts 
      option={option} 
      style={{ height: `${chartHeight}px`, width: '100%' }} 
      opts={{ renderer: 'svg' }}
    />
  );
};

export default ColorSystemHeatmap; 