'use client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getColor(value: number, max: number): string {
  if (value === 0) return '#161b27';
  const ratio = value / max;
  if (ratio < 0.33) return '#00ff8844';
  if (ratio < 0.66) return '#eab30888';
  return `rgba(239,68,68,${0.4 + ratio * 0.6})`;
}

export default function SeverityHeatmap() {
  const data: number[][] = DAYS.map(() =>
    HOURS.map(() => Math.floor(Math.random() * 20))
  );
  const max = Math.max(...data.flat());

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex gap-1 mb-1 ml-10">
          {HOURS.map(h => (
            <div key={h} className="w-5 text-center text-xs" style={{ color: '#8892a4', fontSize: 9 }}>
              {h % 4 === 0 ? h : ''}
            </div>
          ))}
        </div>
        {DAYS.map((day, di) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="text-xs w-8 text-right" style={{ color: '#8892a4' }}>{day}</span>
            <div className="flex gap-1">
              {HOURS.map(hi => (
                <div
                  key={hi}
                  title={`${day} ${hi}:00 - ${data[di][hi]} events`}
                  className="w-5 h-5 rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                  style={{ backgroundColor: getColor(data[di][hi], max) }}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 ml-10">
          <span className="text-xs" style={{ color: '#8892a4' }}>Low</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
            <div key={v} className="w-4 h-4 rounded-sm" style={{ backgroundColor: getColor(v * max, max) }} />
          ))}
          <span className="text-xs" style={{ color: '#8892a4' }}>High</span>
        </div>
      </div>
    </div>
  );
}
