'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, Download } from 'lucide-react';
import AIChat from '@/components/AIChat';
import { getLogs, aiAnalyze } from '@/lib/api';

type LogEntry = {
  id: string;
  source: string;
  level: string;
  message: string;
  timestamp: string;
  ip?: string | null;
  user?: string | null;
  details: Record<string, unknown>;
};

const levelColors: Record<string, string> = {
  CRITICAL: '#ef4444',
  ERROR: '#f97316',
  WARNING: '#eab308',
  INFO: '#3b82f6',
  DEBUG: '#8892a4',
};

const LEVELS = ['', 'CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'];

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const data = await getLogs({ limit: 50, level });
    setLogs(data.items);
    setLoading(false);
  }, [level]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = search
    ? logs.filter(l =>
        l.message.toLowerCase().includes(search.toLowerCase()) ||
        l.source.toLowerCase().includes(search.toLowerCase()) ||
        (l.ip || '').includes(search)
      )
    : logs;

  const analyzeLog = async (log: LogEntry) => {
    setSelected(log);
    setAnalysis('');
    setAnalyzing(true);
    const res = await aiAnalyze({ log_data: `[${log.level}] ${log.source}: ${log.message}` });
    setAnalysis(res.analysis);
    setAnalyzing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Log Management</h1>
          <p className="text-sm mt-1" style={{ color: '#8892a4' }}>{filteredLogs.length} log entries</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#1e2739', color: '#8892a4', border: '1px solid #1e2739' }}
        >
          <Download size={16} /> Export
        </button>
      </div>

      {/* Level counts */}
      <div className="flex flex-wrap gap-3">
        {LEVELS.filter(Boolean).map(l => (
          <div
            key={l}
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
            style={{
              backgroundColor: level === l ? `${levelColors[l]}22` : '#161b27',
              border: `1px solid ${level === l ? levelColors[l] : '#1e2739'}`,
            }}
            onClick={() => setLevel(level === l ? '' : l)}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelColors[l] }} />
            <span className="text-xs font-bold uppercase" style={{ color: levelColors[l] }}>{l}</span>
            <span className="text-xs" style={{ color: '#8892a4' }}>{logs.filter(lg => lg.level === l).length}</span>
          </div>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #1e2739' }}>
          <Search size={14} style={{ color: '#8892a4' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#e2e8f0' }}
          />
        </div>
        <select
          value={level}
          onChange={e => setLevel(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: '#0d1117', color: '#e2e8f0', border: '1px solid #1e2739' }}
        >
          {LEVELS.map(l => <option key={l} value={l}>{l || 'All Levels'}</option>)}
        </select>
      </div>

      {/* Log entries */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="font-mono text-xs" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-12" style={{ color: '#8892a4' }}>Loading logs...</div>
          ) : filteredLogs.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors"
              style={{ borderBottom: '1px solid #1e273844' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e273444')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => analyzeLog(log)}
            >
              <span className="shrink-0 w-16 text-right text-xs" style={{ color: '#8892a4' }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span
                className="shrink-0 w-16 text-center text-xs font-bold uppercase px-1 rounded"
                style={{ backgroundColor: `${levelColors[log.level]}22`, color: levelColors[log.level] }}
              >
                {log.level}
              </span>
              <span className="shrink-0 w-20 text-xs" style={{ color: '#8892a4' }}>{log.source}</span>
              {log.ip && <span className="shrink-0 w-28 text-xs" style={{ color: '#06b6d4' }}>{log.ip}</span>}
              <span className="flex-1 text-xs truncate" style={{ color: '#e2e8f0' }}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis panel */}
      {selected && (
        <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #00ff8833' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#00ff88' }}>AI Log Analysis</h3>
            <button onClick={() => setSelected(null)} className="text-xs" style={{ color: '#8892a4' }}>✕ Close</button>
          </div>
          <div className="rounded-lg p-3 mb-3 font-mono text-xs" style={{ backgroundColor: '#0d1117', color: '#e2e8f0' }}>
            [{selected.level}] {selected.source}: {selected.message}
          </div>
          {analyzing ? (
            <div className="flex items-center gap-2" style={{ color: '#8892a4' }}>
              <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#00ff88', borderTopColor: 'transparent' }} />
              Analyzing log entry...
            </div>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>{analysis}</p>
          )}
        </div>
      )}

      <AIChat />
    </div>
  );
}
