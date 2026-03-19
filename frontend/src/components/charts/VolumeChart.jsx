import React, { useMemo, useState, useEffect , useRef  } from 'react';
import ReactECharts from 'echarts-for-react';

export default function VolumeChart({ data, height = '350px' }) {

  const chartRef = useRef(null);
  // 1. Стан для відстеження теми
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));

  // 2. Ефект для "прослуховування" зміни теми на body
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

  // 3. Сортування даних (кешуємо для продуктивності)
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => a.MonthNumber - b.MonthNumber), 
    [data]
  );

  // Кольори, що залежать від теми
  const textColor = isDark ? '#aaaaaa' : '#606060';
  const splitLineColor = isDark ? '#333333' : '#e6e6e6';
  const axisLineColor = isDark ? '#444444' : '#aaaaaa';

  // 4. Опції графіка (перераховуються при зміні теми або даних)
  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: isDark ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      textStyle: { color: isDark ? '#eee' : '#1a1d23' },
      borderColor: isDark ? '#555' : '#ccc',
      formatter: (params) => {
        let res = `<div style="font-weight:800; margin-bottom:8px; border-bottom:1px dashed ${isDark ? '#666' : '#aaa'};">${params[0].name}</div>`;
        params.forEach(item => {
          const val = item.seriesName === 'Оборот' 
            ? (item.value / 1000000).toFixed(2) + 'M грн' 
            : item.value + ' шт';
          res += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; margin-bottom:4px;">
                    <span style="color:${item.color}">● ${item.seriesName}:</span>
                    <span style="font-weight:700">${val}</span>
                  </div>`;
        });
        return res;
      }
    },
    legend: { bottom: 0, textStyle: { color: textColor } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: sortedData.map(d => d.MonthName), 
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor }
    },
    yAxis: [
      { 
        type: 'value', 
        name: 'Шт', 
        nameTextStyle: { color: '#7C5747' },
        axisLine: { show: true, lineStyle: { color: axisLineColor } },
        axisLabel: { color: textColor },
        splitLine: { lineStyle: { type: 'dashed', color: splitLineColor } }
      },
      { 
        type: 'value', 
        name: 'Грн', 
        nameTextStyle: { color: '#e46321' },
        axisLine: { show: true, lineStyle: { color: axisLineColor } },
        axisLabel: { 
          color: textColor,
          formatter: (v) => `${(v / 1000000).toFixed(1)}M` 
        },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Конструкції',
        type: 'bar',
        data: sortedData.map(d => d.TotalQuantity),
        itemStyle: { color: '#7C5747', opacity: 0.8, borderRadius: [4, 4, 0, 0] }
      },
      {
        name: 'Оборот',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: sortedData.map(d => d.MonthlySum),
        itemStyle: { color: '#e46321' },
        lineStyle: { width: 3, type: 'dashed' }
      }
    ]
  }), [isDark, sortedData, textColor, axisLineColor, splitLineColor]);

  return (
    <ReactECharts 
      option={option} 
      style={{ height: height, width: '100%' }} 
      notMerge={true} // Обов'язково для коректної зміни кольорів
    />
  );
}