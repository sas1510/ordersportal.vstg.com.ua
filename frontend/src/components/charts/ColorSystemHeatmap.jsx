import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const ColorSystemHeatmap = ({ data, height = '500px' }) => {
  const chartRef = useRef(null);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));

  // 1. Відстеження теми
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 2. ПРИМУСОВИЙ РЕСАЙЗ при зміні висоти
  useEffect(() => {
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.resize();
    }
  }, [height]);

  const colors = useMemo(() => [...new Set((data || []).map((d) => d.color))], [data]);
  const systems = useMemo(() => [...new Set((data || []).map((d) => d.system))], [data]);

  const heatData = useMemo(() => (data || []).map((d) => [
    systems.indexOf(d.system),
    colors.indexOf(d.color),
    d.value || 0,
  ]), [data, systems, colors]);

  const maxVal = useMemo(() => Math.max(...(data || []).map((d) => d.value || 0), 1), [data]);

  const option = useMemo(() => {
    const textColor = isDark ? '#aaaaaa' : '#606060';
    const splitAreaColor = isDark 
      ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] 
      : ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.1)'];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? '#555' : '#ccc',
        textStyle: { color: isDark ? '#eee' : '#1a1d23' },
        formatter: (p) => `<b>${systems[p.value[0]]}</b><br/>${colors[p.value[1]]}<br/>Замовлень: <b>${p.value[2]}</b>`
      },
      grid: { 
        top: 40, 
        bottom: 80, 
        left: 10,      // Зменшуємо, бо containLabel: true зробить відступ сам
        right: 70,     // Місце для VisualMap
        containLabel: true 
      },
      xAxis: {
        type: 'category',
        data: systems,
        axisLabel: { 
          rotate: 35,  // Нахил для читабельності довгих назв систем
          interval: 0, 
          fontSize: 10, 
          color: textColor,
          overflow: 'truncate', // Щоб назви систем не перекривали одна одну
          width: 80 
        },
        axisLine: { lineStyle: { color: isDark ? '#444' : '#ccc' } },
        splitArea: { show: true, areaStyle: { color: splitAreaColor } }
      },
      yAxis: {
        type: 'category',
        data: colors,
        axisLabel: { 
          fontSize: 10, 
          color: textColor,
          width: 120,        // Обмежуємо ширину кольору
          overflow: 'break',  // ПЕРЕНЕСЕННЯ ТЕКСТУ для кольорів
          interval: 0
        },
        axisLine: { lineStyle: { color: isDark ? '#444' : '#ccc' } },
        splitArea: { show: true, areaStyle: { color: splitAreaColor } }
      },
      visualMap: {
        min: 0,
        max: maxVal,
        calculable: true,
        orient: 'vertical',
        right: 5,
        top: 'center',
        itemWidth: 12,
        textStyle: { color: textColor, fontSize: 10 },
        inRange: {
          color: isDark 
            ? ['#1a2a1a', '#2d5a1a', '#4a9c12', '#76b448'] 
            : ['#e8f5e9', '#81c784', '#4caf50', '#2e7d32']
        }
      },
      series: [{
        name: 'Перетин',
        type: 'heatmap',
        data: heatData,
        label: {
          show: true,
          formatter: (p) => p.value[2] > 0 ? p.value[2] : '',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 10
        },
        itemStyle: {
          borderColor: isDark ? '#1a1d23' : '#fff',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  }, [isDark, systems, colors, heatData, maxVal]);

  return (
    <ReactECharts 
      ref={chartRef}
      option={option} 
      style={{ height: height, width: '100%' }} // Використовуємо пропс height
      opts={{ renderer: 'svg' }}
      notMerge={true}
    />
  );
};

export default ColorSystemHeatmap;