'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { aiChat } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
}

const QUICK_ACTIONS = ['Show latest threats', 'Explain recent alert', 'System status'];

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: "Hello! I'm your AI Security Assistant. I can help you analyze threats, explain alerts, and provide security insights. How can I help?",
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await aiChat({ message: msg });
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: res.response, time: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        style={{ backgroundColor: '#00ff88', color: '#0a0e1a', boxShadow: '0 0 20px #00ff8866' }}
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-xl overflow-hidden shadow-2xl"
          style={{ width: 350, height: 500, backgroundColor: '#161b27', border: '1px solid #1e2739' }}
        >
          <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #1e2739' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00ff88' }} />
            <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>AI Security Assistant</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: m.role === 'user' ? '#00ff8822' : '#1e2739',
                    color: '#e2e8f0',
                    border: m.role === 'user' ? '1px solid #00ff8844' : '1px solid #1e2739',
                  }}
                >
                  <p>{m.content}</p>
                  <p className="text-xs mt-1" style={{ color: '#8892a4' }}>{m.time}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#1e2739', color: '#8892a4' }}>
                  Analyzing...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="px-4 py-2 flex gap-2 flex-wrap" style={{ borderTop: '1px solid #1e2739' }}>
            {QUICK_ACTIONS.map(a => (
              <button
                key={a}
                onClick={() => sendMessage(a)}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{ backgroundColor: '#1e2739', color: '#8892a4', border: '1px solid #1e2739' }}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2 px-4 py-3" style={{ borderTop: '1px solid #1e2739' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about security..."
              className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
              style={{ backgroundColor: '#1e2739', color: '#e2e8f0', border: '1px solid transparent' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-50"
              style={{ backgroundColor: '#00ff88', color: '#0a0e1a' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
