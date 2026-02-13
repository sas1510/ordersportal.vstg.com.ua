import React, { useEffect, useRef, useMemo, useState } from "react";
import * as echarts from "echarts";

const COLORS = [
  "#5e83bf", "#76b448", "#d3c527", "#e46321", "#7C5747", 
  "#645388", "#aaaaaa", "#d4d947", "#6b98bf", "#9dc08b", 
  "#c2d66b", "#bc4b1a", "#91817a", "#9b72aa"
];

export default function ComplexityTreemap({ data, onSectorClick, isDetail }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [isDark, setIsDark] = useState(document.body.classList.contains("dark-theme"));
  
  // Використовуємо звичайний стан
  const [selectedSector, setSelectedSector] = useState(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("dark-theme"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const theme = useMemo(() => ({
    borderColor: isDark ? "#3b3b3b" : "#ffffff", 
    textColor: isDark ? "#e0e0e0" : "#606060",
    cardBg: isDark ? "#2d2d2d" : "#ffffff",
    borderUI: isDark ? "rgba(255, 255, 255, 0.1)" : "#95959563",
    shadow: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.1)"
  }), [isDark]);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;
    
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const myChart = chartInstanceRef.current;

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.cardBg,
        borderRadius: 8,
        padding: 0,
        borderWidth: 0,
        extraCssText: `box-shadow: 0 4px 12px ${theme.shadow}; border: 1px solid ${theme.borderUI}; z-index: 1001;`,
        formatter: (params) => {
          const percent = ((params.value / total) * 100).toFixed(1);
          return `
            <div style="padding: 12px; min-width: 140px; font-family: sans-serif; color: ${theme.textColor};">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid ${theme.borderUI}; padding-bottom: 4px;">
                ${params.name}
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span style="opacity: 0.7;">Кількість:</span>
                <strong>${params.value.toLocaleString()} шт</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="opacity: 0.7;">Частка:</span>
                <strong style="color: #5e83bf;">${percent}%</strong>
              </div>
            </div>`;
        }
      },
      series: [{
        type: 'treemap',
        cursor: 'pointer',
        data: data.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: COLORS[index % COLORS.length],
            borderColor: theme.borderColor,
            borderWidth: 3
          }
        })),
        roam: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: '{name|{b}}\n{val|{c} шт}',
          rich: {
            name: { fontSize: 12, fontWeight: 'bold', color: '#fff', padding: [0, 0, 5, 0] },
            val: { fontSize: 10, color: 'rgba(255,255,255,0.8)' }
          }
        },
        levels: [{
          itemStyle: { gapWidth: 2, borderWidth: 1, borderColor: theme.borderColor }
        }]
      }]
    };

    myChart.setOption(option, true);
    
    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);
    
   // --- ВИПРАВЛЕНИЙ БЛОК ОБРОБКИ КЛІКІВ ---

myChart.off('click');
myChart.on('click', (params) => {
  setSelectedSector(prev => {
    // Перевіряємо, чи ми клікнули на вже обраний сектор
    const isSameSelection = prev === params.name;
    const newSelection = isSameSelection ? null : params.name;

    // 1. Викликаємо зовнішній колбек
    if (onSectorClick) onSectorClick(newSelection);

    // 2. Керуємо зумом (Zoom Logic)
    if (isSameSelection) {
      // Якщо клікнули повторно — повертаємося до кореня
      myChart.dispatchAction({
        type: 'treemapZoomToNode',
        nodeId: 'root' 
      });
      myChart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
    } else {
      // Якщо клікнули вперше — зумимо до конкретного вузла
      // Важливо: переконайтеся, що nodeId відповідає імені в даних
      myChart.dispatchAction({
        type: 'treemapZoomToNode',
        targetNodeId: params.name 
      });

      // Візуальне підсвічування
      myChart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
      myChart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        name: params.name
      });
    }

    return newSelection;
  });
});

// Скидання при кліку на порожнє поле
myChart.getZr().off('click');
myChart.getZr().on('click', (event) => {
  if (!event.target) {
    setSelectedSector(null);
    if (onSectorClick) onSectorClick(null);
    
    myChart.dispatchAction({
      type: 'treemapZoomToNode',
      nodeId: 'root'
    });
    myChart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
  }
});
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, total, theme, isDetail, onSectorClick]); // selectedSector НЕ потрібен в залежностях

  return (
    <div className="treemap-wrapper" style={{ 
      width: '100%', 
      height: isDetail ? '400px' : '550px', 
      position: 'relative'
    }}>
      <div ref={chartRef} style={{ width: '100%', height: '100%' }} />

      {!isDetail && (
        <div className="total-badge" style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.borderUI,
          color: theme.textColor
        }}>
          <div className="badge-label">Всього виготовлено</div>
          <div className="badge-value">{total.toLocaleString()}</div>
        </div>
      )}

      <style jsx>{`
        .total-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 10px 18px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid;
          z-index: 10;
          text-align: right;
          pointer-events: none;
        }
        .badge-label { font-size: 10px; color: #aaaaaa; margin-bottom: 2px; }
        .badge-value { font-size: 22px; font-weight: 800; line-height: 1; }
      `}</style>
    </div>
  );
}