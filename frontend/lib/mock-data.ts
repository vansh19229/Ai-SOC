export const mockStats = {
  total_threats: 1247,
  active_alerts: 89,
  blocked_ips: 342,
  security_score: 73,
  threats_today: 47,
  incidents_open: 12,
  network_anomalies: 23,
  avg_response_time: 4.2,
};

export const mockThreats = [
  { id: '1', type: 'SQL Injection', source_ip: '185.234.219.42', target: 'api.internal:8080', severity: 'critical', timestamp: new Date(Date.now() - 300000).toISOString(), description: 'SQL injection attempt on login endpoint', status: 'active', confidence: 97, details: { payload: "' OR 1=1--", endpoint: '/api/auth/login', attempts: 14 } },
  { id: '2', type: 'Brute Force', source_ip: '103.42.91.17', target: 'auth.internal', severity: 'high', timestamp: new Date(Date.now() - 600000).toISOString(), description: 'SSH brute force detected - 847 attempts in 10 minutes', status: 'investigating', confidence: 99, details: { attempts: 847, port: 22, duration: '10 min' } },
  { id: '3', type: 'DDoS', source_ip: '192.0.2.0/24', target: 'web-01.prod', severity: 'critical', timestamp: new Date(Date.now() - 900000).toISOString(), description: 'Distributed denial of service attack from botnet', status: 'active', confidence: 95, details: { rps: 45000, botnet_size: 1200 } },
  { id: '4', type: 'Port Scan', source_ip: '77.88.44.12', target: '10.0.0.0/24', severity: 'medium', timestamp: new Date(Date.now() - 1200000).toISOString(), description: 'Systematic port scanning of internal network', status: 'resolved', confidence: 88, details: { ports_scanned: 65535, duration: '5 min' } },
  { id: '5', type: 'XSS Attack', source_ip: '91.108.4.33', target: 'app.frontend', severity: 'high', timestamp: new Date(Date.now() - 1500000).toISOString(), description: 'Cross-site scripting attempt on user input fields', status: 'false_positive', confidence: 72, details: { payload: '<script>alert(1)</script>', field: 'search' } },
  { id: '6', type: 'Malware', source_ip: '10.0.1.45', target: 'workstation-07', severity: 'critical', timestamp: new Date(Date.now() - 1800000).toISOString(), description: 'Ransomware signature detected in file upload', status: 'investigating', confidence: 94, details: { malware_family: 'LockBit', hash: 'a1b2c3d4e5f6' } },
  { id: '7', type: 'Data Exfiltration', source_ip: '10.0.2.88', target: 'db-prod-01', severity: 'critical', timestamp: new Date(Date.now() - 2100000).toISOString(), description: 'Unusual large data transfer to external server', status: 'active', confidence: 91, details: { bytes_transferred: 2500000000, destination: '34.56.78.90' } },
  { id: '8', type: 'Phishing', source_ip: '203.0.113.5', target: 'email-server', severity: 'high', timestamp: new Date(Date.now() - 2400000).toISOString(), description: 'Phishing email campaign targeting employees', status: 'resolved', confidence: 87, details: { emails_sent: 450, click_rate: '12%' } },
  { id: '9', type: 'MITM', source_ip: '10.0.3.22', target: 'network-switch-02', severity: 'high', timestamp: new Date(Date.now() - 2700000).toISOString(), description: 'ARP poisoning detected, possible MITM attack', status: 'investigating', confidence: 83, details: { arp_packets: 15000 } },
  { id: '10', type: 'Privilege Escalation', source_ip: '10.0.1.102', target: 'linux-server-04', severity: 'critical', timestamp: new Date(Date.now() - 3000000).toISOString(), description: 'User attempting to gain root privileges via exploit', status: 'active', confidence: 96, details: { cve: 'CVE-2023-4911', user: 'jsmith' } },
  { id: '11', type: 'DNS Tunneling', source_ip: '198.51.100.10', target: 'dns-resolver', severity: 'medium', timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'Suspicious DNS queries indicating data tunneling', status: 'resolved', confidence: 79, details: { query_volume: 50000 } },
  { id: '12', type: 'Credential Stuffing', source_ip: '185.156.73.14', target: 'sso.internal', severity: 'high', timestamp: new Date(Date.now() - 4200000).toISOString(), description: 'Automated credential stuffing using leaked credentials', status: 'active', confidence: 93, details: { accounts_targeted: 3200, success_rate: '0.3%' } },
];

