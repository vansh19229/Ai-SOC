'use client';
import { motion } from 'framer-motion';

interface Alert {
  id: string;
  title: string;
  severity: string;
  source: string;
  timestamp: string;
  status: string;
  details: string;
  threat_id?: string | null;
  assigned_to?: string | null;
}

const severityConfig: Record<string, { color: string; bg: string; glow?: string }> = {
  critical: { color: '#ef4444', bg: '#ef444422', glow: '0 0 15px #ef444466' },
  high: { color: '#f97316', bg: '#f9731622', glow: undefined },
  medium: { color: '#eab308', bg: '#eab30822', glow: undefined },
  low: { color: '#3b82f6', bg: '#3b82f622', glow: undefined },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertCard({ alert }: { alert: Alert }) {
  const cfg = severityConfig[alert.severity] || severityConfig.low;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg p-4"
      style={{ backgroundColor: '#161b27', border: `1px solid ${cfg.color}44`, boxShadow: cfg.glow }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-bold uppercase px-2 py-0.5 rounded"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {alert.severity}
          </span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1e2739', color: '#8892a4' }}>
            {alert.status}
          </span>
        </div>
        <span className="text-xs shrink-0" style={{ color: '#8892a4' }}>{timeAgo(alert.timestamp)}</span>
      </div>
      <p className="text-sm font-semibold mt-2" style={{ color: '#e2e8f0' }}>{alert.title}</p>
      <p className="text-xs mt-1 line-clamp-2" style={{ color: '#8892a4' }}>{alert.details}</p>
      <p className="text-xs mt-2 font-mono" style={{ color: '#8892a4' }}>Source: {alert.source}</p>
    </motion.div>
  );
}
