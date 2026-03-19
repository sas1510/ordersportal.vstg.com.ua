import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useMemo } from 'react';

export default function ABCAnalysisChart({ data }) {
  // ABC Аналіз: A - 80% виручки (20% товарів), B - 15%, C - 5%
  
  const abcData = useMemo(() => {
    // Обчислюємо приблизну виручку для кожного товару
    const withRevenue = data
      .filter(item => item.ConstructionTypeName_UA !== '--- УСЬОГО ---')
      .map(item => ({
        name: item.ConstructionTypeName_UA,
        revenue: item.TotalQuantity * 20000, // Приблизна виручка
        orders: item.UniqueOrdersCount,
        quantity: item.TotalQuantity
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Обчислюємо кумулятивний відсоток
    const totalRevenue = withRevenue.reduce((sum, item) => sum + item.revenue, 0);
    let cumulative = 0;
    
    const result = withRevenue.map((item, index) => {
      cumulative += item.revenue;
      const cumulativePercent = (cumulative / totalRevenue) * 100;
      
      let category = 'C';
      if (cumulativePercent <= 80) category = 'A';
      else if (cumulativePercent <= 95) category = 'B';
      
      return {
        ...item,
        cumulativePercent: parseFloat(cumulativePercent.toFixed(2)),
        category,
        displayName: item.name.length > 25 ? item.name.slice(0, 22) + '...' : item.name
      };
    });

    return result.slice(0, 15); // Показуємо топ-15
  }, [data]);

  // Підрахунок статистики ABC
  const stats = useMemo(() => {
    const total = abcData.reduce((sum, item) => sum + item.revenue, 0);
    const countA = abcData.filter(i => i.category === 'A').length;
    const countB = abcData.filter(i => i.category === 'B').length;
    const countC = abcData.filter(i => i.category === 'C').length;
    
    const revenueA = abcData.filter(i => i.category === 'A').reduce((s, i) => s + i.revenue, 0);
    const revenueB = abcData.filter(i => i.category === 'B').reduce((s, i) => s + i.revenue, 0);
    const revenueC = abcData.filter(i => i.category === 'C').reduce((s, i) => s + i.revenue, 0);

    return {
      A: { count: countA, revenue: revenueA, percent: ((revenueA / total) * 100).toFixed(1) },
      B: { count: countB, revenue: revenueB, percent: ((revenueB / total) * 100).toFixed(1) },
      C: { count: countC, revenue: revenueC, percent: ((revenueC / total) * 100).toFixed(1) }
    };
  }, [abcData]);

  const getCategoryColor = (category) => {
    switch(category) {
      case 'A': return '#00C49F'; // Зелений
      case 'B': return '#FFBB28'; // Жовтий
      case 'C': return '#FF8042'; // Червоний
      default: return '#8884d8';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    
    return (
      <div className="abc-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-title">{data.name}</span>
          <span className={`category-badge cat-${data.category}`}>{data.category}</span>
        </div>
        <div className="tooltip-body">
          <div className="tooltip-row">
            <span>Виручка:</span>
            <strong>{(data.revenue / 1000000).toFixed(2)}M грн</strong>
          </div>
          <div className="tooltip-row">
            <span>Кумулятивно:</span>
            <strong>{data.cumulativePercent}%</strong>
          </div>
          <div className="tooltip-row">
            <span>Замовлень:</span>
            <strong>{data.orders}</strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="abc-container">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={abcData}
          margin={{ top: 20, right: 30, bottom: 60, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="displayName" 
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 10 }}
          />
          
          <YAxis 
            yAxisId="left"
            orientation="left"
            label={{ value: 'Виручка (млн грн)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            label={{ value: 'Кумулятивний %', angle: 90, position: 'insideRight' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Bar 
            yAxisId="left"
            dataKey="revenue" 
            name="Виручка"
            radius={[8, 8, 0, 0]}
          >
            {abcData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
            ))}
          </Bar>
          
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="cumulativePercent" 
            stroke="#FF6B6B"
            strokeWidth={3}
            name="Кумулятивний %"
            dot={{ r: 5, fill: '#FF6B6B' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Статистика ABC */}
      <div className="abc-stats">
        <div className="stat-card cat-A">
          <div className="stat-header">
            <span className="stat-badge">Категорія A</span>
            <span className="stat-count">{stats.A.count} товарів</span>
          </div>
          <div className="stat-value">{stats.A.percent}% виручки</div>
          <div className="stat-desc">Найприбутковіші продукти</div>
        </div>

        <div className="stat-card cat-B">
          <div className="stat-header">
            <span className="stat-badge">Категорія B</span>
            <span className="stat-count">{stats.B.count} товарів</span>
          </div>
          <div className="stat-value">{stats.B.percent}% виручки</div>
          <div className="stat-desc">Середня прибутковість</div>
        </div>

        <div className="stat-card cat-C">
          <div className="stat-header">
            <span className="stat-badge">Категорія C</span>
            <span className="stat-count">{stats.C.count} товарів</span>
          </div>
          <div className="stat-value">{stats.C.percent}% виручки</div>
          <div className="stat-desc">Низька прибутковість</div>
        </div>
      </div>

      <style jsx>{`
        .abc-container {
          width: 100%;
          padding: 20px 0;
        }

        .abc-tooltip {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border: none;
          min-width: 200px;
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

        .category-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          color: white;
        }

        .cat-A { background: #00C49F; }
        .cat-B { background: #FFBB28; }
        .cat-C { background: #FF8042; }

        .tooltip-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
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

        .abc-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
        }

        .stat-card {
          padding: 16px;
          border-radius: 12px;
          border: 2px solid;
        }

        .stat-card.cat-A { 
          border-color: #00C49F; 
          background: linear-gradient(135deg, rgba(0, 196, 159, 0.05) 0%, rgba(0, 196, 159, 0.1) 100%);
        }
        .stat-card.cat-B { 
          border-color: #FFBB28; 
          background: linear-gradient(135deg, rgba(255, 187, 40, 0.05) 0%, rgba(255, 187, 40, 0.1) 100%);
        }
        .stat-card.cat-C { 
          border-color: #FF8042; 
          background: linear-gradient(135deg, rgba(255, 128, 66, 0.05) 0%, rgba(255, 128, 66, 0.1) 100%);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .stat-badge {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-card.cat-A .stat-badge { color: #00C49F; }
        .stat-card.cat-B .stat-badge { color: #FFBB28; }
        .stat-card.cat-C .stat-badge { color: #FF8042; }

        .stat-count {
          font-size: 11px;
          color: #666;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #1a1d23;
          margin-bottom: 4px;
        }

        .stat-desc {
          font-size: 11px;
          color: #666;
        }

        @media (max-width: 768px) {
          .abc-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}