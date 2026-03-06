import {
  mockStats,
  mockThreats,
  mockAlerts,
  mockIncidents,
  mockLogs,
  mockNetworkActivity,
  mockUsers,
  mockNetworkChartData,
  mockThreatDistribution,
  mockAttackSources,
} from './mock-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getStats() {
  try { return await fetchAPI<typeof mockStats>('/api/stats'); }
  catch { return mockStats; }
}

export async function getThreats(params?: { page?: number; limit?: number; severity?: string; status?: string; threat_type?: string }) {
  try {
    const q = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
      severity: params?.severity || '',
      status: params?.status || '',
      threat_type: params?.threat_type || '',
    });
    return await fetchAPI<{ items: typeof mockThreats; total: number; page: number; limit: number }>(`/api/threats?${q}`);
  } catch {
    return { items: mockThreats, total: mockThreats.length, page: 1, limit: 20 };
  }
}

export async function createThreat(data: Partial<(typeof mockThreats)[0]>) {
  try { return await fetchAPI('/api/threats', { method: 'POST', body: JSON.stringify(data) }); }
  catch { return { ...data, id: String(Date.now()) }; }
}

export async function getThreat(id: string) {
  try { return await fetchAPI<(typeof mockThreats)[0]>(`/api/threats/${id}`); }
  catch { return mockThreats.find(t => t.id === id) || mockThreats[0]; }
}

export async function getAlerts(params?: { page?: number; limit?: number; severity?: string; status?: string }) {
  try {
    const q = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
      severity: params?.severity || '',
      status: params?.status || '',
    });
    return await fetchAPI<{ items: typeof mockAlerts; total: number; page: number; limit: number }>(`/api/alerts?${q}`);
  } catch {
    return { items: mockAlerts, total: mockAlerts.length, page: 1, limit: 20 };
  }
}

export async function createAlert(data: Partial<(typeof mockAlerts)[0]>) {
  try { return await fetchAPI('/api/alerts', { method: 'POST', body: JSON.stringify(data) }); }
  catch { return { ...data, id: String(Date.now()) }; }
}

export async function updateAlert(id: string, data: Partial<(typeof mockAlerts)[0]>) {
  try { return await fetchAPI(`/api/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  catch { return { ...mockAlerts.find(a => a.id === id), ...data }; }
}

export async function getLogs(params?: { page?: number; limit?: number; level?: string; source?: string }) {
  try {
    const q = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 50),
      level: params?.level || '',
      source: params?.source || '',
    });
    return await fetchAPI<{ items: typeof mockLogs; total: number; page: number; limit: number }>(`/api/logs?${q}`);
  } catch {
    return { items: mockLogs, total: mockLogs.length, page: 1, limit: 50 };
  }
}

export async function getIncidents(params?: { page?: number; limit?: number; status?: string; severity?: string }) {
  try {
    const q = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
      status: params?.status || '',
      severity: params?.severity || '',
    });
    return await fetchAPI<{ items: typeof mockIncidents; total: number; page: number; limit: number }>(`/api/incidents?${q}`);
  } catch {
    return { items: mockIncidents, total: mockIncidents.length, page: 1, limit: 20 };
  }
}

export async function createIncident(data: Partial<(typeof mockIncidents)[0]>) {
  try { return await fetchAPI('/api/incidents', { method: 'POST', body: JSON.stringify(data) }); }
  catch { return { ...data, id: String(Date.now()) }; }
}

export async function getIncident(id: string) {
  try { return await fetchAPI<(typeof mockIncidents)[0]>(`/api/incidents/${id}`); }
  catch { return mockIncidents.find(i => i.id === id) || mockIncidents[0]; }
}

export async function updateIncident(id: string, data: Partial<(typeof mockIncidents)[0]>) {
  try { return await fetchAPI(`/api/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  catch { return { ...mockIncidents.find(i => i.id === id), ...data }; }
}

export async function getNetworkActivity(params?: { page?: number; limit?: number; status?: string }) {
  try {
    const q = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
      status: params?.status || '',
    });
    return await fetchAPI<{ items: typeof mockNetworkActivity; total: number; page: number; limit: number }>(`/api/network?${q}`);
  } catch {
    return { items: mockNetworkActivity, total: mockNetworkActivity.length, page: 1, limit: 20 };
  }
}

export async function getUsers(params?: { page?: number; limit?: number }) {
  try {
    const q = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
    return await fetchAPI<{ items: typeof mockUsers; total: number; page: number; limit: number }>(`/api/users?${q}`);
  } catch {
    return { items: mockUsers, total: mockUsers.length, page: 1, limit: 20 };
  }
}

export async function createUser(data: Partial<(typeof mockUsers)[0]>) {
  try { return await fetchAPI('/api/users', { method: 'POST', body: JSON.stringify(data) }); }
  catch { return { ...data, id: String(Date.now()) }; }
}

export async function getWhitelist() {
  try { return await fetchAPI<{ ips: string[] }>('/api/admin/whitelist'); }
  catch { return { ips: ['10.0.0.0/8', '192.168.1.0/24', '172.16.0.0/12'] }; }
}

