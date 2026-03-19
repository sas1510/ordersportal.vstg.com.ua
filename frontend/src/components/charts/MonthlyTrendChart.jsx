import React from 'react';
import ReactECharts from 'echarts-for-react';

export default function MonthlyTrendChart({ data }) {
  // Сортування за номером місяця для правильного порядку на осі
  const sortedData = [...data].sort((a, b) => a.MonthNumber - b.MonthNumber);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      formatter: (params) => {
        let res = `<div style="font-weight:800; margin-bottom:8px; border-bottom:1px solid #f0f0f0;">${params[0].name}</div>`;
        params.forEach(item => {
          let val = item.value;
          if (item.seriesName === 'Оборот') val = (val / 1000000).toFixed(2) + 'M грн';
          else if (item.seriesName === 'Сер. чек') val = val.toLocaleString() + ' грн';
          // else if (item.seriesName === 'Час виготовлення') val = Number(val).toFixed(1) + ' дн.';
          else val = val + ' шт';
          
          res += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:4px;">
                    <span style="color:${item.color}">● ${item.seriesName}:</span>
                    <span style="font-weight:700">${val}</span>
                  </div>`;
        });
        return res;
      }
    },
    legend: {
      data: ['Замовлення', 'Сер. чек', 'Оборот'],
      bottom: 0 // Перенесемо вниз, щоб не заважати заголовку
    },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedData.map(d => d.MonthName),
      axisPointer: { type: 'shadow' }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Замовлення / Дні',
        position: 'left',
        min: 0,
        // Максимум автоматичний, або можна зафіксувати трохи вище за макс. кількість замовлень
        axisLine: { show: true, lineStyle: { color: '#8884d8' } },
        splitLine: { show: true, lineStyle: { type: 'dashed' } }
      },
      {
        type: 'value',
        name: 'Гроші (грн)',
        position: 'right',
        axisLine: { show: true, lineStyle: { color: '#82ca9d' } },
        axisLabel: { 
          formatter: (value) => value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : value 
        }
      }
    ],
    series: [
      {
        name: 'Замовлення',
        type: 'line',
        yAxisIndex: 0,
        data: sortedData.map(d => d.OrdersCount),
        smooth: true,
        symbol: 'circle',
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#8884d8' }
      },
    
      {
        name: 'Сер. чек',
        type: 'line',
        yAxisIndex: 1, // ПРИВ'ЯЗКА ДО ПРАВОЇ ОСІ (Гроші)
        data: sortedData.map(d => d.AvgCheck),
        smooth: true,
        itemStyle: { color: '#82ca9d' }
      },
      {
        name: 'Оборот',
        type: 'line',
        yAxisIndex: 1,
        data: sortedData.map(d => d.MonthlySum),
        smooth: true,
        lineStyle: { type: 'dashed', width: 2 },
        itemStyle: { color: '#FF8042' }
      }
    ]
  };

  return (
    <div className="chart-wrapper-card">
      <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />
    </div>
  );
}