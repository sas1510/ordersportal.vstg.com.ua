import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const CATEGORY_COLORS = {
  "Вікна": "#5e83bf",
  "Двері": "#76b448",
  "Додатки": "#d3c527",
  "Інше": "#aaaaaa"
};

// Додано дефолтне значення height
export default function ComplexityDonut({ data, onSectorClick, isDetail, height = '500px' }) {
  const chartRef = useRef(null); // Додано ref для ресайзу
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // ПРИМУСОВИЙ РЕСАЙЗ при зміні висоти (важливо для Builder)
  useEffect(() => {
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.resize();
    }
  }, [height]);

  const total = useMemo(() => data.reduce((s, i) => s + i.value, 0), [data]);
  const chartColors = data.map(item => CATEGORY_COLORS[item.name] || "#aaaaaa");

  const textColor = isDark ? '#aaaaaa' : '#606060';
  const labelColor = isDark ? '#eee' : '#606060';
  const tooltipBg = isDark ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? '#333333' : '#fff';

  const option = useMemo(() => ({
    color: chartColors,
    tooltip: {
      trigger: 'item',
      backgroundColor: tooltipBg,
      borderRadius: 8,
      padding: 0,
      borderColor: isDark ? '#444' : '#95959563',
      extraCssText: `box-shadow: 0 4px 12px ${isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)'}; z-index: 1001;`,
      formatter: (params) => {
        const percentage = ((params.value / total) * 100).toFixed(1);
        return `
          <div style="padding: 12px; min-width: 140px; font-family: sans-serif; color: ${isDark ? '#eee' : '#606060'};">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid ${isDark ? '#444' : '#95959563'}; padding-bottom: 4px;">
              ${params.name}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
              <span>Кількість:</span>
              <strong style="margin-left: 8px;">${params.value.toLocaleString()} шт</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>Частка:</span>
              <strong style="margin-left: 8px;">${percentage}%</strong>
            </div>
          </div>
        `;
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      left: 'center',
      icon: 'circle',
      itemWidth: 10,
      itemGap: 20,
      textStyle: { color: textColor, fontSize: 12 }
    },
    series: [
      {
        name: 'Complexity',
        type: 'pie',
        // Використовуємо % для радіусів, щоб вони тягнулися за висотою
        radius: isDetail ? [0, '35%'] : ['30%', '50%'],
        center: ['50%', isDetail ? '50%' : '42%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: isDetail ? 0 : 4,
          borderColor: borderColor,
          borderWidth: 2
        },
        label: {
          show: !isDetail,
          position: 'outside',
          formatter: (params) => {
            return `{name|${params.name}}\n{val|${params.value.toLocaleString()} шт (${params.percent.toFixed(1)}%)}`;
          },
          rich: {
            name: {
              fontSize: 12,
              fontWeight: 600,
              color: labelColor,
              padding: [0, 0, 4, 0]
            },
            val: {
              fontSize: 11,
              color: isDark ? '#888' : '#aaaaaa'
            }
          }
        },
        labelLine: {
          show: !isDetail,
          length: 15,
          length2: 20,
          lineStyle: { color: isDark ? '#444' : '#95959563' }
        },
        data: data,
        emphasis: {
          scale: true,
          scaleSize: 8,
        },
        animationType: 'expansion',
        animationDuration: 1000
      }
    ]
  }), [isDark, data, chartColors, total, isDetail, textColor, labelColor, tooltipBg, borderColor]);

  const onEvents = {
    click: (params) => {
      if (onSectorClick) onSectorClick(params.name);
    }
  };

  return (
    /* Використовуємо пропс height для обгортки */
    <div className="donut-wrapper" style={{ width: '100%', height: height }}>
      <ReactECharts 
        ref={chartRef}
        option={option} 
        style={{ height: '100%', width: '100%' }} 
        onEvents={onEvents}
        notMerge={true}
      />
      
      {!isDetail && (
        <div className="donut-center-badge">
          <div className="badge-label">Всього за рік</div>
          <div className="badge-value">{total.toLocaleString()}</div>
          <div className="badge-unit">одиниць</div>
        </div>
      )}

      {/* Ваші стилі залишені без змін */}
      <style jsx>{`
        .donut-wrapper { 
          position: relative; 
          animation: fadeIn 0.6s ease-out; 
        }

        .donut-center-badge {
          position: absolute;
          left: 50%;
          top: 42%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
          background: ${isDark ? '#cccccc' : 'white'};
          border-radius: 50%;
          box-shadow: 0 4px 12px ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 115px;
          height: 115px;
          z-index: 1;
          border: 1px solid ${isDark ? '#444' : '#95959563'};
          transition: background 0.3s ease, border 0.3s ease;
        }

        .badge-label { font-size: 11px; color: ${isDark ? '#888' : '#aaaaaa'}; margin-bottom: 2px; }
        .badge-value { font-size: 20px; font-weight: 700; color: #606060; line-height: 1.1; }
        .badge-unit { font-size: 11px; color: ${isDark ? '#666' : '#b9b9b9'}; margin-top: 2px; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}