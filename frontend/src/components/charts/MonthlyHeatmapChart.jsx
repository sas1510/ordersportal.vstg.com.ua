import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

export default function MonthlyHeatmapChart({ data }) {
  // Сортуємо дані за номером місяця
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => a.MonthNumber - b.MonthNumber),
    [data]
  );

  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 8,
      textStyle: { color: '#1a1d23' },
      formatter: (params) => {
        const item = sortedData[params.dataIndex];
        return `
          <div style="font-weight:800; margin-bottom:4px;">${item.MonthName}</div>
          <div style="font-size:12px;">Оборот: <b>${item.MonthlySum.toLocaleString()} грн</b></div>
          <div style="font-size:12px;">Замовлень: <b>${item.OrdersCount} шт</b></div>
        `;
      }
    },
    grid: {
      top: '10%',
      bottom: '25%',
      left: '5%',
      right: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(d => d.MonthName),
      splitArea: { show: true },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      data: ['Активність'],
      show: false // Приховуємо вісь Y для чистоти сітки
    },
    visualMap: {
    min: Math.min(...data.map(d => d.MonthlySum)),
    max: Math.max(...data.map(d => d.MonthlySum)),
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    
    // Використовуйте bottom для відступу від нижнього краю контейнера
    // Або top: '90%', щоб зафіксувати позицію зверху
    bottom: 0, 
    
    // Відступ самої шкали всередині її блоку (редко використовується)
    padding: [28, 0, 0, 0], // [top, right, bottom, left] - ось це аналог marginTop

    inRange: {
      color: ['#E8E8E8', '#FF8042', '#FFBB28', '#82ca9d', '#00C49F']
    },
    text: ['Висока', 'Низька'],
    itemWidth: 15,
    itemHeight: 200, // довжина горизонтальної шкали
    textStyle: { fontSize: 11, color: '#666' }
  },
    series: [{
      name: 'Активність',
      type: 'heatmap',
      data: sortedData.map((d, index) => [index, 0, d.MonthlySum]),
      label: {
        show: true,
        formatter: (params) => {
          const val = (params.data[2] / 1000).toFixed(0);
          return `{val|${val}к}\n{order|${sortedData[params.dataIndex].OrdersCount} зам}`;
        },
        rich: {
          val: { fontSize: 16, fontWeight: 'bold', color: '#1a1d23', padding: [0, 0, 5, 0] },
          order: { fontSize: 10, color: '#666' }
        }
      },
      itemStyle: {
        emphasis: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        },
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 4
      }
    }]
  };

  return (
    <div className="heatmap-chart-wrapper">
      <ReactECharts 
        option={option} 
        style={{ height: '250px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
      <style jsx>{`
        .heatmap-chart-wrapper {
          padding: 7px;
          background: #fff;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}