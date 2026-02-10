import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Label } from 'recharts';

const QUADRANT_COLORS = {
  star: '#00C49F',      // Зірки (high growth, high share)
  question: '#FFBB28',  // Знаки питання (high growth, low share)
  cow: '#0088FE',       // Корови (low growth, high share)
  dog: '#FF8042'        // Собаки (low growth, low share)
};

export default function BCGMatrixChart({ data }) {
  // data: { name, marketShare, growthRate, revenue, orders }
  
  // Визначаємо медіану для поділу квадрантів
  const medianShare = data.reduce((s, d) => s + d.marketShare, 0) / data.length;
  const medianGrowth = 0; // Нульове зростання як базова лінія

  const enrichedData = data.map(item => {
    let quadrant = 'dog';
    let color = QUADRANT_COLORS.dog;
    
    if (item.growthRate > medianGrowth && item.marketShare > medianShare) {
      quadrant = 'star';
      color = QUADRANT_COLORS.star;
    } else if (item.growthRate > medianGrowth && item.marketShare <= medianShare) {
      quadrant = 'question';
      color = QUADRANT_COLORS.question;
    } else if (item.growthRate <= medianGrowth && item.marketShare > medianShare) {
      quadrant = 'cow';
      color = QUADRANT_COLORS.cow;
    }
    
    return {
      ...item,
      quadrant,
      fill: color,
      // Розмір бульбашки пропорційний виручці
      size: Math.max(100, Math.min(1000, item.revenue / 1000))
    };
  });

  const getQuadrantLabel = (quadrant) => {
    switch(quadrant) {
      case 'star': return '⭐ Зірка';
      case 'question': return '❓ Знак питання';
      case 'cow': return '🐄 Корова';
      case 'dog': return '🐕 Собака';
      default: return '';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    
    return (
      <div className="bcg-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-title">{data.name}</span>
          <span className="quadrant-label" style={{ background: data.fill }}>
            {getQuadrantLabel(data.quadrant)}
          </span>
        </div>
        <div className="tooltip-body">
          <div className="tooltip-row">
            <span>Частка ринку:</span>
            <strong>{data.marketShare.toFixed(1)}%</strong>
          </div>
          <div className="tooltip-row">
            <span>Темп зростання:</span>
            <strong>{data.growthRate.toFixed(1)}%</strong>
          </div>
          <div className="tooltip-row">
            <span>Виручка:</span>
            <strong>{(data.revenue / 1000000).toFixed(1)}M грн</strong>
          </div>
          <div className="tooltip-row">
            <span>Замовлень:</span>
            <strong>{data.orders}</strong>
          </div>
        </div>
        <div className="tooltip-recommendation">
          {data.quadrant === 'star' && '💡 Інвестуйте та розвивайте'}
          {data.quadrant === 'cow' && '💡 Підтримуйте поточний рівень'}
          {data.quadrant === 'question' && '💡 Потребує аналізу: інвестувати чи закривати?'}
          {data.quadrant === 'dog' && '💡 Розгляньте можливість виходу'}
        </div>
      </div>
    );
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const radius = Math.sqrt(payload.size / Math.PI);
    
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={payload.fill}
          opacity={0.6}
          stroke="#fff"
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
        />
        {radius > 20 && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fontWeight={700}
            fill="#1a1d23"
          >
            {payload.name.slice(0, 10)}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="bcg-container">
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 40 }}>
          {/* Сітка квадрантів */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          
          {/* Осі */}
          <XAxis 
            type="number" 
            dataKey="marketShare" 
            name="Частка ринку"
            domain={[0, 'auto']}
            label={{ value: 'Частка ринку (%)', position: 'bottom', offset: 0 }}
            tick={{ fontSize: 12 }}
          />
          
          <YAxis 
            type="number" 
            dataKey="growthRate" 
            name="Темп зростання"
            label={{ value: 'Темп зростання (%)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          
          <ZAxis 
            type="number" 
            dataKey="size" 
            range={[100, 1000]} 
            name="Розмір"
          />
          
          {/* Лінії поділу квадрантів */}
          <ReferenceLine 
            x={medianShare} 
            stroke="#999" 
            strokeWidth={2}
            strokeDasharray="5 5"
          >
            <Label value="Медіана частки" position="top" fill="#666" fontSize={11} />
          </ReferenceLine>
          
          <ReferenceLine 
            y={medianGrowth} 
            stroke="#999" 
            strokeWidth={2}
            strokeDasharray="5 5"
          >
            <Label value="Нульове зростання" position="right" fill="#666" fontSize={11} />
          </ReferenceLine>
          
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          <Scatter 
            data={enrichedData} 
            shape={<CustomDot />}
          >
            {enrichedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Легенда квадрантів */}
      <div className="quadrants-legend">
        <div className="quadrant-card star">
          <div className="quadrant-icon">⭐</div>
          <div className="quadrant-info">
            <div className="quadrant-title">Зірки</div>
            <div className="quadrant-desc">Високе зростання + велика частка</div>
            <div className="quadrant-count">
              {enrichedData.filter(d => d.quadrant === 'star').length} продуктів
            </div>
          </div>
        </div>

        <div className="quadrant-card question">
          <div className="quadrant-icon">❓</div>
          <div className="quadrant-info">
            <div className="quadrant-title">Знаки питання</div>
            <div className="quadrant-desc">Високе зростання + мала частка</div>
            <div className="quadrant-count">
              {enrichedData.filter(d => d.quadrant === 'question').length} продуктів
            </div>
          </div>
        </div>

        <div className="quadrant-card cow">
          <div className="quadrant-icon">🐄</div>
          <div className="quadrant-info">
            <div className="quadrant-title">Грошові корови</div>
            <div className="quadrant-desc">Низьке зростання + велика частка</div>
            <div className="quadrant-count">
              {enrichedData.filter(d => d.quadrant === 'cow').length} продуктів
            </div>
          </div>
        </div>

        <div className="quadrant-card dog">
          <div className="quadrant-icon">🐕</div>
          <div className="quadrant-info">
            <div className="quadrant-title">Собаки</div>
            <div className="quadrant-desc">Низьке зростання + мала частка</div>
            <div className="quadrant-count">
              {enrichedData.filter(d => d.quadrant === 'dog').length} продуктів
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bcg-container {
          width: 100%;
          padding: 20px 0;
        }

        .bcg-tooltip {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border: none;
          min-width: 240px;
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f0f0f0;
        }

        .tooltip-title {
          font-weight: 700;
          font-size: 13px;
          color: #1a1d23;
        }

        .quadrant-label {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }

        .tooltip-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .tooltip-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }

        .tooltip-row strong {
          color: #1a1d23;
          font-weight: 700;
        }

        .tooltip-recommendation {
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 11px;
          color: #666;
          font-style: italic;
          margin-top: 8px;
        }

        .quadrants-legend {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 24px;
        }

        .quadrant-card {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          border: 2px solid;
          transition: all 0.2s ease;
        }

        .quadrant-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .quadrant-card.star {
          border-color: #00C49F;
          background: linear-gradient(135deg, rgba(0, 196, 159, 0.05) 0%, rgba(0, 196, 159, 0.1) 100%);
        }

        .quadrant-card.question {
          border-color: #FFBB28;
          background: linear-gradient(135deg, rgba(255, 187, 40, 0.05) 0%, rgba(255, 187, 40, 0.1) 100%);
        }

        .quadrant-card.cow {
          border-color: #0088FE;
          background: linear-gradient(135deg, rgba(0, 136, 254, 0.05) 0%, rgba(0, 136, 254, 0.1) 100%);
        }

        .quadrant-card.dog {
          border-color: #FF8042;
          background: linear-gradient(135deg, rgba(255, 128, 66, 0.05) 0%, rgba(255, 128, 66, 0.1) 100%);
        }

        .quadrant-icon {
          font-size: 32px;
          line-height: 1;
        }

        .quadrant-info {
          flex: 1;
        }

        .quadrant-title {
          font-size: 14px;
          font-weight: 800;
          color: #1a1d23;
          margin-bottom: 4px;
        }

        .quadrant-desc {
          font-size: 11px;
          color: #666;
          margin-bottom: 6px;
        }

        .quadrant-count {
          font-size: 12px;
          font-weight: 700;
          color: #0088FE;
        }

        @media (max-width: 768px) {
          .quadrants-legend {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}