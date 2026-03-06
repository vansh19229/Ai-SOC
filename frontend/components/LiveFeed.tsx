'use client';
import { useState, useEffect } from 'react';
import { getLogs } from '@/lib/api';

interface LogEntry {
  id: string;
  source: string;
  level: string;
  message: string;
  timestamp: string;
  ip?: string | null;
  user?: string | null;
}

const levelColors: Record<string, string> = {
  CRITICAL: '#ef4444',
  ERROR: '#f97316',
  WARNING: '#eab308',
  INFO: '#3b82f6',
  DEBUG: '#8892a4',
};

export default function LiveFeed() {
  const [events, setEvents] = useState<LogEntry[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getLogs({ limit: 20 });
      setEvents(data.items.slice(0, 20));
    };
    fetchLogs();
    const id = setInterval(fetchLogs, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1e2739' }}>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00ff88' }} />
        <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Live Security Feed</span>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {events.map((e, i) => (
          <div
            key={`${e.id}-${i}`}
            className="flex items-start gap-3 px-4 py-2 transition-colors"
            style={{ borderBottom: '1px solid #1e273844' }}
            onMouseEnter={el => (el.currentTarget.style.backgroundColor = '#1e273444')}
            onMouseLeave={el => (el.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: levelColors[e.level] || '#8892a4' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs font-bold uppercase" style={{ color: levelColors[e.level] || '#8892a4' }}>{e.level}</span>
                <span className="text-xs" style={{ color: '#8892a4' }}>{e.source}</span>
                {e.ip && <span className="font-mono text-xs" style={{ color: '#06b6d4' }}>{e.ip}</span>}
              </div>
              <p className="text-xs truncate" style={{ color: '#e2e8f0' }}>{e.message}</p>
              <p className="text-xs" style={{ color: '#8892a4' }}>{new Date(e.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
