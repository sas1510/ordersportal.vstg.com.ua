import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export default function TopProductsChart({ data, metric = 'orders', onBarClick }) {
  // metric: 'orders', 'revenue', 'value', 'quantity'
  
  const getMetricValue = (item) => {
    switch(metric) {
      case 'revenue': return item.revenue || 0;
      case 'orders': return item.orders || item.uniqueOrders || 0;
      case 'quantity': return item.quantity || 0;
      case 'value': return item.value || 0;
      default: return item.orders || 0;
    }
  };

  const getMetricLabel = () => {
    switch(metric) {
      case 'revenue': return 'Виручка (тис. грн)';
      case 'orders': return 'Кількість замовлень';
      case 'quantity': return 'Кількість одиниць';
      case 'value': return 'Загальна кількість';
      default: return 'Значення';
    }
  };

  const formatValue = (value) => {
    if (metric === 'revenue') {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toLocaleString();
  };

  const chartData = data
    .map(item => ({
      ...item,
      metricValue: getMetricValue(item),
      displayName: item.name.length > 30 ? item.name.slice(0, 30) + '...' : item.name
    }))
    .sort((a, b) => b.metricValue - a.metricValue)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="custom-tooltip">
        <div className="tooltip-title">{data.name}</div>
        <div className="tooltip-value">
          {getMetricLabel()}: <strong>{formatValue(data.metricValue)}</strong>
        </div>
        {data.orders && metric !== 'orders' && (
          <div className="tooltip-secondary">Замовлень: {data.orders}</div>
        )}
        {data.quantity && metric !== 'quantity' && (
          <div className="tooltip-secondary">Одиниць: {data.quantity}</div>
        )}
      </div>
    );
  };

  return (
    <div className="top-products-chart">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            tick={{ fontSize: 12 }}
            tickFormatter={formatValue}
          />
          <YAxis 
            type="category" 
            dataKey="displayName" 
            width={150}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          <Bar 
            dataKey="metricValue" 
            radius={[0, 8, 8, 0]}
            onClick={onBarClick ? (data) => onBarClick(data.name) : undefined}
            cursor={onBarClick ? 'pointer' : 'default'}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <style jsx>{`
        .top-products-chart {
          width: 100%;
          height: 100%;
        }

        .custom-tooltip {
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: none;
        }

        .tooltip-title {
          font-weight: 700;
          font-size: 13px;
          color: #1a1d23;
          margin-bottom: 8px;
          max-width: 250px;
        }

        .tooltip-value {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .tooltip-value strong {
          color: #0088FE;
          font-weight: 700;
        }

        .tooltip-secondary {
          font-size: 11px;
          color: #999;
        }
      `}</style>
    </div>
  );
}