export const mockAlerts = [
  { id: 'a1', title: 'Critical SQL Injection Detected', severity: 'critical', source: 'WAF-01', timestamp: new Date(Date.now() - 120000).toISOString(), status: 'open', details: 'Multiple SQL injection attempts detected from 185.234.219.42', threat_id: '1', assigned_to: 'analyst1' },
  { id: 'a2', title: 'Ransomware Activity Detected', severity: 'critical', source: 'EDR-Agent', timestamp: new Date(Date.now() - 240000).toISOString(), status: 'acknowledged', details: 'LockBit ransomware signature found on workstation-07', threat_id: '6', assigned_to: 'analyst2' },
  { id: 'a3', title: 'DDoS Attack in Progress', severity: 'critical', source: 'IDS-Prod', timestamp: new Date(Date.now() - 360000).toISOString(), status: 'open', details: '45,000 RPS targeting web-01.prod from botnet', threat_id: '3', assigned_to: null },
  { id: 'a4', title: 'Brute Force Attack on SSH', severity: 'high', source: 'IDS-Net', timestamp: new Date(Date.now() - 600000).toISOString(), status: 'acknowledged', details: '847 failed SSH login attempts from 103.42.91.17', threat_id: '2', assigned_to: 'analyst1' },
  { id: 'a5', title: 'Privilege Escalation Attempt', severity: 'critical', source: 'SIEM', timestamp: new Date(Date.now() - 900000).toISOString(), status: 'open', details: 'Kernel exploit attempt (CVE-2023-4911) on linux-server-04', threat_id: '10', assigned_to: 'analyst3' },
  { id: 'a6', title: 'Large Data Transfer Detected', severity: 'critical', source: 'DLP-01', timestamp: new Date(Date.now() - 1200000).toISOString(), status: 'open', details: '2.5GB transferred to external IP 34.56.78.90', threat_id: '7', assigned_to: null },
  { id: 'a7', title: 'XSS Attempt Blocked', severity: 'medium', source: 'WAF-01', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'resolved', details: 'XSS payload detected and blocked in search field', threat_id: '5', assigned_to: 'analyst2' },
  { id: 'a8', title: 'Credential Stuffing Campaign', severity: 'high', source: 'AuthLog', timestamp: new Date(Date.now() - 2400000).toISOString(), status: 'acknowledged', details: '3200 accounts targeted with leaked credentials', threat_id: '12', assigned_to: 'analyst1' },
  { id: 'a9', title: 'ARP Poisoning Detected', severity: 'high', source: 'NetMonitor', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'open', details: 'ARP poisoning detected on subnet 10.0.3.0/24', threat_id: '9', assigned_to: null },
  { id: 'a10', title: 'Phishing Campaign Blocked', severity: 'high', source: 'Email-GW', timestamp: new Date(Date.now() - 4200000).toISOString(), status: 'resolved', details: '450 phishing emails blocked, 54 delivered', threat_id: '8', assigned_to: 'analyst3' },
];

