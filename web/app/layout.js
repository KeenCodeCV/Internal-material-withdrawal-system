import './styles/globals.css';
import Link from 'next/link';
import { AuthProvider, RequireAuth } from '../components/AuthProvider';
import Nav from '../components/Nav';

export const metadata = { title: 'MaterialFlow — Tailwind/Motion/SweetAlert' };

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <div className="max-w-5xl mx-auto p-5 space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">MaterialFlow</h2>
              <Link className="link" href="/logout">ออกจากระบบ</Link>
            </header>
            <Nav />
            <main className="card">
              <RequireAuth>{children}</RequireAuth>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
