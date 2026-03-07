'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal, Pause, Play, Trash2, Wifi, WifiOff } from 'lucide-react';

interface LogEntry {
  id?: string;
  level: string;
  source: string;
  message: string;
  timestamp: string;
  ip?: string;
  user?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  ERROR:    '#f97316',
  WARNING:  '#eab308',
  INFO:     '#3b82f6',
  DEBUG:    '#8892a4',
};

const LEVEL_BG: Record<string, string> = {
  CRITICAL: '#ef444422',
  ERROR:    '#f9731622',
  WARNING:  '#eab30822',
  INFO:     '#3b82f622',
  DEBUG:    '#1e2739',
};

const ALL_LEVELS = ['CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'];
const ALL_SOURCES = ['firewall', 'auth', 'web_server', 'network', 'endpoint'];

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws');

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

export default function RealtimeLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pausedRef = useRef(false);
  const pendingRef = useRef<LogEntry[]>([]);

  pausedRef.current = paused;

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const params = new URLSearchParams();
    if (levelFilter) params.set('level', levelFilter);
    if (sourceFilter) params.set('source', sourceFilter);
    const url = `${WS_BASE}/api/ws/logs${params.toString() ? '?' + params.toString() : ''}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 3s
        setTimeout(connect, 3000);
      };
      ws.onerror = () => setConnected(false);
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'ping') return;
          const log = data as LogEntry;
          if (pausedRef.current) {
            pendingRef.current.push(log);
            return;
          }
          setLogs(prev => [log, ...prev].slice(0, 500));
        } catch {
          // ignore parse errors
        }
      };
    } catch {
      setConnected(false);
    }
  }, [levelFilter, sourceFilter]);

  // Reconnect when filters change
  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  // Auto-scroll
  useEffect(() => {
    if (!paused && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, paused]);

  const handlePauseToggle = () => {
    if (paused) {
      // Resume: flush pending
      const pending = pendingRef.current.splice(0);
      if (pending.length) {
        setLogs(prev => [...pending.reverse(), ...prev].slice(0, 500));
      }
    }
    setPaused(p => !p);
  };

  const clearLogs = () => {
    setLogs([]);
    pendingRef.current = [];
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          {connected
            ? <Wifi size={14} style={{ color: '#00ff88' }} />
            : <WifiOff size={14} style={{ color: '#ef4444' }} />}
          <span className="text-xs font-medium" style={{ color: connected ? '#00ff88' : '#ef4444' }}>
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Log count */}
        <div className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739', color: '#8892a4' }}>
          <span style={{ color: '#e2e8f0' }}>{logs.length}</span> entries
          {paused && pendingRef.current.length > 0 && (
            <span style={{ color: '#eab308' }}> (+{pendingRef.current.length} buffered)</span>
          )}
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-1">
          {ALL_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setLevelFilter(f => f === level ? '' : level)}
              className="text-xs px-2 py-1 rounded font-mono font-bold transition-all"
              style={{
                backgroundColor: levelFilter === level ? `${LEVEL_COLORS[level]}33` : '#161b27',
                color: levelFilter === level ? LEVEL_COLORS[level] : '#8892a4',
                border: `1px solid ${levelFilter === level ? LEVEL_COLORS[level] + '66' : '#1e2739'}`,
              }}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg outline-none"
          style={{ backgroundColor: '#161b27', color: '#e2e8f0', border: '1px solid #1e2739' }}
        >
          <option value="">All Sources</option>
          {ALL_SOURCES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex-1" />

        {/* Controls */}
        <button
          onClick={handlePauseToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: paused ? '#eab30822' : '#1e2739', color: paused ? '#eab308' : '#8892a4', border: `1px solid ${paused ? '#eab30844' : '#1e2739'}` }}
        >
          {paused ? <Play size={12} /> : <Pause size={12} />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={clearLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Terminal */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto rounded-xl p-4 font-mono text-xs"
        style={{
          backgroundColor: '#060b14',
          border: '1px solid #1e2739',
          minHeight: 400,
          maxHeight: 600,
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e2739 transparent',
        }}
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <Terminal size={32} style={{ color: '#1e2739' }} />
            <p className="text-sm" style={{ color: '#8892a4' }}>
              {connected ? 'Waiting for log entries...' : 'Connecting to log stream...'}
            </p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={log.id || `${log.timestamp}-${i}`}
              className="flex items-start gap-2 py-1 border-b"
              style={{ borderColor: '#1e273822' }}
            >
              {/* Level badge */}
              <span
                className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold uppercase"
                style={{
                  backgroundColor: LEVEL_BG[log.level] || '#1e2739',
                  color: LEVEL_COLORS[log.level] || '#8892a4',
                  minWidth: 60,
                  textAlign: 'center',
                }}
              >
                {log.level}
              </span>
              {/* Timestamp */}
              <span className="shrink-0 text-xs" style={{ color: '#8892a4', minWidth: 68 }}>
                {formatTime(log.timestamp)}
              </span>
              {/* Source */}
              <span className="shrink-0 text-xs" style={{ color: '#06b6d4', minWidth: 80 }}>
                [{log.source}]
              </span>
              {/* Message */}
              <span className="flex-1 break-all" style={{ color: LEVEL_COLORS[log.level] || '#e2e8f0', opacity: log.level === 'DEBUG' ? 0.6 : 0.9 }}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
