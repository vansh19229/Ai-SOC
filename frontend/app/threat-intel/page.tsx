'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Database, Shield, AlertTriangle, Activity, RefreshCw, X } from 'lucide-react';
import { getThreatIntel, getThreatIntelStats, checkIndicator, addIndicator } from '@/lib/api';
import { mockThreatIntel, mockThreatIntelStats } from '@/lib/mock-data';

type ThreatIntelEntry = typeof mockThreatIntel[0];
type Stats = typeof mockThreatIntelStats;

const TYPE_COLORS: Record<string, string> = {
  ip: '#3b82f6',
  domain: '#f97316',
  hash: '#8b5cf6',
  url: '#06b6d4',
};

const SOURCES = ['AlienVault OTX', 'VirusTotal', 'Shodan', 'MISP', 'ThreatFox', 'Internal', 'Recorded Future'];
const IOC_TYPES = ['ip', 'domain', 'hash', 'url'];

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? '#ef4444' : value >= 75 ? '#f97316' : value >= 50 ? '#eab308' : '#3b82f6';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e2739' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ThreatIntelPage() {
  const [entries, setEntries] = useState<ThreatIntelEntry[]>([]);
  const [stats, setStats] = useState<Stats>(mockThreatIntelStats);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [checkQuery, setCheckQuery] = useState('');
  const [checkResult, setCheckResult] = useState<{ found: boolean; indicator: ThreatIntelEntry | null } | null>(null);
  const [checking, setChecking] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'ip', value: '', threat_type: 'malware', confidence: 75, source: 'Internal', tags: '', description: '' });
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [feedData, statsData] = await Promise.all([
        getThreatIntel({ page, limit: 20, ioc_type: typeFilter || undefined, source: sourceFilter || undefined, search: search || undefined }),
        getThreatIntelStats(),
      ]);
      setEntries((feedData as { data: ThreatIntelEntry[] }).data || []);
      setTotal((feedData as { total: number }).total || 0);
      setPages((feedData as { pages: number }).pages || 1);
      setStats(statsData as unknown as Stats);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, sourceFilter, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCheck = async () => {
    if (!checkQuery.trim()) return;
    setChecking(true);
    try {
      const result = await checkIndicator(checkQuery.trim());
      setCheckResult(result as { found: boolean; indicator: ThreatIntelEntry | null });
    } finally {
      setChecking(false);
    }
  };

  const handleAdd = async () => {
    if (!newEntry.value.trim()) return;
    setAdding(true);
    try {
      await addIndicator({
        ...newEntry,
        tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
        confidence: Number(newEntry.confidence),
      } as Partial<ThreatIntelEntry>);
      setShowAdd(false);
      setNewEntry({ type: 'ip', value: '', threat_type: 'malware', confidence: 75, source: 'Internal', tags: '', description: '' });
      await loadData();
    } finally {
      setAdding(false);
    }
  };

  const inputStyle = { backgroundColor: '#0d1117', color: '#e2e8f0', border: '1px solid #1e2739' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Threat Intelligence</h1>
          <p className="text-sm mt-1" style={{ color: '#8892a4' }}>IOC database and threat indicator lookup</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
        >
          <Plus size={16} />
          Add Indicator
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total IOCs', value: stats.total, icon: Database, color: '#00ff88' },
          { label: 'High Confidence', value: stats.high_confidence, icon: Shield, color: '#ef4444' },
          { label: 'Active Sources', value: stats.active_sources, icon: Activity, color: '#f97316' },
          { label: 'IP Indicators', value: stats.by_type?.ip || 0, icon: AlertTriangle, color: '#3b82f6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#8892a4' }}>{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Check indicator */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#e2e8f0' }}>Check Indicator</h2>
        <div className="flex gap-3">
          <input
            value={checkQuery}
            onChange={e => { setCheckQuery(e.target.value); setCheckResult(null); }}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            placeholder="Enter IP, domain, hash, or URL..."
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono"
            style={inputStyle}
          />
          <button
            onClick={handleCheck}
            disabled={checking || !checkQuery.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
          >
            {checking ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            Check
          </button>
        </div>
        {checkResult && (
          <div
            className="mt-3 p-3 rounded-lg"
            style={{
              backgroundColor: checkResult.found ? '#ef444411' : '#00ff8811',
              border: `1px solid ${checkResult.found ? '#ef444433' : '#00ff8833'}`,
            }}
          >
            {checkResult.found && checkResult.indicator ? (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#ef4444' }}>
                  ⚠ Malicious indicator found in database
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span style={{ color: '#8892a4' }}>Type: </span><span style={{ color: TYPE_COLORS[checkResult.indicator.type] }}>{checkResult.indicator.type.toUpperCase()}</span></div>
                  <div><span style={{ color: '#8892a4' }}>Threat: </span><span style={{ color: '#e2e8f0' }}>{checkResult.indicator.threat_type}</span></div>
                  <div><span style={{ color: '#8892a4' }}>Source: </span><span style={{ color: '#e2e8f0' }}>{checkResult.indicator.source}</span></div>
                  <div><span style={{ color: '#8892a4' }}>Confidence: </span><span style={{ color: '#ef4444' }}>{checkResult.indicator.confidence}%</span></div>
                </div>
                {checkResult.indicator.description && (
                  <p className="text-xs mt-2" style={{ color: '#8892a4' }}>{checkResult.indicator.description}</p>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#00ff88' }}>
                ✓ Indicator not found in threat database – appears clean
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-lg" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          <Search size={14} style={{ color: '#8892a4' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search indicators..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: '#e2e8f0' }}
          />
          {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: '#8892a4' }} /></button>}
        </div>

        <div className="flex gap-1">
          {['', ...IOC_TYPES].map(type => (
            <button
              key={type || 'all'}
              onClick={() => { setTypeFilter(type); setPage(1); }}
              className="text-xs px-2.5 py-1.5 rounded font-medium transition-all"
              style={{
                backgroundColor: typeFilter === type ? `${TYPE_COLORS[type] || '#00ff88'}33` : '#161b27',
                color: typeFilter === type ? (TYPE_COLORS[type] || '#00ff88') : '#8892a4',
                border: `1px solid ${typeFilter === type ? (TYPE_COLORS[type] || '#00ff88') + '66' : '#1e2739'}`,
              }}
            >
              {type ? type.toUpperCase() : 'ALL'}
            </button>
          ))}
        </div>

        <select
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
          className="text-xs px-2.5 py-1.5 rounded-lg outline-none"
          style={{ backgroundColor: '#161b27', color: '#e2e8f0', border: '1px solid #1e2739' }}
        >
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* IOC Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
            Threat Indicators
            <span className="ml-2 text-xs font-normal" style={{ color: '#8892a4' }}>({total} total)</span>
          </h2>
          <button onClick={loadData} disabled={loading} style={{ color: '#8892a4' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #1e2739' }}>
                {['Type', 'Value', 'Threat Type', 'Confidence', 'Source', 'Tags', 'Last Seen'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: '#8892a4' }}>Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: '#8892a4' }}>No indicators found</td></tr>
              ) : entries.map((entry) => (
                <tr
                  key={entry.id}
                  style={{ borderBottom: '1px solid #1e273844' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e273944')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded uppercase"
                      style={{ backgroundColor: `${TYPE_COLORS[entry.type]}22`, color: TYPE_COLORS[entry.type] || '#8892a4' }}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs max-w-xs truncate" style={{ color: '#06b6d4' }}>{entry.value}</td>
                  <td className="px-4 py-3 text-xs capitalize" style={{ color: '#e2e8f0' }}>{entry.threat_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3"><ConfidenceBar value={entry.confidence} /></td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{entry.source}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(entry.tags || []).map((tag: string) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#ef444422', color: '#ef4444' }}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{timeAgo(entry.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1e2739' }}>
            <span className="text-xs" style={{ color: '#8892a4' }}>Page {page} of {pages} · {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="text-xs px-3 py-1 rounded disabled:opacity-30" style={{ backgroundColor: '#1e2739', color: '#8892a4' }}>Prev</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages} className="text-xs px-3 py-1 rounded disabled:opacity-30" style={{ backgroundColor: '#1e2739', color: '#8892a4' }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Indicator Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-xl p-6 space-y-4" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Add Custom Indicator</h3>
              <button onClick={() => setShowAdd(false)} style={{ color: '#8892a4' }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'value', label: 'Indicator Value', placeholder: 'IP, domain, hash, or URL', type: 'text' },
                { key: 'description', label: 'Description', placeholder: 'Brief description of the threat...', type: 'text' },
                { key: 'tags', label: 'Tags (comma-separated)', placeholder: 'Malware, C2, Botnet', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#8892a4' }}>{label}</label>
                  <input type={type} value={(newEntry as Record<string, unknown>)[key] as string} onChange={e => setNewEntry(n => ({ ...n, [key]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#8892a4' }}>Type</label>
                  <select value={newEntry.type} onChange={e => setNewEntry(n => ({ ...n, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                    {IOC_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#8892a4' }}>Confidence ({newEntry.confidence}%)</label>
                  <input type="range" min={0} max={100} value={newEntry.confidence} onChange={e => setNewEntry(n => ({ ...n, confidence: Number(e.target.value) }))} className="w-full accent-green-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ backgroundColor: '#1e2739', color: '#8892a4' }}>Cancel</button>
              <button onClick={handleAdd} disabled={adding || !newEntry.value.trim()} className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}>
                {adding ? 'Adding...' : 'Add Indicator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