export const mockIncidents = [
  {
    id: 'inc-001',
    title: 'Ransomware Outbreak on Workstation Cluster',
    type: 'Malware Incident',
    severity: 'critical',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'investigating',
    affected_systems: ['workstation-07', 'workstation-08', 'workstation-12', 'file-server-02'],
    source_ip: '10.0.1.45',
    description: 'LockBit ransomware detected on multiple workstations. File encryption in progress on shared drives.',
    assigned_to: 'analyst2',
    resolved_at: null,
    timeline: [
      { time: new Date(Date.now() - 3600000).toISOString(), event: 'Initial detection by EDR agent on workstation-07' },
      { time: new Date(Date.now() - 3300000).toISOString(), event: 'Alert escalated to incident' },
      { time: new Date(Date.now() - 3000000).toISOString(), event: 'Network isolation initiated for affected systems' },
      { time: new Date(Date.now() - 2700000).toISOString(), event: 'Backup systems verified intact' },
    ],
    report: null,
  },
  {
    id: 'inc-002',
    title: 'Large Scale Data Exfiltration Attempt',
    type: 'Data Breach',
    severity: 'critical',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'contained',
    affected_systems: ['db-prod-01', 'db-prod-02', 'api-gateway'],
    source_ip: '10.0.2.88',
    description: 'Internal compromised host attempting to exfiltrate 2.5GB of customer data to external server.',
    assigned_to: 'analyst1',
    resolved_at: null,
    timeline: [
      { time: new Date(Date.now() - 7200000).toISOString(), event: 'DLP alert triggered for large outbound transfer' },
      { time: new Date(Date.now() - 7000000).toISOString(), event: 'Source host identified: 10.0.2.88' },
      { time: new Date(Date.now() - 6800000).toISOString(), event: 'Outbound connection blocked by firewall' },
      { time: new Date(Date.now() - 6600000).toISOString(), event: 'Host quarantined for forensic analysis' },
    ],
    report: 'AI Analysis: The exfiltration pattern suggests an APT actor. The compromised host had admin credentials possibly obtained via phishing. Recommend full forensic investigation and credential rotation.',
  },
  {
    id: 'inc-003',
    title: 'DDoS Attack on Production Web Servers',
    type: 'Availability Attack',
    severity: 'high',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    status: 'resolved',
    affected_systems: ['web-01.prod', 'web-02.prod', 'load-balancer-01'],
    source_ip: '192.0.2.0/24',
    description: 'Volumetric DDoS attack targeting web application layer. Peak traffic: 45,000 RPS.',
    assigned_to: 'analyst3',
    resolved_at: new Date(Date.now() - 7200000).toISOString(),
    timeline: [
      { time: new Date(Date.now() - 10800000).toISOString(), event: 'Traffic spike detected - 45k RPS' },
      { time: new Date(Date.now() - 10500000).toISOString(), event: 'DDoS mitigation activated' },
      { time: new Date(Date.now() - 9000000).toISOString(), event: 'Botnet IPs blocked at edge' },
      { time: new Date(Date.now() - 7200000).toISOString(), event: 'Attack subsided, services restored' },
    ],
    report: 'AI Analysis: Attack originated from a known botnet (Mirai variant). 1,200 unique IPs were involved. All IPs have been added to the block list. CDN scrubbing was effective in mitigating the attack within 1 hour.',
  },
  {
    id: 'inc-004',
    title: 'SSH Brute Force Successful Breach',
    type: 'Unauthorized Access',
    severity: 'high',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    status: 'open',
    affected_systems: ['bastion-01', 'auth.internal'],
    source_ip: '103.42.91.17',
    description: 'Attacker gained SSH access after extended brute force campaign. Post-exploitation activity detected.',
    assigned_to: null,
    resolved_at: null,
    timeline: [
      { time: new Date(Date.now() - 14400000).toISOString(), event: 'Brute force campaign started - 847 attempts' },
      { time: new Date(Date.now() - 14000000).toISOString(), event: 'Successful login detected for user "backup_svc"' },
      { time: new Date(Date.now() - 13800000).toISOString(), event: 'Lateral movement detected' },
    ],
    report: null,
  },
];

