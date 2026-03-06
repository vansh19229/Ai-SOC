'use client';
import AttackBarChart from '@/components/AttackBarChart';
import ThreatDonut from '@/components/ThreatDonut';
import GeoMap from '@/components/GeoMap';
import AIChat from '@/components/AIChat';
import { mockThreatDistribution, mockAttackSources } from '@/lib/api';

const cveEntries = [
  { id: 'CVE-2023-4911', name: 'Looney Tunables', severity: 'critical', cvss: 7.8, affected: 'glibc', exploited: true, description: 'Buffer overflow in GNU C Library enabling privilege escalation' },
  { id: 'CVE-2023-44487', name: 'HTTP/2 Rapid Reset', severity: 'high', cvss: 7.5, affected: 'HTTP/2 servers', exploited: true, description: 'DDoS amplification via HTTP/2 stream reset' },
  { id: 'CVE-2023-36884', name: 'Office RCE', severity: 'critical', cvss: 8.3, affected: 'Microsoft Office', exploited: true, description: 'Remote code execution via specially crafted Office files' },
  { id: 'CVE-2023-20198', name: 'IOS XE Auth Bypass', severity: 'critical', cvss: 10.0, affected: 'Cisco IOS XE', exploited: true, description: 'Authentication bypass allowing privilege level 15 access' },
  { id: 'CVE-2023-22515', name: 'Confluence SSRF', severity: 'critical', cvss: 10.0, affected: 'Atlassian Confluence', exploited: true, description: 'Broken access control allowing unauthorized admin account creation' },
];

const iocEntries = [
  { type: 'IP', value: '185.234.219.42', tags: ['SQL Injection', 'Scanner'], first_seen: '2024-01-15', threat_score: 95 },
  { type: 'IP', value: '103.42.91.17', tags: ['Brute Force', 'SSH'], first_seen: '2024-01-14', threat_score: 88 },
  { type: 'Domain', value: 'paypa1-security.com', tags: ['Phishing', 'Spoofing'], first_seen: '2024-01-13', threat_score: 97 },
  { type: 'Hash', value: 'a1b2c3d4e5f6...', tags: ['LockBit', 'Ransomware'], first_seen: '2024-01-12', threat_score: 99 },
  { type: 'IP', value: '91.108.4.33', tags: ['XSS', 'Web Attack'], first_seen: '2024-01-11', threat_score: 72 },
  { type: 'URL', value: 'http://34.56.78.90/exfil', tags: ['Exfiltration', 'APT'], first_seen: '2024-01-10', threat_score: 94 },
];

const cvssColor = (score: number) =>
  score >= 9 ? '#ef4444' : score >= 7 ? '#f97316' : score >= 4 ? '#eab308' : '#3b82f6';

const severityColors: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6',
};

export default function IntelligencePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Threat Intelligence</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>Global threat landscape and IOC database</p>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Threat Type Distribution</h2>
          <ThreatDonut data={mockThreatDistribution} />
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Attack Volume by Source</h2>
          <AttackBarChart data={mockAttackSources} />
        </div>
      </div>

      <GeoMap />

      {/* CVE table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Active CVEs (In Environment)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #1e2739' }}>
                {['CVE ID', 'Name', 'Severity', 'CVSS', 'Affected', 'Exploited', 'Description'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cveEntries.map(cve => (
                <tr
                  key={cve.id}
                  style={{ borderBottom: '1px solid #1e273844' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e273944')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#06b6d4' }}>{cve.id}</td>
                  <td className="px-4 py-3 font-medium text-xs" style={{ color: '#e2e8f0' }}>{cve.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold uppercase px-2 py-1 rounded" style={{ backgroundColor: `${severityColors[cve.severity]}22`, color: severityColors[cve.severity] }}>{cve.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold" style={{ color: cvssColor(cve.cvss) }}>{cve.cvss}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{cve.affected}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded`} style={{ backgroundColor: cve.exploited ? '#ef444422' : '#00ff8822', color: cve.exploited ? '#ef4444' : '#00ff88' }}>
                      {cve.exploited ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: '#8892a4' }}>{cve.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IOC table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1e2739' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Indicators of Compromise (IOC)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #1e2739' }}>
                {['Type', 'Value', 'Tags', 'First Seen', 'Threat Score'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {iocEntries.map((ioc, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid #1e273844' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e273944')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#1e2739', color: '#8892a4' }}>{ioc.type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#06b6d4' }}>{ioc.value}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ioc.tags.map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#ef444422', color: '#ef4444' }}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{ioc.first_seen}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e2739' }}>
                        <div className="h-full rounded-full" style={{ width: `${ioc.threat_score}%`, backgroundColor: ioc.threat_score >= 90 ? '#ef4444' : '#f97316' }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: ioc.threat_score >= 90 ? '#ef4444' : '#f97316' }}>{ioc.threat_score}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AIChat />
    </div>
  );
}
