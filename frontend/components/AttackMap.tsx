'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAttackMapData } from '@/lib/api';

interface AttackEntry {
  id: string;
  source_ip: string;
  source_lat: number;
  source_lon: number;
  source_country: string;
  target_lat: number;
  target_lon: number;
  severity: string;
  type: string;
  timestamp: string;
  description: string;
  status: string;
}

// Equirectangular projection: convert lat/lon to SVG x/y
const W = 960;
const H = 480;
function project(lat: number, lon: number): [number, number] {
  const x = (lon + 180) * (W / 360);
  const y = (90 - lat) * (H / 180);
  return [x, y];
}

const severityColor: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

// Simplified continent outlines for equirectangular projection (W=960 H=480)
const LAND_PATHS = [
  // North America
  "M27,54 L160,46 L240,48 L320,52 L310,90 L293,120 L270,175 L245,200 L210,215 L175,215 L160,190 L155,148 L115,120 L60,110 L27,90 Z",
  // Central America + Caribbean
  "M225,215 L260,205 L265,230 L250,245 L225,235 Z",
  // South America
  "M225,230 L310,225 L355,240 L385,270 L380,320 L355,380 L310,420 L270,420 L235,390 L215,350 L210,300 L215,255 Z",
  // Greenland
  "M290,15 L365,10 L390,30 L375,60 L340,70 L300,55 Z",
  // Iceland
  "M410,40 L440,35 L445,50 L420,55 Z",
  // Europe (West)
  "M440,58 L510,52 L545,65 L565,80 L560,105 L530,120 L500,130 L470,125 L450,110 L440,90 Z",
  // Europe (East) + Scandinavia
  "M510,35 L570,28 L600,40 L590,70 L575,90 L555,100 L540,80 L520,60 Z",
  "M565,80 L620,72 L640,90 L635,120 L610,140 L580,150 L565,130 Z",
  // Africa
  "M450,155 L590,148 L610,170 L615,220 L600,280 L585,340 L555,390 L510,415 L475,415 L445,385 L430,330 L425,270 L435,210 Z",
  // Middle East
  "M575,130 L665,125 L680,155 L670,185 L635,200 L590,195 L570,170 Z",
  // Russia / Central Asia
  "M580,28 L750,18 L870,20 L895,45 L870,70 L820,80 L760,88 L700,95 L660,88 L620,72 L590,55 Z",
  // India
  "M660,155 L730,158 L725,210 L700,250 L670,255 L645,225 L640,185 Z",
  // SE Asia / Indonesia
  "M760,185 L835,175 L855,200 L840,225 L800,240 L762,215 Z",
  "M810,230 L855,225 L865,250 L835,258 L808,248 Z",
  // China / East Asia
  "M700,90 L870,75 L900,100 L890,150 L855,175 L800,180 L750,185 L700,170 L680,155 L670,120 Z",
  // Korea + Japan
  "M860,100 L900,92 L910,125 L885,148 L855,130 Z",
  // Australia
  "M775,280 L910,270 L940,300 L925,365 L880,380 L820,375 L775,340 L768,305 Z",
  // New Zealand
  "M928,338 L950,330 L955,355 L940,365 Z",
  // UK / Ireland
  "M445,62 L468,58 L472,80 L455,88 L443,76 Z",
];

