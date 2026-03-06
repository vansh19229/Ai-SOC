'use client';
import { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import AIChat from '@/components/AIChat';
import { getIncidents, updateIncident, aiReport } from '@/lib/api';

type TimelineEntry = { time: string; event: string };

type Incident = {
  id: string;
  title: string;
  type: string;
  severity: string;
  timestamp: string;
  status: string;
  affected_systems: string[];
  source_ip: string;
  description: string;
  assigned_to: string | null;
  resolved_at: string | null;
  timeline: TimelineEntry[];
  report: string | null;
};

const severityColors: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6',
};
const statusColors: Record<string, string> = {
  open: '#ef4444', investigating: '#f97316', contained: '#eab308', resolved: '#00ff88',
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    getIncidents().then(d => setIncidents(d.items));
  }, []);

  const generateReport = async (inc: Incident) => {
    setGeneratingReport(inc.id);
    const res = await aiReport({ incident_id: inc.id, incident_data: inc });
    const updated = { ...inc, report: res.report };
    await updateIncident(inc.id, { report: res.report });
    setIncidents(prev => prev.map(i => i.id === inc.id ? updated : i));
    setGeneratingReport(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Incident Response</h1>
          <p className="text-sm mt-1" style={{ color: '#8892a4' }}>{incidents.length} incidents total</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
        >
          <Plus size={16} /> New Incident
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {['open', 'investigating', 'contained', 'resolved'].map(s => (
          <div key={s} className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: '#161b27', border: `1px solid ${statusColors[s]}33` }}>
            <span className="text-sm font-medium capitalize" style={{ color: statusColors[s] }}>{s}</span>
            <span className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
              {incidents.filter(i => i.status === s).length}
            </span>
          </div>
        ))}
      </div>

      {/* Incident list */}
      <div className="space-y-4">
        {incidents.map(inc => (
          <div key={inc.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: `1px solid ${severityColors[inc.severity]}44` }}>
            <div
              className="flex items-start justify-between p-5 cursor-pointer"
              onClick={() => setExpanded(expanded === inc.id ? null : inc.id)}
            >
              <div className="flex items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${severityColors[inc.severity]}22`, color: severityColors[inc.severity] }}>
                      {inc.severity}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded capitalize" style={{ backgroundColor: `${statusColors[inc.status]}22`, color: statusColors[inc.status] }}>
                      {inc.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1e2739', color: '#8892a4' }}>{inc.type}</span>
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>{inc.title}</h3>
                  <p className="text-xs mt-1" style={{ color: '#8892a4' }}>
                    {inc.id} · {timeAgo(inc.timestamp)} · Assigned: {inc.assigned_to || 'Unassigned'}
                  </p>
                </div>
              </div>
              {expanded === inc.id ? <ChevronUp size={18} style={{ color: '#8892a4' }} /> : <ChevronDown size={18} style={{ color: '#8892a4' }} />}
            </div>

            {expanded === inc.id && (
              <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #1e2739' }}>
                <p className="text-sm pt-4" style={{ color: '#8892a4' }}>{inc.description}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#8892a4' }}>Affected Systems</p>
                    <div className="flex flex-wrap gap-2">
                      {inc.affected_systems.map(s => (
                        <span key={s} className="text-xs px-2 py-1 rounded font-mono" style={{ backgroundColor: '#1e2739', color: '#06b6d4' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#8892a4' }}>Timeline</p>
                    <div className="space-y-2">
                      {inc.timeline.map((t, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="shrink-0 font-mono" style={{ color: '#8892a4' }}>{new Date(t.time).toLocaleTimeString()}</span>
                          <span style={{ color: '#e2e8f0' }}>{t.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {inc.report && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: '#0d1117', border: '1px solid #00ff8833' }}>
                    <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#00ff88' }}>AI Report</p>
                    <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#e2e8f0' }}>{inc.report}</p>
                  </div>
                )}

                <button
                  onClick={() => generateReport(inc)}
                  disabled={generatingReport === inc.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
                >
                  {generatingReport === inc.id ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#00ff88', borderTopColor: 'transparent' }} />
                      Generating...
                    </>
                  ) : (
                    <><Brain size={16} /> Generate AI Report</>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <AIChat />
    </div>
  );
}