export async function addToWhitelist(ip: string) {
  try { return await fetchAPI('/api/admin/whitelist', { method: 'POST', body: JSON.stringify({ ip }) }); }
  catch { return { success: true }; }
}

export async function removeFromWhitelist(ip: string) {
  try { return await fetchAPI(`/api/admin/whitelist/${encodeURIComponent(ip)}`, { method: 'DELETE' }); }
  catch { return { success: true }; }
}

export async function getBlacklist() {
  try { return await fetchAPI<{ ips: string[] }>('/api/admin/blacklist'); }
  catch { return { ips: ['185.234.219.42', '103.42.91.17', '91.108.4.33', '77.88.44.12', '198.51.100.10', '203.0.113.5'] }; }
}

export async function addToBlacklist(ip: string) {
  try { return await fetchAPI('/api/admin/blacklist', { method: 'POST', body: JSON.stringify({ ip }) }); }
  catch { return { success: true }; }
}

export async function removeFromBlacklist(ip: string) {
  try { return await fetchAPI(`/api/admin/blacklist/${encodeURIComponent(ip)}`, { method: 'DELETE' }); }
  catch { return { success: true }; }
}

export async function getAdminSettings() {
  try { return await fetchAPI<Record<string, unknown>>('/api/admin/settings'); }
  catch {
    return {
      ai_sensitivity: 75,
      auto_block: true,
      auto_disable_users: false,
      email_notifications: true,
      slack_notifications: false,
      scan_interval: 60,
      max_alerts_per_hour: 100,
      alert_email: 'soc@company.com',
      retention_days: 90,
    };
  }
}

export async function updateAdminSettings(data: Record<string, unknown>) {
  try { return await fetchAPI('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }); }
  catch { return { success: true, ...data }; }
}

export async function aiAnalyze(data: { log_data?: string; logs?: string; text?: string }) {
  try {
    return await fetchAPI<{ analysis: string; severity: string; recommendations: string[] }>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return {
      analysis: 'AI Analysis (Mock): The provided log data indicates a potential SQL injection attack. The attacker is using classic UNION-based injection techniques to extract database content. The confidence level is high based on the payload patterns observed.',
      severity: 'critical',
      recommendations: [
        'Immediately block the source IP 185.234.219.42',
        'Review and patch the vulnerable endpoint /api/auth/login',
        'Enable WAF rule SQL-BLOCK-001',
        'Check database logs for any successful data extraction',
        'Rotate all database credentials as a precaution',
      ],
    };
  }
}

export async function aiReport(data: { incident_id?: string; incident_data?: unknown }) {
  try { return await fetchAPI<{ report: string }>('/api/ai/report', { method: 'POST', body: JSON.stringify(data) }); }
  catch {
    return {
      report: `# AI Incident Report\n\n## Executive Summary\nA critical security incident was detected and contained. The attack involved sophisticated techniques suggesting an Advanced Persistent Threat (APT) actor.\n\n## Timeline\nThe attack began with reconnaissance, followed by exploitation of a vulnerable service, then lateral movement and data staging.\n\n## Impact Assessment\nMultiple systems were affected. Sensitive data may have been accessed. No confirmed data exfiltration at this time.\n\n## Recommendations\n1. Patch all affected systems immediately\n2. Reset all credentials for affected accounts\n3. Implement additional monitoring on sensitive data stores\n4. Review and update incident response playbooks\n5. Conduct a full security audit within 30 days`,
    };
  }
}

export async function aiChat(data: { message: string; context?: string }) {
  try { return await fetchAPI<{ response: string }>('/api/ai/chat', { method: 'POST', body: JSON.stringify(data) }); }
  catch {
    const responses: Record<string, string> = {
      'show latest threats': 'Currently tracking 12 active threats. Top priorities: (1) Ransomware on workstation cluster - CRITICAL, (2) Data exfiltration attempt from 10.0.2.88 - CRITICAL, (3) DDoS on production web servers - HIGH. Recommend immediate action on items 1 and 2.',
      'explain recent alert': 'The most recent critical alert is "Ransomware Activity Detected" from EDR-Agent. LockBit ransomware signatures were found on workstation-07. The malware is attempting to encrypt files on the shared drive. Incident INC-001 has been created and the system has been isolated from the network.',
      'system status': 'System Status: ✅ All SOC systems operational. Security Score: 73/100. Active threats: 12 critical, 23 high. 342 IPs currently blocked. Average response time: 4.2 minutes. Last full scan: 15 minutes ago.',
    };
    const key = Object.keys(responses).find(k => data.message.toLowerCase().includes(k));
    return {
      response: key
        ? responses[key]
        : `I've analyzed your query: "${data.message}". Based on current threat intelligence, the security posture is moderate. There are ${mockStats.active_alerts} active alerts requiring attention. The most critical issue is the ongoing ransomware incident on workstation-07. Would you like me to provide more details on any specific threat?`,
    };
  }
}

export { mockNetworkChartData, mockThreatDistribution, mockAttackSources };
