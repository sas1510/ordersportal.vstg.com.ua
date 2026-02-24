import React, { useEffect, useRef, useMemo, useState } from "react";
import * as echarts from "echarts";

const CATEGORY_PALETTES_EXTENDED = {
  "Вікна": ["#5e83bf", "#6e9fdf", "#8caeda", "#b3c8e6", "#d9e3f1", "#4b6999", "#384f73", "#26354d", "#131a26"],
  "Двері": ["#76b448", "#92c56b", "#add390", "#c9e2b5", "#e4f0da", "#5e903a", "#476c2b", "#2f481d", "#18240e"],
  "Додатки": ["#d3c527", "#dad153", "#e3dc7f", "#ede8aa", "#f6f3d4", "#a99e1f", "#7f7617", "#554f10", "#2a2708"],
  "Інше": ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd", "#eeeeee", "#888888", "#666666", "#444444", "#222222"]
};

export default function ComplexityTreemap({ data, onSectorClick, isDetail, activeGroup, width, height }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [isDark, setIsDark] = useState(document.body.classList.contains("dark-theme"));

  // 1. Слідкуємо за темною темою
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("dark-theme"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const total = useMemo(() => (data || []).reduce((sum, item) => sum + item.value, 0), [data]);

  const theme = useMemo(() => ({
    borderColor: isDark ? "#3b3b3b" : "#ffffff", 
    textColor: isDark ? "#e0e0e0" : "#606060",
    cardBg: isDark ? "#2d2d2d" : "#ffffff",
    borderUI: isDark ? "rgba(255, 255, 255, 0.1)" : "#95959563",
    shadow: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.1)"
  }), [isDark]);

  // 2. Ініціалізація та оновлення опцій
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Ініціалізуємо тільки якщо екземпляра немає
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const myChart = chartInstanceRef.current;
    const currentPalette = CATEGORY_PALETTES_EXTENDED[activeGroup] || CATEGORY_PALETTES_EXTENDED["Інше"];

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.cardBg,
        formatter: (params) => {
          const percent = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
          return `<div style="padding: 8px; color: ${theme.textColor}">${params.name}: <b>${params.value} шт</b> (${percent}%)</div>`;
        }
      },
      series: [{
        type: 'treemap',
        data: (data || []).map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: currentPalette[index % currentPalette.length],
            borderColor: theme.borderColor
          }
        })),
        breadcrumb: { show: false },
        label: { show: true, formatter: '{b}\n{c} шт' }
      }]
    };

    myChart.setOption(option);

    // Обробка кліків
    myChart.off('click');
    myChart.on('click', (params) => {
       if (onSectorClick) onSectorClick(params.name);
    });

  }, [data, theme, activeGroup, total]);

  // 3. ПРЯМИЙ ВИКЛИК RESIZE ПРИ ЗМІНІ ПРОПСІВ
  useEffect(() => {
    if (chartInstanceRef.current) {
      // setTimeout дає DOM-вузлу час на фізичну зміну розміру
      setTimeout(() => {
        chartInstanceRef.current.resize();
      }, 0);
    }
  }, [width, height]); 

  // 4. Очищення при видаленні
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      className="treemap-container" 
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '350px', // Щоб графік не зникав
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div 
        ref={chartRef} 
        style={{ 
          flex: 1, // Займає весь доступний простір контейнера
          width: '100%',
          height: '100%' 
        }} 
      />
    </div>
  );
}