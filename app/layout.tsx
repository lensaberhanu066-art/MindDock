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
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="brand">
              <span className="brand-mark">✦</span>
              <span>MindDock</span>
            </Link>
            <nav className="nav-links">
              <Link href="/tasks">Tasks</Link>
              <Link href="/diary">Diary</Link>
              <Link href="/notes">Notes</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
