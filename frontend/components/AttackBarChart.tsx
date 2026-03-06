'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AttackBarChartProps {
  data: { ip: string; count: number; country?: string }[];
}

export default function AttackBarChart({ data }: AttackBarChartProps) {
  const sliced = data.slice(0, 10);
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sliced} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2739" horizontal={false} />
          <XAxis type="number" stroke="#8892a4" tick={{ fill: '#8892a4', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="ip"
            stroke="#8892a4"
            tick={{ fill: '#06b6d4', fontSize: 11, fontFamily: 'monospace' }}
            width={95}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#161b27', border: '1px solid #1e2739', borderRadius: 8, color: '#e2e8f0' }}
          />
          <Bar dataKey="count" name="Attempts" radius={[0, 4, 4, 0]}>
            {sliced.map((_, i) => (
              <Cell key={i} fill={i < 3 ? '#ef4444' : i < 6 ? '#f97316' : '#eab308'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
