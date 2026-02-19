import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

// Використовуємо кольори з вашої схеми
const CATEGORY_COLORS = {
  "Вікна": "#5e83bf",  // --info-color
  "Двері": "#76b448",  // --success-color
  "Додатки": "#d3c527", // --warning-color
  "Інше": "#aaaaaa"    // --grey-color
};

export default function ComplexityDonut({ data, onSectorClick, isDetail }) {
  const total = useMemo(() => data.reduce((s, i) => s + i.value, 0), [data]);
  const chartColors = data.map(item => CATEGORY_COLORS[item.name] || "#aaaaaa");
  const option = {
    color: chartColors,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 0,
      // Тінь згідно з вашим --shadow-color (00000050)
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); border: 1px solid #95959563; z-index: 1001;',
      formatter: (params) => {
        const percentage = ((params.value / total) * 100).toFixed(1);
        return `
          <div style="padding: 12px; min-width: 140px; font-family: sans-serif;">
            <div style="font-weight: 700; font-size: 13px; color: #606060; margin-bottom: 8px; border-bottom: 1px solid #95959563; padding-bottom: 4px;">
              ${params.name}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #606060;">
              <span>Кількість:</span>
              <strong style="margin-left: 8px;">${params.value.toLocaleString()} шт</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #606060;">
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
      textStyle: { color: '#606060', fontSize: 12 }
    },
    series: [
      {
        name: 'Complexity',
        type: 'pie',
        // Зменшений розмір кола
        radius: isDetail ? [0, '35%'] : ['30%', '50%'],
        center: ['50%', isDetail ? '50%' : '42%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: isDetail ? 0 : 4,
          borderColor: '#fff',
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
              color: '#606060',
              padding: [0, 0, 4, 0]
            },
            val: {
              fontSize: 11,
              color: '#aaaaaa' // --grey-color
            }
          }
        },
        labelLine: {
          show: !isDetail,
          length: 15,
          length2: 20,
          lineStyle: { color: '#95959563' }
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
  };

  const onEvents = {
    click: (params) => {
      if (onSectorClick) onSectorClick(params.name);
    }
  };

  return (
    <div className="donut-wrapper" style={{ width: '100%', height: isDetail ? 400 : 500, position: 'relative' }}>
      <ReactECharts 
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
          background: white;
          border-radius: 50%;
          /* Використання вашого кольору тіні */
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 115px;
          height: 115px;
          z-index: 1;
          border: 1px solid #95959563;
        }

        .badge-label { font-size: 11px; color: #aaaaaa; margin-bottom: 2px; }
        .badge-value { font-size: 20px; font-weight: 700; color: #606060; line-height: 1.1; }
        .badge-unit { font-size: 11px; color: #b9b9b9; margin-top: 2px; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}