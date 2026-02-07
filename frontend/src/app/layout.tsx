import './globals.css';
import { ClientProviders } from './ClientProviders';

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
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
