'use client';
import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Globe, Activity, Clock, Lock, Wifi, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import AlertCard from '@/components/AlertCard';
import ThreatTable from '@/components/ThreatTable';
import NetworkChart from '@/components/NetworkChart';
import ThreatDonut from '@/components/ThreatDonut';
import AttackBarChart from '@/components/AttackBarChart';
import SecurityScore from '@/components/SecurityScore';
import LiveFeed from '@/components/LiveFeed';
import AIChat from '@/components/AIChat';
import { getStats, getThreats, getAlerts, mockNetworkChartData, mockThreatDistribution, mockAttackSources } from '@/lib/api';

type Stats = {
  total_threats: number;
  active_alerts: number;
  blocked_ips: number;
  security_score: number;
  threats_today: number;
  incidents_open: number;
  network_anomalies: number;
  avg_response_time: number;
};

type Alert = {
  id: string;
  title: string;
  severity: string;
  source: string;
  timestamp: string;
  status: string;
  details: string;
  threat_id?: string | null;
  assigned_to?: string | null;
};

type Threat = {
  id: string;
  type: string;
  source_ip: string;
  target: string;
  severity: string;
  timestamp: string;
  description: string;
  status: string;
  confidence: number;
  details: Record<string, unknown>;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    getStats().then(setStats);
    getThreats({ limit: 6 }).then(d => setThreats(d.items.slice(0, 6)));
    getAlerts({ limit: 5 }).then(d => setAlerts(d.items.slice(0, 5)));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Threats" value={stats?.total_threats ?? 0} icon={Shield} color="#ef4444" trend={12} />
        <StatsCard title="Active Alerts" value={stats?.active_alerts ?? 0} icon={AlertTriangle} color="#f97316" trend={8} />
        <StatsCard title="Blocked IPs" value={stats?.blocked_ips ?? 0} icon={Globe} color="#06b6d4" trend={-3} />
        <StatsCard title="Threats Today" value={stats?.threats_today ?? 0} icon={TrendingUp} color="#eab308" trend={23} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Open Incidents" value={stats?.incidents_open ?? 0} icon={Lock} color="#8b5cf6" />
        <StatsCard title="Network Anomalies" value={stats?.network_anomalies ?? 0} icon={Wifi} color="#00ff88" />
        <StatsCard title="Avg Response Time" value={`${stats?.avg_response_time ?? 0}m`} icon={Clock} color="#3b82f6" subtitle="minutes" />
        <StatsCard title="Security Score" value={stats?.security_score ?? 0} icon={Activity} color="#00ff88" subtitle="/100" />
      </div>

      {/* Network Chart + Security Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Network Traffic (24h)</h2>
          <NetworkChart data={mockNetworkChartData} />
        </div>
        <div className="rounded-xl p-5 flex items-center justify-center" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          <SecurityScore score={stats?.security_score ?? 73} />
        </div>
      </div>

      {/* Threat Donut + Attack Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Threat Distribution</h2>
          <ThreatDonut data={mockThreatDistribution} />
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Top Attack Sources</h2>
          <AttackBarChart data={mockAttackSources} />
        </div>
      </div>

      {/* Recent Alerts + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
          </div>
        </div>
        <LiveFeed />
      </div>

      {/* Recent Threats Table */}
      <div>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Recent Threats</h2>
        <ThreatTable threats={threats} />
      </div>

      <AIChat />
    </div>
  );
}
