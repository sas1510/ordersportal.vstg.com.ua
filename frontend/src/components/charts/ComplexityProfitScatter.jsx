import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ComplexityProfitScatter({ data }) {
  // data приходить з tables.categories
  // Потрібно додати приблизний прибуток = TotalOrders * середній чек
  
  const scatterData = data
    .filter(item => item.CategoryName !== '--- УСЬОГО ---')
    .map((item, index) => ({
      name: item.CategoryName,
      complexity: item.AvgFullCycleDays, // Вісь X - складність (час виготовлення)
      profit: item.TotalOrders * 20000, // Вісь Y - приблизний прибуток
      orders: item.TotalOrders, // Розмір бульбашки
      avgQueue: item.AvgWaitInQueueDays,
      avgProd: item.AvgPureProductionDays,
      fill: COLORS[index % COLORS.length]
    }))
    .filter(item => item.orders > 5); // Видаляємо дуже малі категорії

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    
    return (
      <div className="scatter-tooltip">
        <div className="tooltip-title">{data.name}</div>
        <div className="tooltip-grid">
          <div className="tooltip-row">
            <span className="tooltip-label">Замовлень:</span>
            <span className="tooltip-value">{data.orders}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Складність:</span>
            <span className="tooltip-value">{data.complexity.toFixed(1)} дн</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Прибуток:</span>
            <span className="tooltip-value">{(data.profit / 1000000).toFixed(1)}M грн</span>
          </div>
          <div className="tooltip-divider"></div>
          <div className="tooltip-row">
            <span className="tooltip-label">Черга:</span>
            <span className="tooltip-value">{data.avgQueue.toFixed(1)} дн</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Виробництво:</span>
            <span className="tooltip-value">{data.avgProd.toFixed(1)} дн</span>
          </div>
        </div>
      </div>
    );
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    // Розмір бульбашки залежить від кількості замовлень
    const radius = Math.max(8, Math.min(30, payload.orders / 5));
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={payload.fill}
        opacity={0.7}
        stroke="#fff"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  return (
    <div className="scatter-container">
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          <XAxis 
            type="number" 
            dataKey="complexity" 
            name="Складність"
            label={{ value: 'Час виготовлення (дн)', position: 'bottom', offset: 0 }}
            tick={{ fontSize: 12 }}
          />
          
          <YAxis 
            type="number" 
            dataKey="profit" 
            name="Прибуток"
            label={{ value: 'Прибуток (млн грн)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          
          <ZAxis 
            type="number" 
            dataKey="orders" 
            range={[100, 1000]} 
            name="Замовлення"
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          <Scatter 
            data={scatterData} 
            shape={<CustomDot />}
          >
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Квадранти - пояснення */}
      <div className="quadrant-legend">
        <div className="quadrant-item">
          <div className="quadrant-badge bg-green">⭐ Зірки</div>
          <span>Швидко + Прибутково</span>
        </div>
        <div className="quadrant-item">
          <div className="quadrant-badge bg-amber">⚡ Швидкі</div>
          <span>Швидко, але малий прибуток</span>
        </div>
        <div className="quadrant-item">
          <div className="quadrant-badge bg-blue">💰 Прибуткові</div>
          <span>Прибутково, але повільно</span>
        </div>
        <div className="quadrant-item">
          <div className="quadrant-badge bg-red">❌ Проблемні</div>
          <span>Повільно + Малий прибуток</span>
        </div>
      </div>

      <style jsx>{`
        .scatter-container {
          width: 100%;
          padding: 20px 0;
        }

        .scatter-tooltip {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border: none;
          min-width: 220px;
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
          color: #666;
          font-weight: 500;
        }

        .tooltip-value {
          color: #1a1d23;
          font-weight: 700;
        }

        .tooltip-divider {
          height: 1px;
          background: #e0e0e0;
          margin: 6px 0;
        }

        .quadrant-legend {
          display: flex;
          justify-content: space-around;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .quadrant-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .quadrant-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: white;
        }

        .bg-green { background: #00C49F; }
        .bg-amber { background: #FFBB28; }
        .bg-blue { background: #0088FE; }
        .bg-red { background: #FF8042; }

        .quadrant-item span {
          font-size: 11px;
          color: #666;
          text-align: center;
        }

        @media (max-width: 768px) {
          .quadrant-legend {
            flex-direction: column;
            align-items: stretch;
          }

          .quadrant-item {
            flex-direction: row;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}