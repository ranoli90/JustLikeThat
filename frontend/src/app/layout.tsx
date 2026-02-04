import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'SimpleAsThat - Job Application Platform',
  description: 'Your complete job application platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