export const mockLogs = [
  { id: 'log-1', source: 'WAF-01', level: 'CRITICAL', message: "SQL injection blocked from 185.234.219.42 - payload: ' OR 1=1--", timestamp: new Date(Date.now() - 60000).toISOString(), ip: '185.234.219.42', user: null, details: { rule_id: 'SQL-001', action: 'block' } },
  { id: 'log-2', source: 'AUTH', level: 'ERROR', message: 'Failed login attempt for user admin from 103.42.91.17', timestamp: new Date(Date.now() - 120000).toISOString(), ip: '103.42.91.17', user: 'admin', details: { attempt_count: 847 } },
  { id: 'log-3', source: 'EDR-Agent', level: 'CRITICAL', message: 'Ransomware behavior detected: mass file encryption on workstation-07', timestamp: new Date(Date.now() - 180000).toISOString(), ip: '10.0.1.45', user: 'jdoe', details: { files_encrypted: 1247 } },
  { id: 'log-4', source: 'IDS-Net', level: 'WARNING', message: 'Port scan detected from 77.88.44.12 - scanning ports 1-65535', timestamp: new Date(Date.now() - 240000).toISOString(), ip: '77.88.44.12', user: null, details: { scan_type: 'SYN', ports: 65535 } },
  { id: 'log-5', source: 'NGINX', level: 'INFO', message: 'Request accepted from 192.168.1.100 - GET /api/dashboard 200 OK', timestamp: new Date(Date.now() - 300000).toISOString(), ip: '192.168.1.100', user: 'soc_admin', details: { status: 200, method: 'GET' } },
  { id: 'log-6', source: 'DLP-01', level: 'CRITICAL', message: 'Data exfiltration detected: 2.5GB outbound to 34.56.78.90', timestamp: new Date(Date.now() - 360000).toISOString(), ip: '10.0.2.88', user: null, details: { bytes: 2500000000, destination: '34.56.78.90' } },
  { id: 'log-7', source: 'SIEM', level: 'WARNING', message: 'Anomalous login pattern detected for user jsmith - login from new location', timestamp: new Date(Date.now() - 420000).toISOString(), ip: '45.67.89.10', user: 'jsmith', details: { location: 'Unknown Country', risk_score: 78 } },
  { id: 'log-8', source: 'Firewall', level: 'INFO', message: 'Outbound connection blocked: 10.0.2.88 -> 34.56.78.90:443', timestamp: new Date(Date.now() - 480000).toISOString(), ip: '10.0.2.88', user: null, details: { rule: 'EGRESS-BLOCK-001', action: 'deny' } },
  { id: 'log-9', source: 'AUTH', level: 'INFO', message: 'User analyst1 logged in successfully from 192.168.10.5', timestamp: new Date(Date.now() - 540000).toISOString(), ip: '192.168.10.5', user: 'analyst1', details: { mfa: true } },
  { id: 'log-10', source: 'Kernel', level: 'CRITICAL', message: 'Privilege escalation attempt via CVE-2023-4911 on linux-server-04', timestamp: new Date(Date.now() - 600000).toISOString(), ip: '10.0.1.102', user: 'jsmith', details: { cve: 'CVE-2023-4911', success: false } },
  { id: 'log-11', source: 'Email-GW', level: 'WARNING', message: 'Phishing email blocked: malicious URL in email from spoofed sender', timestamp: new Date(Date.now() - 660000).toISOString(), ip: '203.0.113.5', user: null, details: { emails_blocked: 450, domain: 'paypa1-security.com' } },
  { id: 'log-12', source: 'NetMonitor', level: 'WARNING', message: 'ARP poisoning detected on 10.0.3.22 - possible MITM attack', timestamp: new Date(Date.now() - 720000).toISOString(), ip: '10.0.3.22', user: null, details: { arp_packets: 15000, subnet: '10.0.3.0/24' } },
  { id: 'log-13', source: 'DNS', level: 'WARNING', message: 'Suspicious DNS tunneling activity from 198.51.100.10', timestamp: new Date(Date.now() - 780000).toISOString(), ip: '198.51.100.10', user: null, details: { queries_per_min: 833, entropy: 4.7 } },
  { id: 'log-14', source: 'NGINX', level: 'DEBUG', message: 'Health check: GET /health 200 OK - response time 2ms', timestamp: new Date(Date.now() - 840000).toISOString(), ip: '10.0.0.1', user: null, details: { response_time: 2 } },
  { id: 'log-15', source: 'DB', level: 'ERROR', message: 'Database connection pool exhausted - 500 connections active', timestamp: new Date(Date.now() - 900000).toISOString(), ip: '10.0.1.10', user: null, details: { active_connections: 500, max_connections: 500 } },
];

