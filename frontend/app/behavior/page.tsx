'use client';
import { useEffect, useState } from 'react';
import { Users, UserX, AlertCircle, Clock } from 'lucide-react';
import AIChat from '@/components/AIChat';
import { getUsers } from '@/lib/api';

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  last_login: string;
  status: string;
  location: string;
  department: string;
};

const roleColors: Record<string, string> = {
  admin: '#ef4444',
  analyst: '#00ff88',
  viewer: '#3b82f6',
};

const statusColors: Record<string, string> = {
  active: '#00ff88',
  suspended: '#ef4444',
  inactive: '#8892a4',
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const anomalyEvents = [
  { user: 'jsmith', event: 'Login from unknown location (Unknown Country)', risk: 'high', time: '2m ago' },
  { user: 'jsmith', event: 'Privilege escalation attempt via CVE-2023-4911', risk: 'critical', time: '5m ago' },
  { user: 'backup_svc', event: 'SSH login after brute force campaign', risk: 'critical', time: '15m ago' },
  { user: 'analyst1', event: 'Accessed 45 sensitive records in 2 minutes', risk: 'medium', time: '32m ago' },
  { user: 'jdoe', event: 'Mass file access on shared drive (ransomware pattern)', risk: 'critical', time: '1h ago' },
];

const riskColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

export default function BehaviorPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getUsers().then(d => setUsers(d.items));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>User Behavior Analytics</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>Monitor user activities and detect anomalous behavior</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#161b27', border: '1px solid #00ff8833' }}>
          <Users size={22} style={{ color: '#00ff88' }} />
          <div>
            <p className="text-xs" style={{ color: '#8892a4' }}>Total Users</p>
            <p className="text-xl font-bold" style={{ color: '#e2e8f0' }}>{users.length}</p>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#161b27', border: '1px solid #00ff8833' }}>
          <Users size={22} style={{ color: '#3b82f6' }} />
          <div>
            <p className="text-xs" style={{ color: '#8892a4' }}>Active</p>
            <p className="text-xl font-bold" style={{ color: '#e2e8f0' }}>{users.filter(u => u.status === 'active').length}</p>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#161b27', border: '1px solid #ef444433' }}>
          <UserX size={22} style={{ color: '#ef4444' }} />
          <div>
            <p className="text-xs" style={{ color: '#8892a4' }}>Suspended</p>
            <p className="text-xl font-bold" style={{ color: '#e2e8f0' }}>{users.filter(u => u.status === 'suspended').length}</p>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#161b27', border: '1px solid #f9731633' }}>
          <AlertCircle size={22} style={{ color: '#f97316' }} />
          <div>
            <p className="text-xs" style={{ color: '#8892a4' }}>Anomalies</p>
            <p className="text-xl font-bold" style={{ color: '#e2e8f0' }}>{anomalyEvents.length}</p>
          </div>
        </div>
      </div>

      {/* Anomaly Events */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Recent Anomaly Events</h2>
        <div className="space-y-3">
          {anomalyEvents.map((ev, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#0d1117', border: `1px solid ${riskColors[ev.risk]}33` }}>
              <AlertCircle size={16} style={{ color: riskColors[ev.risk], marginTop: 2, flexShrink: 0 }} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${riskColors[ev.risk]}22`, color: riskColors[ev.risk] }}>{ev.risk}</span>
                  <span className="font-mono text-xs" style={{ color: '#06b6d4' }}>{ev.user}</span>
                </div>
                <p className="text-sm" style={{ color: '#e2e8f0' }}>{ev.event}</p>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#8892a4' }}>
                <Clock size={12} />
                {ev.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>User Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #1e2739' }}>
                {['Username', 'Email', 'Role', 'Department', 'Last Login', 'Location', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr
                  key={u.id}
                  style={{ borderBottom: '1px solid #1e273844' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e273944')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#e2e8f0' }}>{u.username}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded capitalize" style={{ backgroundColor: `${roleColors[u.role]}22`, color: roleColors[u.role] }}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{u.department}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{timeAgo(u.last_login)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{u.location}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded capitalize" style={{ backgroundColor: `${statusColors[u.status]}22`, color: statusColors[u.status] }}>{u.status}</span>
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
