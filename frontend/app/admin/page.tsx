'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, RefreshCw, Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import AIChat from '@/components/AIChat';
import {
  getAdminSettings, updateAdminSettings,
  getWhitelist, addToWhitelist, removeFromWhitelist,
  getBlacklist, addToBlacklist, removeFromBlacklist,
  testEmail, testTelegram,
} from '@/lib/api';

type Settings = Record<string, unknown>;

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [newWhiteIP, setNewWhiteIP] = useState('');
  const [newBlackIP, setNewBlackIP] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [emailTestStatus, setEmailTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [telegramTestStatus, setTelegramTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  useEffect(() => {
    getAdminSettings().then(setSettings);
    getWhitelist().then(d => setWhitelist((d as { ips?: string[]; whitelist?: string[] }).ips || (d as { whitelist?: string[] }).whitelist || []));
    getBlacklist().then(d => setBlacklist((d as { ips?: string[]; blacklist?: string[] }).ips || (d as { blacklist?: string[] }).blacklist || []));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    await updateAdminSettings(settings);
    setSaving(false);
    setSavedMsg('Settings saved successfully');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleAddWhite = async () => {
    if (!newWhiteIP.trim()) return;
    await addToWhitelist(newWhiteIP.trim());
    setWhitelist(prev => [...prev, newWhiteIP.trim()]);
    setNewWhiteIP('');
  };

  const handleRemoveWhite = async (ip: string) => {
    await removeFromWhitelist(ip);
    setWhitelist(prev => prev.filter(i => i !== ip));
  };

  const handleAddBlack = async () => {
    if (!newBlackIP.trim()) return;
    await addToBlacklist(newBlackIP.trim());
    setBlacklist(prev => [...prev, newBlackIP.trim()]);
    setNewBlackIP('');
  };

  const handleRemoveBlack = async (ip: string) => {
    await removeFromBlacklist(ip);
    setBlacklist(prev => prev.filter(i => i !== ip));
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setEmailTestStatus(null);
    try {
      const res = await testEmail() as { success: boolean; message: string };
      setEmailTestStatus({ ok: res.success, msg: res.message });
    } catch {
      setEmailTestStatus({ ok: false, msg: 'Email test failed' });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramTestStatus(null);
    try {
      const res = await testTelegram() as { success: boolean; message: string };
      setTelegramTestStatus({ ok: res.success, msg: res.message });
    } catch {
      setTelegramTestStatus({ ok: false, msg: 'Telegram test failed' });
    } finally {
      setTestingTelegram(false);
    }
  };

  const inputStyle = { backgroundColor: '#0d1117', color: '#e2e8f0', border: '1px solid #1e2739' };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Administration</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>System configuration and security settings</p>
      </div>

      {savedMsg && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}>
          {savedMsg}
        </div>
      )}

      {/* AI & Detection Settings */}
      <div className="rounded-xl p-5 space-y-5" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>AI & Detection Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: '#8892a4' }}>
              AI Sensitivity: {settings.ai_sensitivity as number}%
            </label>
            <input
              type="range" min={0} max={100}
              value={settings.ai_sensitivity as number || 75}
              onChange={e => setSettings(s => ({ ...s, ai_sensitivity: Number(e.target.value) }))}
              className="w-full accent-green-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { key: 'auto_block', label: 'Auto-block malicious IPs' },
              { key: 'auto_disable_users', label: 'Auto-disable compromised users' },
              { key: 'email_notifications', label: 'Email notifications' },
              { key: 'slack_notifications', label: 'Slack notifications' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-lg cursor-pointer" style={{ backgroundColor: '#0d1117', border: '1px solid #1e2739' }}>
                <span className="text-sm" style={{ color: '#e2e8f0' }}>{label}</span>
                <div
                  className="w-10 h-5 rounded-full relative transition-colors cursor-pointer"
                  style={{ backgroundColor: settings[key] ? '#00ff88' : '#1e2739' }}
                  onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                    style={{ backgroundColor: '#0d1117', left: settings[key] ? '1.25rem' : '0.125rem' }}
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { key: 'scan_interval', label: 'Scan Interval (seconds)', type: 'number' },
              { key: 'max_alerts_per_hour', label: 'Max Alerts/Hour', type: 'number' },
              { key: 'retention_days', label: 'Log Retention (days)', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#8892a4' }}>{label}</label>
                <input
                  type={type}
                  value={settings[key] as number || 0}
                  onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#8892a4' }}>Alert Email</label>
            <input
              type="email"
              value={settings.alert_email as string || ''}
              onChange={e => setSettings(s => ({ ...s, alert_email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Email Alert Configuration */}
      <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="flex items-center gap-2">
          <Mail size={16} style={{ color: '#00ff88' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Email Alert Configuration</h2>
        </div>

        <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer" style={{ backgroundColor: '#0d1117', border: '1px solid #1e2739' }}>
          <div>
            <span className="text-sm" style={{ color: '#e2e8f0' }}>Email Alerts Enabled</span>
            <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>Send email alerts on critical and high severity threats</p>
          </div>
          <div
            className="w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0"
            style={{ backgroundColor: settings.email_alerts_enabled ? '#00ff88' : '#1e2739' }}
            onClick={() => setSettings(s => ({ ...s, email_alerts_enabled: !s.email_alerts_enabled }))}
          >
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform" style={{ backgroundColor: '#0d1117', left: settings.email_alerts_enabled ? '1.25rem' : '0.125rem' }} />
          </div>
        </label>

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#8892a4' }}>
            Recipient Addresses (comma-separated)
          </label>
          <input
            type="text"
            value={settings.email_recipients as string || ''}
            onChange={e => setSettings(s => ({ ...s, email_recipients: e.target.value }))}
            placeholder="soc@company.com, admin@company.com"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
          >
            <Save size={14} />
            Save
          </button>
          <button
            onClick={handleTestEmail}
            disabled={testingEmail}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644' }}
          >
            {testingEmail ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            Send Test Email
          </button>
          {emailTestStatus && (
            <div className="flex items-center gap-1.5 text-xs">
              {emailTestStatus.ok
                ? <CheckCircle size={14} style={{ color: '#00ff88' }} />
                : <XCircle size={14} style={{ color: '#ef4444' }} />}
              <span style={{ color: emailTestStatus.ok ? '#00ff88' : '#ef4444' }}>
                {emailTestStatus.msg}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Telegram Alert Configuration */}
      <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#161b27', border: '1px solid #1e2739' }}>
        <div className="flex items-center gap-2">
          <Send size={16} style={{ color: '#00ff88' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Telegram Alert Configuration</h2>
        </div>

        <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer" style={{ backgroundColor: '#0d1117', border: '1px solid #1e2739' }}>
          <div>
            <span className="text-sm" style={{ color: '#e2e8f0' }}>Telegram Alerts Enabled</span>
            <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>Send Telegram messages on critical and high severity threats</p>
          </div>
          <div
            className="w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0"
            style={{ backgroundColor: settings.telegram_alerts_enabled ? '#00ff88' : '#1e2739' }}
            onClick={() => setSettings(s => ({ ...s, telegram_alerts_enabled: !s.telegram_alerts_enabled }))}
          >
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform" style={{ backgroundColor: '#0d1117', left: settings.telegram_alerts_enabled ? '1.25rem' : '0.125rem' }} />
          </div>
        </label>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#8892a4' }}>Bot Token</label>
            <input
              type="password"
              value={settings.telegram_bot_token as string || ''}
              onChange={e => setSettings(s => ({ ...s, telegram_bot_token: e.target.value }))}
              placeholder="1234567890:ABCDEFGHIJKLMNOP..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#8892a4' }}>Chat ID</label>
            <input
              type="password"
              value={settings.telegram_chat_id as string || ''}
              onChange={e => setSettings(s => ({ ...s, telegram_chat_id: e.target.value }))}
              placeholder="-1001234567890"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
          >
            <Save size={14} />
            Save
          </button>
          <button
            onClick={handleTestTelegram}
            disabled={testingTelegram}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644' }}
          >
            {testingTelegram ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            Send Test Message
          </button>
          {telegramTestStatus && (
            <div className="flex items-center gap-1.5 text-xs">
              {telegramTestStatus.ok
                ? <CheckCircle size={14} style={{ color: '#00ff88' }} />
                : <XCircle size={14} style={{ color: '#ef4444' }} />}
              <span style={{ color: telegramTestStatus.ok ? '#00ff88' : '#ef4444' }}>
                {telegramTestStatus.msg}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* IP Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Whitelist */}
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#161b27', border: '1px solid #00ff8833' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>IP Whitelist</h2>
          <div className="flex gap-2">
            <input
              value={newWhiteIP}
              onChange={e => setNewWhiteIP(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddWhite()}
              placeholder="Add IP or CIDR..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
            <button
              onClick={handleAddWhite}
              className="p-2 rounded-lg"
              style={{ backgroundColor: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844' }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {whitelist.map(ip => (
              <div key={ip} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #1e2739' }}>
                <span className="font-mono text-xs" style={{ color: '#00ff88' }}>{ip}</span>
                <button onClick={() => handleRemoveWhite(ip)} style={{ color: '#8892a4' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Blacklist */}
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#161b27', border: '1px solid #ef444433' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>IP Blacklist</h2>
          <div className="flex gap-2">
            <input
              value={newBlackIP}
              onChange={e => setNewBlackIP(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddBlack()}
              placeholder="Add IP or CIDR..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
            <button
              onClick={handleAddBlack}
              className="p-2 rounded-lg"
              style={{ backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {blacklist.map(ip => (
              <div key={ip} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #1e2739' }}>
                <span className="font-mono text-xs" style={{ color: '#ef4444' }}>{ip}</span>
                <button onClick={() => handleRemoveBlack(ip)} style={{ color: '#8892a4' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AIChat />
    </div>
  );
}
