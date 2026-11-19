'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import LoadingState from './LoadingState';

const PUBLIC_PATHS = ['/login', '/register'];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublic) router.replace('/login');
    else if (user && isPublic) router.replace('/');
  }, [isLoading, isPublic, pathname, router, user]);

  if (isLoading || (!user && !isPublic) || (user && isPublic)) {
    return <LoadingState label="Checking your session..." />;
  }

  return <>{children}</>;
}
