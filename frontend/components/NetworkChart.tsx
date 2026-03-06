'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface NetworkChartProps {
  data: { time: string; bytes_in: number; bytes_out: number; anomalies?: number }[];
}

export default function NetworkChart({ data }: NetworkChartProps) {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2739" />
          <XAxis dataKey="time" stroke="#8892a4" tick={{ fill: '#8892a4', fontSize: 11 }} />
          <YAxis stroke="#8892a4" tick={{ fill: '#8892a4', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#161b27', border: '1px solid #1e2739', borderRadius: 8, color: '#e2e8f0' }}
          />
          <Legend wrapperStyle={{ color: '#8892a4', fontSize: 12 }} />
          <Line type="monotone" dataKey="bytes_in" stroke="#00ff88" strokeWidth={2} dot={false} name="Bytes In (KB)" />
          <Line type="monotone" dataKey="bytes_out" stroke="#06b6d4" strokeWidth={2} dot={false} name="Bytes Out (KB)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
