'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../lib/auth';

const PUBLIC_PATHS = ['/', '/login', '/register'];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((user) => {
      if (!active) return;
      const isPublic = PUBLIC_PATHS.includes(pathname);

      if (!user && !isPublic) {
        router.replace('/login');
        return;
      }

      if (user && (pathname === '/login' || pathname === '/register')) {
        router.replace('/');
        return;
      }

      setReady(true);
    }).catch(() => {
      if (PUBLIC_PATHS.includes(pathname)) setReady(true);
      else router.replace('/login');
    });

    return () => { active = false; };
  }, [pathname, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
