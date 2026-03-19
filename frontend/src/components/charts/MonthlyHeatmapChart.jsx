import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

export default function MonthlyHeatmapChart({ data }) {
  // 1. Відстеження теми
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 2. Підготовка даних
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => a.MonthNumber - b.MonthNumber),
    [data]
  );

  // Кольори залежно від теми
  const textColor = isDark ? '#aaaaaa' : '#666666';
  const labelColor = isDark ? '#ffffff' : '#1a1d23';
  const tooltipBg = isDark ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? '#1a1d23' : '#ffffff'; // Колір проміжків між плитками

  const option = useMemo(() => ({
    tooltip: {
      position: 'top',
      backgroundColor: tooltipBg,
      borderRadius: 8,
      textStyle: { color: isDark ? '#eee' : '#1a1d23' },
      borderColor: isDark ? '#555' : '#ccc',
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
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor }
    },
    yAxis: {
      type: 'category',
      data: ['Активність'],
      show: false
    },
    visualMap: {
      min: Math.min(...data.map(d => d.MonthlySum)),
      max: Math.max(...data.map(d => d.MonthlySum)),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0, 
      padding: [28, 0, 0, 0],
      inRange: {
        // Темніші кольори для темної теми, щоб текст зчитувався краще
        color: isDark 
          ? ['#2a2a2a', '#e67e22', '#f1c40f', '#27ae60', '#16a085'] 
          : ['#E8E8E8', '#FF8042', '#FFBB28', '#82ca9d', '#00C49F']
      },
      text: ['Висока', 'Низька'],
      itemWidth: 15,
      itemHeight: 200,
      textStyle: { fontSize: 11, color: textColor }
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
          val: { 
            fontSize: 16, 
            fontWeight: 'bold', 
            color: labelColor, 
            padding: [0, 0, 5, 0] 
          },
          order: { 
            fontSize: 10, 
            color: textColor 
          }
        }
      },
      itemStyle: {
        emphasis: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        },
        borderRadius: 8,
        borderColor: borderColor, // Змінюємо колір рамок між плитками
        borderWidth: 4
      }
    }]
  }), [isDark, sortedData, data, textColor, labelColor, tooltipBg, borderColor]);

  return (
    <div className="heatmap-chart-wrapper">
      <ReactECharts 
        option={option} 
        style={{ height: '250px', width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
      />
      <style jsx>{`
        .heatmap-chart-wrapper {
          padding: 7px;
          background: ${isDark ? '#1a1d23' : '#fff'};
          border-radius: 3px;
          transition: background 0.3s ease;
        }
      `}</style>
    </div>
  );
}