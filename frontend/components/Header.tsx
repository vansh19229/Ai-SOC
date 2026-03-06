'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': 'Security Dashboard',
  '/threats': 'Threat Management',
  '/incidents': 'Incident Response',
  '/network': 'Network Monitor',
  '/behavior': 'User Behavior Analytics',
  '/intelligence': 'Threat Intelligence',
  '/logs': 'Log Management',
  '/admin': 'Administration',
};

export default function Header() {
  const pathname = usePathname();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const alertCount = 5;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const title = pageTitles[pathname] || 'AI-SOC';

  return (
    <header
      style={{ left: 240, backgroundColor: '#0d1117', borderBottom: '1px solid #1e2739', height: 64 }}
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6"
    >
      <h1 className="text-lg font-semibold" style={{ color: '#e2e8f0' }}>{title}</h1>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-sm font-mono" style={{ color: '#e2e8f0' }}>{time}</div>
          <div className="text-xs" style={{ color: '#8892a4' }}>{date}</div>
        </div>
        <div className="relative cursor-pointer">
          <Bell size={20} style={{ color: '#8892a4' }} />
          {alertCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: '#ef4444', color: 'white', fontSize: 10 }}
            >
              {alertCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-2 h-2">
            <div className="absolute w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: '#00ff88', opacity: 0.7 }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00ff88' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: '#00ff88', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>
    </header>
  );
}