export const mockNetworkActivity = [
  { id: 'net-1', source_ip: '185.234.219.42', dest_ip: '10.0.1.80', protocol: 'TCP', port: 8080, bytes: 14520, timestamp: new Date(Date.now() - 30000).toISOString(), status: 'blocked' },
  { id: 'net-2', source_ip: '103.42.91.17', dest_ip: '10.0.1.22', protocol: 'TCP', port: 22, bytes: 4200, timestamp: new Date(Date.now() - 60000).toISOString(), status: 'blocked' },
  { id: 'net-3', source_ip: '10.0.2.88', dest_ip: '34.56.78.90', protocol: 'HTTPS', port: 443, bytes: 2500000000, timestamp: new Date(Date.now() - 90000).toISOString(), status: 'blocked' },
  { id: 'net-4', source_ip: '192.168.1.100', dest_ip: '8.8.8.8', protocol: 'UDP', port: 53, bytes: 1024, timestamp: new Date(Date.now() - 120000).toISOString(), status: 'allowed' },
  { id: 'net-5', source_ip: '10.0.1.45', dest_ip: '10.0.1.80', protocol: 'TCP', port: 445, bytes: 8388608, timestamp: new Date(Date.now() - 150000).toISOString(), status: 'suspicious' },
  { id: 'net-6', source_ip: '77.88.44.12', dest_ip: '10.0.0.1', protocol: 'TCP', port: 443, bytes: 25600, timestamp: new Date(Date.now() - 180000).toISOString(), status: 'suspicious' },
  { id: 'net-7', source_ip: '10.0.0.50', dest_ip: '10.0.0.1', protocol: 'ICMP', port: 0, bytes: 512, timestamp: new Date(Date.now() - 210000).toISOString(), status: 'allowed' },
  { id: 'net-8', source_ip: '198.51.100.10', dest_ip: '10.0.0.10', protocol: 'UDP', port: 53, bytes: 2048, timestamp: new Date(Date.now() - 240000).toISOString(), status: 'suspicious' },
  { id: 'net-9', source_ip: '192.168.10.5', dest_ip: '10.0.1.10', protocol: 'TCP', port: 5432, bytes: 65536, timestamp: new Date(Date.now() - 270000).toISOString(), status: 'allowed' },
  { id: 'net-10', source_ip: '203.0.113.5', dest_ip: '10.0.1.25', protocol: 'TCP', port: 25, bytes: 102400, timestamp: new Date(Date.now() - 300000).toISOString(), status: 'blocked' },
];

export const mockUsers = [
  { id: 'u1', username: 'soc_admin', email: 'admin@company.com', role: 'admin', last_login: new Date(Date.now() - 1800000).toISOString(), status: 'active', location: 'New York, US', department: 'Security' },
  { id: 'u2', username: 'analyst1', email: 'analyst1@company.com', role: 'analyst', last_login: new Date(Date.now() - 3600000).toISOString(), status: 'active', location: 'London, UK', department: 'SOC' },
  { id: 'u3', username: 'analyst2', email: 'analyst2@company.com', role: 'analyst', last_login: new Date(Date.now() - 7200000).toISOString(), status: 'active', location: 'Austin, US', department: 'SOC' },
  { id: 'u4', username: 'analyst3', email: 'analyst3@company.com', role: 'analyst', last_login: new Date(Date.now() - 10800000).toISOString(), status: 'active', location: 'Sydney, AU', department: 'SOC' },
  { id: 'u5', username: 'jsmith', email: 'jsmith@company.com', role: 'viewer', last_login: new Date(Date.now() - 14400000).toISOString(), status: 'suspended', location: 'Unknown', department: 'IT' },
  { id: 'u6', username: 'viewer1', email: 'viewer1@company.com', role: 'viewer', last_login: new Date(Date.now() - 86400000).toISOString(), status: 'active', location: 'Chicago, US', department: 'Management' },
];

