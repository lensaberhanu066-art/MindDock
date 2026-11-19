import AppShell from './components/AppShell';
import { AuthProvider } from './components/AuthProvider';
import AuthGate from './components/AuthGate';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MindDock',
  description: 'A calm space for tasks, diary entries, and notes.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
