'use client';
import AttackMap from '@/components/AttackMap';

export default function AttackMapPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Attack Map</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>
          Real-time visualization of global attack origins and vectors
        </p>
      </div>
      <AttackMap />
    </div>
  );
}
