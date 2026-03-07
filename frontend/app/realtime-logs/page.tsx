'use client';
import RealtimeLogs from '@/components/RealtimeLogs';

export default function RealtimeLogsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Live Log Stream</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>
          Real-time security log monitoring via WebSocket connection
        </p>
      </div>
      <RealtimeLogs />
    </div>
  );
}
