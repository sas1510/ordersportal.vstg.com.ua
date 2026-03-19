import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts';

export default function ProductionFunnelChart({ data }) {
  // Перетворюємо дані швидкості на воронку
  // Показуємо середні значення по всіх категоріях
  
  const avgQueueDays = data.queue_days.reduce((a, b) => a + b, 0) / data.queue_days.length;
  const avgProdDays = data.prod_days.reduce((a, b) => a + b, 0) / data.prod_days.length;
  const totalAvg = avgQueueDays + avgProdDays;

  const funnelData = [
    { 
      stage: 'Прийнято замовлення', 
      days: 0,
      percentage: 100,
      fill: '#82ca9d',
      description: 'Замовлення оформлене'
    },
    { 
      stage: 'В черзі на виробництво', 
      days: avgQueueDays.toFixed(1),
      percentage: 85,
      fill: '#FFBB28',
      description: `Очікування ${avgQueueDays.toFixed(1)} дн`
    },
    { 
      stage: 'У виробництві', 
      days: avgProdDays.toFixed(1),
      percentage: 70,
      fill: '#00C49F',
      description: `Виготовлення ${avgProdDays.toFixed(1)} дн`
    },
    { 
      stage: 'Контроль якості', 
      days: '0.5',
      percentage: 60,
      fill: '#0088FE',
      description: 'Перевірка та пакування'
    },
    { 
      stage: 'Готово до відвантаження', 
      days: totalAvg.toFixed(1),
      percentage: 55,
      fill: '#8884d8',
      description: `Загальний час: ${totalAvg.toFixed(1)} дн`
    }
  ];

  const CustomLabel = ({ x, y, width, value, index }) => {
    const data = funnelData[index];
    return (
      <g>
        <text 
          x={x + width / 2} 
          y={y + 20} 
          fill="#1a1d23" 
          textAnchor="middle" 
          fontSize={14}
          fontWeight={700}
        >
          {data.stage}
        </text>
        <text 
          x={x + width / 2} 
          y={y + 40} 
          fill="#666" 
          textAnchor="middle" 
          fontSize={12}
        >
          {data.description}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    
    return (
      <div className="funnel-tooltip">
        <div className="tooltip-title">{data.stage}</div>
        <div className="tooltip-desc">{data.description}</div>
        {data.days > 0 && (
          <div className="tooltip-value">Час на етапі: <strong>{data.days} дн</strong></div>
        )}
      </div>
    );
  };

  return (
    <div className="funnel-container">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={funnelData}
          margin={{ top: 20, right: 40, left: 40, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="stage" hide />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="percentage" 
            radius={[8, 8, 8, 8]}
            barSize={80}
          >
            {funnelData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList content={<CustomLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Статистика знизу */}
      <div className="funnel-stats">
        <div className="stat-item">
          <span className="stat-label">Середня черга:</span>
          <span className="stat-value text-amber">{avgQueueDays.toFixed(1)} дн</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Чисте виробництво:</span>
          <span className="stat-value text-green">{avgProdDays.toFixed(1)} дн</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Загальний час:</span>
          <span className="stat-value text-blue">{totalAvg.toFixed(1)} дн</span>
        </div>
      </div>

      <style jsx>{`
        .funnel-container {
          width: 100%;
          padding: 20px 0;
        }

        .funnel-tooltip {
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: none;
          max-width: 250px;
        }

        .tooltip-title {
          font-weight: 700;
          font-size: 13px;
          color: #1a1d23;
          margin-bottom: 6px;
        }

        .tooltip-desc {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }

        .tooltip-value {
          font-size: 12px;
          color: #999;
        }

        .tooltip-value strong {
          color: #0088FE;
          font-weight: 700;
        }

        .funnel-stats {
          display: flex;
          justify-content: space-around;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          margin-top: 20px;
          gap: 16px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 800;
        }

        .text-amber {
          color: #FFBB28;
        }

        .text-green {
          color: #00C49F;
        }

        .text-blue {
          color: #0088FE;
        }

        @media (max-width: 768px) {
          .funnel-stats {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}