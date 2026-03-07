'use client';
import { useState } from 'react';
import { X, Brain, AlertTriangle, Shield, Wrench, Eye, BarChart2, ChevronDown, ChevronRight, Copy, Check, Loader2 } from 'lucide-react';
import { explainThreat } from '@/lib/api';

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
}

interface ExplainResult {
  threat_type: string;
  explanation: string;
  technical_details: string;
  impact: string;
  mitigation: string;
  ioc_indicators: string[];
  severity_justification: string;
  similar_threats: string[];
}

interface Props {
  threat: Threat | null;
  onClose: () => void;
}

const severityColor: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const SECTIONS = [
  { key: 'explanation', label: 'What Is This Threat?', icon: Brain },
  { key: 'technical_details', label: 'Technical Details', icon: Eye },
  { key: 'impact', label: 'Business Impact', icon: AlertTriangle },
  { key: 'mitigation', label: 'Mitigation Steps', icon: Wrench },
  { key: 'ioc_indicators', label: 'Indicators of Compromise', icon: Shield },
  { key: 'severity_justification', label: 'Severity Justification', icon: BarChart2 },
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 rounded" style={{ color: '#8892a4' }}>
      {copied ? <Check size={12} style={{ color: '#00ff88' }} /> : <Copy size={12} />}
    </button>
  );
}

export default function ThreatExplainer({ threat, onClose }: Props) {
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['explanation']));
  const [error, setError] = useState('');

  const handleExplain = async () => {
    if (!threat) return;
    setLoading(true);
    setError('');
    try {
      const data = await explainThreat({ threat_id: threat.id, threat_data: threat as unknown as Record<string, unknown> });
      setResult(data as unknown as ExplainResult);
      setOpenSections(new Set(['explanation']));
    } catch {
      setError('Failed to generate explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!threat) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="h-full overflow-y-auto flex flex-col"
        style={{ width: 480, backgroundColor: '#0d1117', borderLeft: '1px solid #1e2739' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #1e2739' }}>
          <div className="flex items-center gap-3">
            <Brain size={20} style={{ color: '#00ff88' }} />
            <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>AI Threat Explainer</span>
          </div>
          <button onClick={onClose} style={{ color: '#8892a4' }}>
            <X size={18} />
          </button>
        </div>

        {/* Threat summary */}
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #1e2739' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base font-semibold capitalize" style={{ color: '#e2e8f0' }}>
                {threat.type.replace(/_/g, ' ')}
              </h2>
              <p className="text-xs mt-1 font-mono" style={{ color: '#06b6d4' }}>{threat.source_ip}</p>
            </div>
            <span
              className="text-xs font-bold uppercase px-2 py-1 rounded shrink-0"
              style={{ backgroundColor: `${severityColor[threat.severity]}22`, color: severityColor[threat.severity] }}
            >
              {threat.severity}
            </span>
          </div>
          <p className="text-xs" style={{ color: '#8892a4' }}>{threat.description}</p>

          {!result && (
            <button
              onClick={handleExplain}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
              {loading ? 'Analyzing threat...' : 'Generate AI Explanation'}
            </button>
          )}

          {error && (
            <p className="mt-3 text-xs" style={{ color: '#ef4444' }}>{error}</p>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="px-6 py-4 space-y-3">
            {[120, 80, 100, 90].map((w, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 rounded" style={{ backgroundColor: '#1e2739', width: '40%' }} />
                <div className="h-2 rounded" style={{ backgroundColor: '#1e2739', width: `${w}%` }} />
                <div className="h-2 rounded" style={{ backgroundColor: '#1e2739', width: '70%' }} />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="flex-1 px-4 py-4 space-y-2">
            {/* Similar threats */}
            {result.similar_threats?.length > 0 && (
              <div className="px-4 py-3 rounded-lg mb-2" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#8892a4' }}>RELATED THREATS</p>
                <div className="flex flex-wrap gap-2">
                  {result.similar_threats.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#1e2739', color: '#e2e8f0' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {SECTIONS.map(({ key, label, icon: Icon }) => {
              const isOpen = openSections.has(key);
              const value = result[key as keyof ExplainResult];
              if (!value) return null;
              const isArray = Array.isArray(value);
              return (
                <div
                  key={key}
                  className="rounded-lg overflow-hidden"
                  style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}
                >
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: '#00ff88' }} />
                      <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{label}</span>
                    </div>
                    {isOpen
                      ? <ChevronDown size={14} style={{ color: '#8892a4' }} />
                      : <ChevronRight size={14} style={{ color: '#8892a4' }} />
                    }
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid #1e2739' }}>
                      {isArray ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs" style={{ color: '#8892a4' }}>{(value as string[]).length} indicators</span>
                            <CopyButton text={(value as string[]).join('\n')} />
                          </div>
                          {(value as string[]).map((item, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 px-3 py-2 rounded font-mono text-xs"
                              style={{ backgroundColor: '#0d1117', border: '1px solid #1e2739' }}
                            >
                              <span style={{ color: '#ef4444' }}>›</span>
                              <span style={{ color: '#e2e8f0' }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs mt-3 leading-relaxed whitespace-pre-line" style={{ color: '#e2e8f0' }}>
                          {value as string}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleExplain}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium mt-2"
              style={{ backgroundColor: '#1e2739', color: '#8892a4', border: '1px solid #1e2739' }}
            >
              <Brain size={12} />
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
