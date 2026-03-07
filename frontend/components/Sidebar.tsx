'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, AlertTriangle, Activity, Users, Brain, FileText, Settings, Map, Terminal } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Threats', icon: Shield, href: '/threats' },
  { label: 'Incidents', icon: AlertTriangle, href: '/incidents' },
  { label: 'Network', icon: Activity, href: '/network' },
  { label: 'Attack Map', icon: Map, href: '/attack-map' },
  { label: 'User Behavior', icon: Users, href: '/behavior' },
  { label: 'Intelligence', icon: Brain, href: '/threat-intel' },
  { label: 'Logs', icon: FileText, href: '/logs' },
  { label: 'Live Logs', icon: Terminal, href: '/realtime-logs' },
  { label: 'Admin', icon: Settings, href: '/admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      style={{ width: 240, backgroundColor: '#0d1117', borderRight: '1px solid #1e2739' }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col"
    >
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: '1px solid #1e2739', height: 64 }}
      >
        <Shield size={28} style={{ color: '#00ff88' }} />
        <span className="text-xl font-bold" style={{ color: '#00ff88', letterSpacing: '0.1em' }}>AI-SOC</span>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold px-3 mb-3" style={{ color: '#8892a4', letterSpacing: '0.15em' }}>NAVIGATION</p>
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-all duration-200"
              style={{
                color: active ? '#00ff88' : '#8892a4',
                backgroundColor: active ? 'rgba(0,255,136,0.08)' : 'transparent',
                borderLeft: active ? '2px solid #00ff88' : '2px solid transparent',
              }}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4" style={{ borderTop: '1px solid #1e2739' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00ff88' }} />
          <span className="text-xs" style={{ color: '#8892a4' }}>Systems Online</span>
        </div>
      </div>
    </aside>
  );
}
