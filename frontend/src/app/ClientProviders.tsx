'use client';

import { AuthProvider } from '../context/AuthContext';
import { AuthenticatedLayout } from '../components/AuthenticatedLayout';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthProvider>
  );
}
