'use client';
import { useEffect, useState } from 'react';
import NetworkChart from '@/components/NetworkChart';
import SeverityHeatmap from '@/components/SeverityHeatmap';
import AIChat from '@/components/AIChat';
import { getNetworkActivity, mockNetworkChartData } from '@/lib/api';

type NetActivity = {
  id: string;
  source_ip: string;
  dest_ip: string;
  protocol: string;
  port: number;
  bytes: number;
  timestamp: string;
  status: string;
};

const statusColors: Record<string, string> = {
  allowed: '#00ff88',
  blocked: '#ef4444',
  suspicious: '#eab308',
};

function formatBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)}GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)}MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)}KB`;
  return `${b}B`;
}

export default function NetworkPage() {
  const [activity, setActivity] = useState<NetActivity[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    getNetworkActivity({ limit: 20 }).then(d => setActivity(d.items));
  }, []);

  const filtered = statusFilter ? activity.filter(a => a.status === statusFilter) : activity;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Network Monitor</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>Real-time network traffic analysis</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Blocked', value: activity.filter(a => a.status === 'blocked').length, color: '#ef4444' },
          { label: 'Suspicious', value: activity.filter(a => a.status === 'suspicious').length, color: '#eab308' },
          { label: 'Allowed', value: activity.filter(a => a.status === 'allowed').length, color: '#00ff88' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: '#161b27', border: `1px solid ${color}33` }}>
            <span className="text-sm font-medium" style={{ color }}>{label}</span>
            <span className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Network traffic chart */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Network Traffic (24h)</h2>
        <NetworkChart data={mockNetworkChartData} />
      </div>

      {/* Severity heatmap */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Attack Intensity Heatmap</h2>
        <SeverityHeatmap />
      </div>

      {/* Activity table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Network Activity</h2>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: '#0d1117', color: '#e2e8f0', border: '1px solid #1e2739' }}
          >
            <option value="">All Status</option>
            <option value="blocked">Blocked</option>
            <option value="suspicious">Suspicious</option>
            <option value="allowed">Allowed</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #1e2739' }}>
                {['Source IP', 'Dest IP', 'Protocol', 'Port', 'Bytes', 'Time', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr
                  key={a.id}
                  style={{ borderBottom: '1px solid #1e273844' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e273944')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#06b6d4' }}>{a.source_ip}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#8892a4' }}>{a.dest_ip}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#e2e8f0' }}>{a.protocol}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{a.port}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#e2e8f0' }}>{formatBytes(a.bytes)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{new Date(a.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded capitalize"
                      style={{ backgroundColor: `${statusColors[a.status]}22`, color: statusColors[a.status] }}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AIChat />
    </div>
  );
}
