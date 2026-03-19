import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";

export default function FrequencyVolumeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          type="number" 
          dataKey="UniqueOrdersCount" 
          name="К-сть замовлень" 
          label={{ value: 'Унікальні замовлення', position: 'insideBottom', offset: -10 }}
        />
        <YAxis 
          type="number" 
          dataKey="TotalQuantity" 
          name="К-сть одиниць" 
          label={{ value: 'Загальна кількість шт', angle: -90, position: 'insideLeft' }}
        />
        <ZAxis range={[60, 400]} />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload;
              return (
                <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 'bold', margin: 0 }}>{d.ConstructionTypeName_UA}</p>
                  <p style={{ margin: 0 }}>Замовлень: {d.UniqueOrdersCount}</p>
                  <p style={{ margin: 0 }}>Штук: {d.TotalQuantity}</p>
                  <p style={{ fontSize: '11px', color: '#999' }}>{d["Складність_UA"]}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Scatter name="Продукція" data={data} fill="#8884d8" fillOpacity={0.6} stroke="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}