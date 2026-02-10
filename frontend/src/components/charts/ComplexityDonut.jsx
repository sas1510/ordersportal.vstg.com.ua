import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", 
  "#82ca9d", "#58deff", "#8ac1ff", "#7ED321", "#D0021B", 
  "#d8af6d", "#BD10E0", "#9013FE", "#50E3C2", "#B8E986"
];

export default function ComplexityDonut({ data, onSectorClick, isDetail }) {
  const total = useMemo(() => data.reduce((s, i) => s + i.value, 0), [data]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const percentage = ((payload[0].value / total) * 100).toFixed(1);
    
    return (
      <div className="donut-tooltip">
        <div className="tooltip-title">{payload[0].name}</div>
        <div className="tooltip-body">
          <div className="tooltip-row">
            <span>Кількість:</span>
            <strong>{payload[0].value.toLocaleString()} шт</strong>
          </div>
          <div className="tooltip-row">
            <span>Частка:</span>
            <strong>{percentage}%</strong>
          </div>
        </div>
      </div>
    );
  };

  // Функція для малювання ліній (тільки для головного екрану, де НЕ суцільний круг)
  const renderCustomizedLabel = (props) => {
    if (isDetail) return null; // Прибираємо лінії в деталях

    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value } = props;
    if (percent < 0.02) return null;

    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#d1d5db" fill="none" />
        <circle cx={ex} cy={ey} r={2} fill="#9ca3af" stroke="none" />
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 12} 
          y={ey} 
          textAnchor={textAnchor} 
          fill="#374151" 
          dominantBaseline="central"
          style={{ fontSize: '12px', fontWeight: 600 }}
        >
          {name}
        </text>
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 12} 
          y={ey + 18} 
          textAnchor={textAnchor} 
          fill="#9ca3af" 
          dominantBaseline="central"
          style={{ fontSize: '11px' }}
        >
          {`${value.toLocaleString()} шт (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  return (
    <div className="donut-wrapper" style={{ width: '100%', height: isDetail ? 400 : 550, position: 'relative' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy={isDetail ? "50%" : "45%"}
            innerRadius={isDetail ? 0 : 100} 
            outerRadius={isDetail ? 140 : 160}
            paddingAngle={isDetail ? 0 : 2}
            stroke="#fff"
            strokeWidth={2}
            onClick={(d) => onSectorClick && onSectorClick(d.name)}
            cursor={onSectorClick ? "pointer" : "default"}
            label={isDetail ? false : renderCustomizedLabel} 
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                style={{ outline: 'none' }}
              />
            ))}
          </Pie>
          
          {/* Додаємо wrapperStyle з високим zIndex */}
          <Tooltip 
            content={<CustomTooltip />} 
            wrapperStyle={{ zIndex: 1000 }} 
          />
          
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center" 
            iconType="circle"
            wrapperStyle={{ paddingTop: isDetail ? 10 : 40 }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {!isDetail && (
        <div className="donut-center-badge" style={{ top: '40%' }}>
          <div className="badge-label">Всього за рік</div>
          <div className="badge-value">{total.toLocaleString()}</div>
          <div className="badge-unit">одиниць</div>
        </div>
      )}

      <style jsx>{`
        .donut-wrapper { position: relative; animation: fadeIn 0.6s ease-out; }
        
        .donut-center-badge {
          position: absolute;
          left: 50%;
          /* Ставимо z-index нижче, ніж у тултіпа */
          z-index: 1; 
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
          background: white;
          padding: 24px 28px;
          border-radius: 50%;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        /* Стилі для кастомного тултіпа */
        .donut-tooltip { 
          background: white; 
          padding: 16px; 
          border-radius: 12px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
          border: 1px solid #f0f0f0;
          position: relative;
          /* Гарантуємо, що вміст тултіпа теж має високий пріоритет */
          z-index: 1001; 
        }

        .badge-value { font-size: 32px; font-weight: 900; color: #1a1d23; }
        .tooltip-title { font-weight: 800; font-size: 14px; color: #1a1d23; margin-bottom: 12px; }
      `}</style>
    </div>
  );
}