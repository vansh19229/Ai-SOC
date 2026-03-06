'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ThreatDonutProps {
  data: { name: string; value: number; color: string }[];
}

export default function ThreatDonut({ data }: ThreatDonutProps) {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#161b27', border: '1px solid #1e2739', borderRadius: 8, color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ color: '#8892a4', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
