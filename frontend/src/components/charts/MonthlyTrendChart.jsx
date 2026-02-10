import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MonthlyTrendChart({ data }) {
  // Сортуємо по номеру місяця
  const sortedData = [...data].sort((a, b) => a.MonthNumber - b.MonthNumber);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="trend-tooltip">
        <div className="tooltip-title">{label}</div>
        <div className="tooltip-grid">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-row">
              <span className="tooltip-label" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="tooltip-value">
                {entry.name === 'Оборот' 
                  ? `${(entry.value / 1000000).toFixed(2)}M грн`
                  : entry.name === 'Сер. чек'
                  ? `${entry.value.toLocaleString()} грн`
                  : `${entry.value} шт`
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="trend-chart-container">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart 
          data={sortedData} 
          margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
        >
          <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" vertical={false} />
          
          <XAxis 
            dataKey="MonthName" 
            scale="point" 
            tick={{ fontSize: 12 }}
          />
          
          {/* Ліва вісь - Замовлення */}
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke="#8884d8"
            tick={{ fontSize: 12 }}
            label={{ value: 'Замовлення', angle: -90, position: 'insideLeft' }}
          />
          
          {/* Права вісь 1 - Середній чек */}
          <YAxis 
            yAxisId="right1" 
            orientation="right" 
            stroke="#82ca9d"
            tick={{ fontSize: 12 }}
            label={{ value: 'Чек (грн)', angle: 90, position: 'insideRight' }}
          />
          
          {/* Права вісь 2 - Оборот */}
          <YAxis 
            yAxisId="right2" 
            orientation="right" 
            stroke="#FF8042"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            hide
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
          />
          
          {/* Кількість замовлень - область */}
          <Area 
            yAxisId="left" 
            type="monotone" 
            dataKey="OrdersCount" 
            fill="#8884d8" 
            stroke="#8884d8" 
            name="Замовлення" 
            fillOpacity={0.3}
            strokeWidth={2}
          />
          
          {/* Середній чек - лінія */}
          <Line 
            yAxisId="right1" 
            type="monotone" 
            dataKey="AvgCheck" 
            stroke="#82ca9d" 
            strokeWidth={3} 
            name="Сер. чек" 
            dot={{ r: 5, fill: '#82ca9d', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
          />
          
          {/* Загальний оборот - лінія */}
          <Line 
            yAxisId="right2" 
            type="monotone" 
            dataKey="MonthlySum" 
            stroke="#FF8042" 
            strokeWidth={3} 
            name="Оборот" 
            dot={{ r: 5, fill: '#FF8042', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            strokeDasharray="5 5"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Швидка статистика */}
      <div className="trend-stats">
        <div className="stat-item-chart">
          <span className="stat-label">Найкращий місяць:</span>
          <span className="stat-value text-green">
            {sortedData.reduce((max, m) => m.MonthlySum > max.MonthlySum ? m : max).MonthName}
          </span>
        </div>
        <div className="stat-item-chart">
          <span className="stat-label">Найгірший місяць:</span>
          <span className="stat-value text-red">
            {sortedData.reduce((min, m) => m.MonthlySum < min.MonthlySum ? m : min).MonthName}
          </span>
        </div>
        <div className="stat-item-chart">
          <span className="stat-label">Середньомісячно:</span>
          <span className="stat-value text-blue">
            {(sortedData.reduce((s, m) => s + m.MonthlySum, 0) / sortedData.length / 1000000).toFixed(2)}M грн
          </span>
        </div>
      </div>

      <style jsx>{`
        .trend-chart-container {
          width: 100%;
        }

        .trend-tooltip {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border: none;
          min-width: 200px;
        }

        .tooltip-title {
          font-weight: 800;
          font-size: 14px;
          color: #1a1d23;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f0f0f0;
        }

        .tooltip-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tooltip-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .tooltip-label {
          font-weight: 600;
        }

        .tooltip-value {
          color: #1a1d23;
          font-weight: 700;
        }

        .trend-stats {
          display: flex;
          justify-content: space-around;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          margin-top: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat-item-chart {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: #666;
          font-weight: 500;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 800;
        }

        .text-green { color: #00C49F; }
        .text-red { color: #FF8042; }
        .text-blue { color: #0088FE; }

        @media (max-width: 768px) {
          .trend-stats {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}