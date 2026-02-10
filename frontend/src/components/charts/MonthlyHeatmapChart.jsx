import { useMemo } from 'react';

export default function MonthlyHeatmapChart({ data }) {
  // Знаходимо максимальне значення для нормалізації
  const maxSum = useMemo(() => 
    Math.max(...data.map(d => d.MonthlySum)), 
    [data]
  );

  // Сортуємо по номеру місяця
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => a.MonthNumber - b.MonthNumber),
    [data]
  );

  const getColor = (value) => {
    const intensity = value / maxSum;
    if (intensity > 0.8) return '#00C49F'; // Зелений
    if (intensity > 0.6) return '#82ca9d'; // Світло-зелений
    if (intensity > 0.4) return '#FFBB28'; // Жовтий
    if (intensity > 0.2) return '#FF8042'; // Помаранчевий
    return '#E8E8E8'; // Сірий
  };

  const getIntensity = (value) => {
    const base = value / maxSum;
    return 0.3 + (base * 0.7); // Від 0.3 до 1.0
  };

  return (
    <div className="heatmap-container">
      <div className="heatmap-grid">
        {sortedData.map((month, index) => {
          const intensity = getIntensity(month.MonthlySum);
          const color = getColor(month.MonthlySum);
          
          return (
            <div 
              key={month.MonthNumber}
              className="heatmap-cell"
              style={{
                backgroundColor: color,
                opacity: intensity,
                animationDelay: `${index * 0.05}s`,
                cursor: 'default',
              }}
              title={`${month.MonthName}: ${month.MonthlySum.toLocaleString()} грн`}
            >
              <div className="month-label">{month.MonthName.slice(0, 3)}</div>
              <div className="month-value">{(month.MonthlySum / 1000).toFixed(0)} тис.</div>
              <div className="month-orders">{month.OrdersCount} зам</div>
            </div>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="heatmap-legend">
        <span className="legend-title">Інтенсивність замовлень:</span>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#E8E8E8' }}></span>
            <span>Низька</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#FF8042' }}></span>
            <span>Нижче середнього</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#FFBB28' }}></span>
            <span>Середня</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#82ca9d' }}></span>
            <span>Вища середнього</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#00C49F' }}></span>
            <span>Висока</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .heatmap-container {
          width: 100%;
          padding: 20px;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .heatmap-cell {
          aspect-ratio: 1;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          animation: fadeInUp 0.4s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .heatmap-cell:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          z-index: 10;
        }

        .month-label {
          font-size: 14px;
          font-weight: 700;
          color: #1a1d23;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .month-value {
          font-size: 22px;
          font-weight: 800;
          color: #1a1d23;
          margin-bottom: 2px;
        }

        .month-orders {
          font-size: 11px;
          color: #666;
          font-weight: 500;
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .legend-title {
          font-size: 13px;
          font-weight: 600;
          color: #666;
          margin-right: 8px;
        }

        .legend-items {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #666;
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .heatmap-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .month-value {
            font-size: 18px;
          }

          .legend-items {
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}