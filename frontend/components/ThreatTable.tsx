'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Threat {
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
}

interface ThreatTableProps {
  threats: Threat[];
  loading?: boolean;
  pagination?: { total: number; page: number; limit: number };
  onPageChange?: (page: number) => void;
  onAnalyze?: (threat: Threat) => void;
}

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const statusColors: Record<string, string> = {
  active: '#ef4444',
  investigating: '#f97316',
  resolved: '#00ff88',
  false_positive: '#8892a4',
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ThreatTable({ threats, loading, pagination, onPageChange, onAnalyze }: ThreatTableProps) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2739', backgroundColor: '#0d1117' }}>
              {['Type', 'Source IP', 'Target', 'Severity', 'Confidence', 'Time', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12" style={{ color: '#8892a4' }}>Loading threats...</td>
              </tr>
            ) : threats.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12" style={{ color: '#8892a4' }}>No threats found</td>
              </tr>
            ) : threats.map((t) => (
              <tr
                key={t.id}
                style={{ borderBottom: '1px solid #1e273888' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e273944')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="px-4 py-3 font-medium" style={{ color: '#e2e8f0' }}>{t.type}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: '#06b6d4' }}>{t.source_ip}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{t.target}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-bold uppercase px-2 py-1 rounded"
                    style={{ backgroundColor: `${severityColors[t.severity]}22`, color: severityColors[t.severity] }}
                  >
                    {t.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e2739', width: 60 }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${t.confidence}%`, backgroundColor: severityColors[t.severity] || '#00ff88' }}
                      />
                    </div>
                    <span className="text-xs" style={{ color: '#8892a4' }}>{t.confidence}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{timeAgo(t.timestamp)}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded capitalize"
                    style={{ backgroundColor: `${statusColors[t.status]}22`, color: statusColors[t.status] }}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {onAnalyze && (
                    <button
                      onClick={() => onAnalyze(t)}
                      className="text-xs px-2 py-1 rounded font-medium transition-colors"
                      style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
                    >
                      Analyze
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1e2739' }}>
          <span className="text-xs" style={{ color: '#8892a4' }}>
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded disabled:opacity-30"
              style={{ color: '#8892a4' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs px-2" style={{ color: '#e2e8f0' }}>{pagination.page} / {totalPages}</span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="p-1 rounded disabled:opacity-30"
              style={{ color: '#8892a4' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
