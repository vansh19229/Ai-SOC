import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'AI-SOC Platform',
  description: 'AI Security Operations Center',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0a0e1a', color: '#e2e8f0', margin: 0 }}>
        <Sidebar />
        <Header />
        <main style={{ marginLeft: 240, paddingTop: 64, minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
