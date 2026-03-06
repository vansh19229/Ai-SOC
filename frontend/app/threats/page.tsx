'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import ThreatTable from '@/components/ThreatTable';
import AIChat from '@/components/AIChat';
import { getThreats, aiAnalyze } from '@/lib/api';

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

const SEVERITIES = ['', 'critical', 'high', 'medium', 'low'];
const STATUSES = ['', 'active', 'investigating', 'resolved', 'false_positive'];

export default function ThreatsPage() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [analysisModal, setAnalysisModal] = useState<{ threat: Threat; result: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchThreats = useCallback(async () => {
    setLoading(true);
    const data = await getThreats({ page, limit: 10, severity, status });
    setThreats(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [page, severity, status]);

  useEffect(() => { fetchThreats(); }, [fetchThreats]);

  const handleAnalyze = async (threat: Threat) => {
    setAnalyzing(true);
    setAnalysisModal({ threat, result: '' });
    const res = await aiAnalyze({ text: `Threat: ${threat.type} from ${threat.source_ip} targeting ${threat.target}. ${threat.description}` });
    setAnalysisModal({ threat, result: res.analysis });
    setAnalyzing(false);
  };

  const filtered = search
    ? threats.filter(t =>
        t.type.toLowerCase().includes(search.toLowerCase()) ||
        t.source_ip.includes(search) ||
        t.target.toLowerCase().includes(search.toLowerCase())
      )
    : threats;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Threat Management</h1>
          <p className="text-sm mt-1" style={{ color: '#8892a4' }}>{total} threats detected</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
        >
          <Plus size={16} /> Add Threat
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #1e2739' }}>
          <Search size={14} style={{ color: '#8892a4' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search threats..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#e2e8f0' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: '#8892a4' }} />
          <select
            value={severity}
            onChange={e => { setSeverity(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: '#0d1117', color: '#e2e8f0', border: '1px solid #1e2739' }}
          >
            {SEVERITIES.map(s => <option key={s} value={s}>{s || 'All Severities'}</option>)}
          </select>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: '#0d1117', color: '#e2e8f0', border: '1px solid #1e2739' }}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>
      </div>

      {/* Severity counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Critical', color: '#ef4444', count: threats.filter(t => t.severity === 'critical').length },
          { label: 'High', color: '#f97316', count: threats.filter(t => t.severity === 'high').length },
          { label: 'Medium', color: '#eab308', count: threats.filter(t => t.severity === 'medium').length },
          { label: 'Low', color: '#3b82f6', count: threats.filter(t => t.severity === 'low').length },
        ].map(({ label, color, count }) => (
          <div key={label} className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: '#161b27', border: `1px solid ${color}33` }}>
            <span className="text-sm font-medium" style={{ color }}>{label}</span>
            <span className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{count}</span>
          </div>
        ))}
      </div>

      <ThreatTable
        threats={filtered}
        loading={loading}
        pagination={{ total, page, limit: 10 }}
        onPageChange={setPage}
        onAnalyze={handleAnalyze}
      />

      {/* Analysis Modal */}
      {analysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-6 max-w-lg w-full" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#e2e8f0' }}>AI Threat Analysis</h3>
            <p className="text-sm mb-4" style={{ color: '#8892a4' }}>{analysisModal.threat.type} — {analysisModal.threat.source_ip}</p>
            {analyzing ? (
              <div className="flex items-center gap-2 py-4" style={{ color: '#8892a4' }}>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#00ff88', borderTopColor: 'transparent' }} />
                Analyzing...
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>{analysisModal.result}</p>
            )}
            <button
              onClick={() => setAnalysisModal(null)}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#1e2739', color: '#e2e8f0' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <AIChat />
    </div>
  );
}