export const mockNetworkChartData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i.toString().padStart(2, '0')}:00`,
  bytes_in: Math.floor(Math.random() * 1000 + 200),
  bytes_out: Math.floor(Math.random() * 800 + 100),
  anomalies: Math.random() > 0.8 ? Math.floor(Math.random() * 50) : 0,
}));

export const mockThreatDistribution = [
  { name: 'SQL Injection', value: 28, color: '#ef4444' },
  { name: 'Brute Force', value: 22, color: '#f97316' },
  { name: 'Malware', value: 18, color: '#8b5cf6' },
  { name: 'DDoS', value: 15, color: '#06b6d4' },
  { name: 'Phishing', value: 12, color: '#eab308' },
  { name: 'Other', value: 5, color: '#3b82f6' },
];

export const mockAttackSources = [
  { ip: '185.234.219.42', count: 147, country: 'RU' },
  { ip: '103.42.91.17', count: 89, country: 'CN' },
  { ip: '91.108.4.33', count: 76, country: 'IR' },
  { ip: '198.51.100.10', count: 64, country: 'KP' },
  { ip: '77.88.44.12', count: 52, country: 'BR' },
  { ip: '203.0.113.5', count: 48, country: 'NG' },
  { ip: '192.0.2.10', count: 35, country: 'UA' },
  { ip: '45.67.89.10', count: 29, country: 'RO' },
  { ip: '34.56.78.90', count: 24, country: 'US' },
  { ip: '172.16.254.1', count: 18, country: 'IN' },
];

export const mockAttackMapData = {
  attacks: [
    { id: '1', source_ip: '185.234.219.42', source_lat: 55.76, source_lon: 37.62, source_country: 'Russia', target_lat: 40.71, target_lon: -74.01, severity: 'critical', type: 'sql_injection', timestamp: new Date(Date.now() - 300000).toISOString(), description: 'SQL injection attempt on login endpoint', status: 'active' },
    { id: '2', source_ip: '103.42.91.17', source_lat: 39.90, source_lon: 116.41, source_country: 'China', target_lat: 40.71, target_lon: -74.01, severity: 'high', type: 'brute_force', timestamp: new Date(Date.now() - 600000).toISOString(), description: 'SSH brute force attack', status: 'investigating' },
    { id: '3', source_ip: '198.51.100.10', source_lat: 39.04, source_lon: 125.76, source_country: 'North Korea', target_lat: 40.71, target_lon: -74.01, severity: 'critical', type: 'ddos', timestamp: new Date(Date.now() - 900000).toISOString(), description: 'DDoS from botnet', status: 'active' },
    { id: '4', source_ip: '77.88.44.12', source_lat: -15.78, source_lon: -47.93, source_country: 'Brazil', target_lat: 40.71, target_lon: -74.01, severity: 'medium', type: 'port_scan', timestamp: new Date(Date.now() - 1200000).toISOString(), description: 'Port scanning activity', status: 'resolved' },
    { id: '5', source_ip: '203.0.113.5', source_lat: 6.52, source_lon: 3.38, source_country: 'Nigeria', target_lat: 40.71, target_lon: -74.01, severity: 'high', type: 'phishing', timestamp: new Date(Date.now() - 1500000).toISOString(), description: 'Phishing campaign', status: 'resolved' },
    { id: '6', source_ip: '45.67.89.10', source_lat: 44.43, source_lon: 26.10, source_country: 'Romania', target_lat: 40.71, target_lon: -74.01, severity: 'high', type: 'malware', timestamp: new Date(Date.now() - 2400000).toISOString(), description: 'Malware distribution', status: 'investigating' },
    { id: '7', source_ip: '91.108.4.33', source_lat: 55.76, source_lon: 37.62, source_country: 'Russia', target_lat: 40.71, target_lon: -74.01, severity: 'high', type: 'xss', timestamp: new Date(Date.now() - 3000000).toISOString(), description: 'XSS attack attempt', status: 'false_positive' },
    { id: '8', source_ip: '172.16.254.1', source_lat: 28.61, source_lon: 77.21, source_country: 'India', target_lat: 40.71, target_lon: -74.01, severity: 'low', type: 'port_scan', timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'Reconnaissance scan', status: 'resolved' },
  ],
  total: 8,
};

export const mockThreatIntelStats = {
  total: 115,
  high_confidence: 72,
  active_sources: 7,
  by_type: { ip: 46, domain: 34, hash: 23, url: 12 },
  by_source: { 'AlienVault OTX': 28, 'VirusTotal': 24, 'Shodan': 20, 'MISP': 18, 'ThreatFox': 15, 'Internal': 10 },
};

export const mockThreatIntel = [
  { id: 'ti-1', type: 'ip', value: '185.234.219.42', threat_type: 'sql_injection', confidence: 95, source: 'AlienVault OTX', first_seen: '2024-01-15T00:00:00Z', last_seen: new Date(Date.now() - 86400000).toISOString(), tags: ['SQL Injection', 'Scanner'], description: 'Known SQL injection scanner.' },
  { id: 'ti-2', type: 'ip', value: '103.42.91.17', threat_type: 'brute_force', confidence: 92, source: 'Shodan', first_seen: '2024-01-14T00:00:00Z', last_seen: new Date(Date.now() - 172800000).toISOString(), tags: ['Brute Force', 'SSH'], description: 'SSH brute-force botnet node.' },
  { id: 'ti-3', type: 'domain', value: 'paypa1-security.com', threat_type: 'phishing', confidence: 98, source: 'VirusTotal', first_seen: '2024-01-13T00:00:00Z', last_seen: new Date(Date.now() - 259200000).toISOString(), tags: ['Phishing', 'Spoofing'], description: 'PayPal phishing domain.' },
  { id: 'ti-4', type: 'hash', value: 'a1b2c3d4e5f67890abcdef1234567890', threat_type: 'ransomware', confidence: 99, source: 'ThreatFox', first_seen: '2024-01-12T00:00:00Z', last_seen: new Date(Date.now() - 345600000).toISOString(), tags: ['LockBit', 'Ransomware'], description: 'LockBit 3.0 ransomware sample.' },
  { id: 'ti-5', type: 'ip', value: '91.108.4.33', threat_type: 'xss', confidence: 72, source: 'MISP', first_seen: '2024-01-11T00:00:00Z', last_seen: new Date(Date.now() - 432000000).toISOString(), tags: ['XSS', 'Web Attack'], description: 'XSS attack source.' },
  { id: 'ti-6', type: 'url', value: 'http://34.56.78.90/exfil', threat_type: 'data_exfiltration', confidence: 94, source: 'Internal', first_seen: '2024-01-10T00:00:00Z', last_seen: new Date(Date.now() - 518400000).toISOString(), tags: ['Exfiltration', 'APT'], description: 'C2 exfiltration endpoint.' },
  { id: 'ti-7', type: 'ip', value: '198.51.100.10', threat_type: 'ddos', confidence: 88, source: 'AlienVault OTX', first_seen: '2024-01-09T00:00:00Z', last_seen: new Date(Date.now() - 604800000).toISOString(), tags: ['DDoS', 'Botnet'], description: 'Mirai botnet node.' },
  { id: 'ti-8', type: 'domain', value: 'update-flash-player.com', threat_type: 'malware', confidence: 97, source: 'VirusTotal', first_seen: '2024-01-08T00:00:00Z', last_seen: new Date(Date.now() - 691200000).toISOString(), tags: ['Drive-by Download', 'Trojan'], description: 'Fake Flash Player update page.' },
];
