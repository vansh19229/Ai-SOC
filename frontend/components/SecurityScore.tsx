'use client';
import { useEffect, useState } from 'react';

interface SecurityScoreProps {
  score: number;
}

export default function SecurityScore({ score }: SecurityScoreProps) {
  const [animated, setAnimated] = useState(0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const color = score <= 40 ? '#ef4444' : score <= 70 ? '#eab308' : '#00ff88';

  useEffect(() => {
    let current = 0;
    const step = score / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, score);
      setAnimated(Math.round(current));
      if (current >= score) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const offset = circumference - (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <svg width={200} height={200} className="absolute -rotate-90">
          <circle cx={100} cy={100} r={radius} fill="none" stroke="#1e2739" strokeWidth={12} />
          <circle
            cx={100}
            cy={100}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="flex flex-col items-center z-10">
          <span className="text-4xl font-bold" style={{ color }}>{animated}</span>
          <span className="text-xs uppercase tracking-wider" style={{ color: '#8892a4' }}>Security Score</span>
        </div>
      </div>
    </div>
  );
}
