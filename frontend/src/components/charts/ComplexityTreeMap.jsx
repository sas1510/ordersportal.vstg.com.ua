import React, { useEffect, useRef, useMemo, useState } from "react";
import * as echarts from "echarts";

const CATEGORY_PALETTES_EXTENDED = {
  "Вікна": ["#5e83bf", "#6e9fdf", "#8caeda", "#b3c8e6", "#a6c8f7", "#4b6999", "#384f73", "#26354d", "#131a26"],
  "Двері": ["#76b448", "#92c56b", "#add390", "#c9e2b5", "#e4f0da", "#5e903a", "#476c2b", "#2f481d", "#18240e"],
  "Додатки": ["#d3c527", "#dad153", "#e3dc7f", "#ede8aa", "#f6f3d4", "#a99e1f", "#7f7617", "#554f10", "#2a2708"],
  "Інше": ["#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd", "#eeeeee", "#888888", "#666666", "#444444", "#222222"]
};

// Додано пропс height з дефолтним значенням
export default function ComplexityTreemap({ data, onSectorClick, isDetail, activeGroup, width, height = '500px' }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [isDark, setIsDark] = useState(document.body.classList.contains("dark-theme"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("dark-theme"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const total = useMemo(() => (data || []).reduce((sum, item) => sum + item.value, 0), [data]);

  const theme = useMemo(() => ({
    borderColor: isDark ? "#333333" : "#ffffff",
    tooltipBg: isDark ? "rgba(33, 33, 33, 0.95)" : "rgba(255, 255, 255, 0.95)",
    tooltipText: isDark ? "#eee" : "#1a1d23",
    tooltipBorder: isDark ? "#555" : "#ccc"
  }), [isDark]);

  useEffect(() => {
    if (!chartRef.current) return;
    
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const myChart = chartInstanceRef.current;
    const currentPalette = CATEGORY_PALETTES_EXTENDED[activeGroup] || CATEGORY_PALETTES_EXTENDED["Інше"];

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.tooltipText },
        borderRadius: 8,
        formatter: (params) => {
          const percent = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
          return `
            <div style="padding: 4px; font-family: sans-serif;">
              <div style="font-weight: 700; margin-bottom: 4px; border-bottom: 1px solid ${isDark ? '#444' : '#eee'}; padding-bottom: 4px;">
                ${params.name}
              </div>
              <div style="display: flex; justify-content: space-between; gap: 15px;">
                <span>Кількість:</span> <b>${params.value.toLocaleString()} шт</b>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 15px;">
                <span>Частка:</span> <b>${percent}%</b>
              </div>
            </div>
          `;
        }
      },
      series: [{
        type: 'treemap',
        data: (data || []).map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: currentPalette[index % currentPalette.length],
            borderColor: theme.borderColor,
            borderWidth: 2,
            gapWidth: 2
          }
        })),
        breadcrumb: { show: false },
        roam: false,
        nodeClick: false,
        label: { 
          show: true, 
          position: 'inside',
          formatter: '{b}\n{c} шт',
          fontSize: 11,
          fontWeight: '600',
          color: "#fff", 
          textBorderWidth: 2
        },
        upperLabel: { show: false },
        levels: [
          {
            itemStyle: {
              borderColor: theme.borderColor,
              borderWidth: 2,
              gapWidth: 2
            }
          }
        ]
      }]
    };

    myChart.setOption(option, true);

    myChart.off('click');
    myChart.on('click', (params) => {
       if (onSectorClick) onSectorClick(params.name);
    });

  }, [data, theme, activeGroup, total, isDark]);

  // ПРИМУСОВИЙ РЕСАЙЗ при зміні розмірів або теми
  useEffect(() => {
    if (chartInstanceRef.current) {
      // Використовуємо requestAnimationFrame для плавного ресайзу після оновлення DOM
      requestAnimationFrame(() => {
        chartInstanceRef.current.resize();
      });
    }
  }, [width, height, isDark]); 

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
        height: height, // Тепер використовує передану висоту
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.3s ease'
      }}
    >
      <div ref={chartRef} style={{ flex: 1, width: '100%' }} />
    </div>
  );
}