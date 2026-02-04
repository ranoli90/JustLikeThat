import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navigation } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';

export const metadata = {
  title: 'SimpleAsThat - Job Application Platform',
  description: 'Your complete job application platform',
};

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Show navigation only for authenticated pages
  const isPublicPage = [
    '/login',
    '/signup',
    '/verify-email',
  ].some(path => typeof window !== 'undefined' && window.location.pathname.startsWith(path));

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthenticatedLayout>{children}</AuthenticatedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
