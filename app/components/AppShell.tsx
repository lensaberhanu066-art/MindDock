'use client';

import Footer from './Footer';
import Navbar from './Navbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MINIMAL_LAYOUT_PATHS = ['/login', '/register'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimalLayout = MINIMAL_LAYOUT_PATHS.includes(pathname);

  if (minimalLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="shell">
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark">✦</span>
            <span>MindDock</span>
          </Link>
          <Navbar />
        </header>
        <main>{children}</main>
        <Footer />
      </div>
    </>
  );
}
