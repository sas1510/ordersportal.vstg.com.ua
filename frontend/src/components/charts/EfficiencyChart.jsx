import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

export default function EfficiencyChart({ data, height = '350px'  }) {
  // 1. Стан для теми
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));
  const chartRef = useRef(null);
  // 2. Слідкуємо за зміною класу на body
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

  const sortedData = useMemo(() => 
    [...data].sort((a, b) => a.MonthNumber - b.MonthNumber), 
    [data]
  );



  // 3. Кольори тепер залежать від стану isDark
  const textColor = isDark ? '#aaaaaa' : '#606060';
  const splitLineColor = isDark ? '#333333' : '#e6e6e6';
  const axisLineColor = isDark ? '#444444' : '#aaaaaa';

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: isDark ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      textStyle: { color: isDark ? '#eee' : '#1a1d23' },
      borderColor: isDark ? '#555' : '#ccc',
      formatter: (params) => {
        const item = sortedData[params[0].dataIndex];
        return `
          <div style="font-weight:800; margin-bottom:8px; border-bottom:1px dashed ${isDark ? '#666' : '#aaa'};">${item.MonthName}</div>
          <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:4px;">
            <span>● Мін. чек:</span> <b style="color:#d3c527">${item.MinSum.toLocaleString()} грн</b>
          </div>
          <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:4px;">
            <span>● Макс. чек:</span> <b style="color:#6b98bf">${item.MaxSum.toLocaleString()} грн</b>
          </div>
          <div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; border-top:1px solid ${isDark ? '#444' : '#eee'}; padding-top:4px;">
            <span>● Сер. чек:</span> <b style="color:#76b448">${item.AvgCheck.toLocaleString()} грн</b>
          </div>
        `;
      }
    },
    legend: { 
      bottom: 0, 
      textStyle: { color: textColor },
      data: ['Мін. чек', 'Макс. чек', 'Сер. чек']
    },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: [{
      type: 'category',
      data: sortedData.map(d => d.MonthName),
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor }
    }],
    yAxis: [{
      type: 'value',
      name: 'Грн',
      nameTextStyle: { color: textColor },
      axisLine: { show: true, lineStyle: { color: axisLineColor } },
      axisLabel: { 
        color: textColor,
        formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}к` : v
      },
      splitLine: { lineStyle: { type: 'dashed', color: splitLineColor } }
    }],
    series: [
      {
        name: 'Мін. чек',
        type: 'bar',
        barGap: '10%',
        data: sortedData.map(d => d.MinSum),
        itemStyle: { color: '#d3c527', borderRadius: [2, 2, 0, 0] }
      },
      {
        name: 'Макс. чек',
        type: 'bar',
        data: sortedData.map(d => d.MaxSum),
        itemStyle: { color: '#6b98bf', borderRadius: [2, 2, 0, 0] }
      },
      {
        name: 'Сер. чек',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: sortedData.map(d => d.AvgCheck),
        itemStyle: { color: '#76b448' },
        lineStyle: { width: 3 }
      }
    ]
  }), [isDark, sortedData, textColor, axisLineColor, splitLineColor]);

  return (
    <ReactECharts 
      option={option} 
      style={{ height: height, width: '100%' }} 
      notMerge={true} // Важливо: змушує ECharts повністю оновити конфіг
    />
  );
}