export default function AttackMap() {
  const [attacks, setAttacks] = useState<AttackEntry[]>([]);
  const [selected, setSelected] = useState<AttackEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAttackMapData();
      setAttacks((data as { attacks: AttackEntry[] }).attacks || []);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    // Animation ticker
    const animInterval = setInterval(() => setTick(t => t + 1), 100);
    return () => {
      clearInterval(interval);
      clearInterval(animInterval);
    };
  }, [load]);

  const [targetX, targetY] = project(40.71, -74.00);

  // Group attacks by source IP to reduce dots
  const uniqueSources = Object.values(
    attacks.reduce((acc, a) => {
      if (!acc[a.source_ip]) acc[a.source_ip] = a;
      return acc;
    }, {} as Record<string, AttackEntry>)
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Global Attack Map</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
            {attacks.length} active attack vectors · Updated {timeAgo(lastUpdated.toISOString())}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4" style={{ minHeight: 420 }}>
        {/* SVG Map */}
        <div
          className="flex-1 rounded-xl overflow-hidden relative"
          style={{ backgroundColor: '#0a0e1a', border: '1px solid #1e2739' }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            style={{ display: 'block' }}
          >
            {/* Ocean background */}
            <rect width={W} height={H} fill="#060b14" />

            {/* Graticule */}
            {[-60, -30, 0, 30, 60].map(lat => {
              const [, y] = project(lat, 0);
              return <line key={`lat${lat}`} x1={0} y1={y} x2={W} y2={y} stroke="#1e2739" strokeWidth={0.5} />;
            })}
            {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
              const [x] = project(0, lon);
              return <line key={`lon${lon}`} x1={x} y1={0} x2={x} y2={H} stroke="#1e2739" strokeWidth={0.5} />;
            })}

            {/* Land masses */}
            {LAND_PATHS.map((d, i) => (
              <path key={i} d={d} fill="#1a2235" stroke="#263248" strokeWidth={0.8} />
            ))}

            {/* Attack arcs */}
            {attacks.map((attack) => {
              const [sx, sy] = project(attack.source_lat, attack.source_lon);
              const color = severityColor[attack.severity] || '#8892a4';
              const mx = (sx + targetX) / 2;
              const my = Math.min(sy, targetY) - Math.abs(sx - targetX) * 0.3;
              const pathD = `M${sx},${sy} Q${mx},${my} ${targetX},${targetY}`;
              const opacity = attack.status === 'active' ? 0.7 : 0.3;
              return (
                <path
                  key={attack.id}
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={attack.severity === 'critical' ? 1.5 : 1}
                  strokeOpacity={opacity}
                  strokeDasharray="4 4"
                  style={{
                    strokeDashoffset: -(tick * 2) % 20,
                    transition: 'stroke-dashoffset 0.1s linear',
                  }}
                />
              );
            })}

            {/* Source dots */}
            {uniqueSources.map((attack) => {
              const [sx, sy] = project(attack.source_lat, attack.source_lon);
              const color = severityColor[attack.severity] || '#8892a4';
              const pulse = Math.sin(tick * 0.3) * 0.4 + 0.6;
              const isSelected = selected?.source_ip === attack.source_ip;
              return (
                <g key={attack.source_ip} onClick={() => setSelected(isSelected ? null : attack)} style={{ cursor: 'pointer' }}>
                  {/* Pulse ring */}
                  <circle
                    cx={sx} cy={sy}
                    r={isSelected ? 10 : 7 * pulse}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.4}
                  />
                  {/* Main dot */}
                  <circle
                    cx={sx} cy={sy}
                    r={isSelected ? 5 : 4}
                    fill={color}
                    opacity={0.9}
                  />
                </g>
              );
            })}

            {/* Target (HQ) */}
            <g>
              <circle cx={targetX} cy={targetY} r={10} fill="none" stroke="#00ff88" strokeWidth={1.5} opacity={0.5} />
              <circle cx={targetX} cy={targetY} r={6} fill="none" stroke="#00ff88" strokeWidth={1} opacity={0.8} />
              <circle cx={targetX} cy={targetY} r={3} fill="#00ff88" />
            </g>

            {/* Selected tooltip */}
            {selected && (() => {
              const [sx, sy] = project(selected.source_lat, selected.source_lon);
              const tx = sx > W / 2 ? sx - 160 : sx + 10;
              const ty = Math.max(10, Math.min(H - 80, sy - 30));
              return (
                <g>
                  <rect x={tx} y={ty} width={155} height={70} rx={4} fill="#161b27" stroke="#1e2739" />
                  <text x={tx + 8} y={ty + 16} fill="#e2e8f0" fontSize={9} fontWeight="bold">
                    {selected.source_ip}
                  </text>
                  <text x={tx + 8} y={ty + 30} fill="#8892a4" fontSize={8}>
                    {selected.source_country}
                  </text>
                  <text x={tx + 8} y={ty + 44} fill={severityColor[selected.severity]} fontSize={8} fontWeight="bold">
                    {selected.severity.toUpperCase()} · {selected.type.replace(/_/g, ' ')}
                  </text>
                  <text x={tx + 8} y={ty + 58} fill="#8892a4" fontSize={7}>
                    {timeAgo(selected.timestamp)}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3">
            {Object.entries(severityColor).map(([sev, col]) => (
              <div key={sev} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
                <span className="text-xs capitalize" style={{ color: '#8892a4' }}>{sev}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00ff88' }} />
              <span className="text-xs" style={{ color: '#8892a4' }}>HQ</span>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div
          className="rounded-xl overflow-hidden flex flex-col"
          style={{ width: 240, backgroundColor: '#161b27', border: '1px solid #1e2739' }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2739' }}>
            <h3 className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>Recent Attacks</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {attacks.slice(0, 20).map((attack) => (
              <div
                key={attack.id}
                onClick={() => setSelected(selected?.id === attack.id ? null : attack)}
                className="px-4 py-3 cursor-pointer transition-colors"
                style={{
                  borderBottom: '1px solid #1e273844',
                  backgroundColor: selected?.id === attack.id ? '#1e273966' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e273944')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = selected?.id === attack.id ? '#1e273966' : 'transparent')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate" style={{ color: '#06b6d4' }}>{attack.source_ip}</p>
                    <p className="text-xs truncate mt-0.5 capitalize" style={{ color: '#e2e8f0' }}>
                      {attack.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>{attack.source_country}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded uppercase"
                      style={{ backgroundColor: `${severityColor[attack.severity]}22`, color: severityColor[attack.severity] }}
                    >
                      {attack.severity}
                    </span>
                    <span className="text-xs" style={{ color: '#8892a4' }}>{timeAgo(attack.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            {attacks.length === 0 && (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs" style={{ color: '#8892a4' }}>No active attacks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
