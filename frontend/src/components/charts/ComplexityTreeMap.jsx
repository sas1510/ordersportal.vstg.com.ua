import React, { useEffect, useRef, useMemo, useState } from "react";
import * as echarts from "echarts";

// Ваші палітри кольорів
const CATEGORY_PALETTES_EXTENDED = {
  "Вікна": [
    "#5e83bf", "#6e9fdf", "#8caeda", "#b3c8e6", "#d9e3f1", 
    "#4b6999", "#384f73", "#26354d", "#131a26"
  ],
  "Двері": [
    "#76b448", "#92c56b", "#add390", "#c9e2b5", "#e4f0da", 
    "#5e903a", "#476c2b", "#2f481d", "#18240e"
  ],
  "Додатки": [
    "#d3c527", "#dad153", "#e3dc7f", "#ede8aa", "#f6f3d4", 
    "#a99e1f", "#7f7617", "#554f10", "#2a2708"
  ],
  "Інше": [
    "#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd", "#eeeeee", 
    "#888888", "#666666", "#444444", "#222222"
  ]
};

export default function ComplexityTreemap({ data, onSectorClick, isDetail, activeGroup }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [isDark, setIsDark] = useState(document.body.classList.contains("dark-theme"));
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

    // Визначаємо палітру на основі activeGroup
    const currentPalette = CATEGORY_PALETTES_EXTENDED[activeGroup] || CATEGORY_PALETTES_EXTENDED["Інше"];

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
                <strong style="color: ${currentPalette[0]};">${percent}%</strong>
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
            // Використання кольору з обраної палітри
            color: currentPalette[index % currentPalette.length],
            borderColor: theme.borderColor,
            borderWidth: 2
          }
        })),
        roam: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: '{name|{b}}\n{val|{c} шт}',
          rich: {
            name: { fontSize: 11, fontWeight: 'bold', color: '#fff', padding: [0, 0, 5, 0] },
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

    // Логіка кліків (залишається без змін...)
    myChart.off('click');
    myChart.on('click', (params) => {
      setSelectedSector(prev => {
        const isSameSelection = prev === params.name;
        const newSelection = isSameSelection ? null : params.name;
        if (onSectorClick) onSectorClick(newSelection);

        if (isSameSelection) {
          myChart.dispatchAction({ type: 'treemapZoomToNode', nodeId: 'root' });
          myChart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
        } else {
          myChart.dispatchAction({ type: 'treemapZoomToNode', targetNodeId: params.name });
          myChart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
          myChart.dispatchAction({ type: 'highlight', seriesIndex: 0, name: params.name });
        }
        return newSelection;
      });
    });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, total, theme, isDetail, onSectorClick, activeGroup]); // Додано activeGroup у залежності

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
    </div>
  );
}