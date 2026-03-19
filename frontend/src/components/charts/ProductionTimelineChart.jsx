import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProductionTimelineChart({ data }) {
  // data очікується у форматі: 
  // { labels: ["Вікно", ...], queue_days: [8.8, ...], prod_days: [2.1, ...] }
  
  const chartData = data.labels.map((label, index) => ({
    name: label,
    queue: data.queue_days[index],
    production: data.prod_days[index],
    total: (data.queue_days[index] + data.prod_days[index]).toFixed(1)
  }));

  return (
    <div className="card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', height: '450px' }}>
      <h4 style={{ marginBottom: '20px' }}>Аналіз термінів: Черга vs Виробництво (дні)</h4>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" unit=" дн" />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            tick={{fontSize: 12}} 
          />
          <Tooltip 
            formatter={(value) => `${value} дн.`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="top" align="right" />
          
          {/* Час в черзі (очікування запуску) */}
          <Bar 
            name="Черга (до запуску)" 
            dataKey="queue" 
            stackId="a" 
            fill="#FFBB28" 
            radius={[0, 0, 0, 0]} 
          />
          
          {/* Чисте виробництво */}
          <Bar 
            name="Чисте виробництво" 
            dataKey="production" 
            stackId="a" 
            fill="#00C49F" 
            radius={[0, 4, 4, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}