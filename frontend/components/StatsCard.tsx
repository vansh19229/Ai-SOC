'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  color?: string;
  subtitle?: string;
}

export default function StatsCard({ title, value, icon: Icon, trend, color = '#00ff88', subtitle }: StatsCardProps) {
  const [displayed, setDisplayed] = useState(0);
  const numVal = typeof value === 'number' ? value : parseInt(String(value), 10);

  useEffect(() => {
    if (isNaN(numVal)) return;
    let start = 0;
    const end = numVal;
    const step = Math.max(1, Math.ceil(end / (1200 / 16)));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplayed(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [numVal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: '#161b27', border: `1px solid ${color}33`, boxShadow: `0 0 20px ${color}11` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: '#8892a4' }}>{title}</span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <span className="text-3xl font-bold" style={{ color: '#e2e8f0' }}>
          {isNaN(numVal) ? value : displayed.toLocaleString()}
        </span>
        {subtitle && <p className="text-xs mt-1" style={{ color: '#8892a4' }}>{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trend >= 0
            ? <TrendingUp size={14} style={{ color: '#ef4444' }} />
            : <TrendingDown size={14} style={{ color: '#00ff88' }} />}
          <span className="text-xs font-medium" style={{ color: trend >= 0 ? '#ef4444' : '#00ff88' }}>
            {Math.abs(trend)}% from yesterday
          </span>
        </div>
      )}
    </motion.div>
  );
}
