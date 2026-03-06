'use client';
import { mockAttackSources } from '@/lib/api';

export default function GeoMap() {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Top Attack Sources</h3>
      <div className="space-y-2">
        {mockAttackSources.slice(0, 8).map((src, i) => (
          <div key={src.ip} className="flex items-center gap-3">
            <span className="text-xs w-5 text-right" style={{ color: '#8892a4' }}>#{i + 1}</span>
            <span className="font-mono text-xs flex-1" style={{ color: '#06b6d4' }}>{src.ip}</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1e2739', color: '#8892a4' }}>{src.country}</span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e2739' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(src.count / mockAttackSources[0].count) * 100}%`,
                  backgroundColor: i < 3 ? '#ef4444' : '#f97316',
                }}
              />
            </div>
            <span className="text-xs w-8 text-right" style={{ color: '#8892a4' }}>{src.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
