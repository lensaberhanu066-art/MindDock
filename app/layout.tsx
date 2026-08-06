import Footer from './components/Footer';
import Navbar from './components/Navbar';
import AuthGate from './components/AuthGate';
import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MindDock',
  description: 'A calm space for tasks, diary entries, and notes.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGate>
          <div className="shell">
            <header className="topbar">
              <Link href="/" className="brand">
                <span className="brand-mark">✦</span>
                <span>MindDock</span>
              </Link>
              <Navbar />
            </header>
            <main>{children}</main>
          </div>
          <Footer />
        </AuthGate>
      </body>
    </html>
  );
}
