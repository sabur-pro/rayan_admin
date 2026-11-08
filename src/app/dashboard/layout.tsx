import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_KEYS } from '@/lib/cookies';
import Sidebar from '../../components/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get(AUTH_KEYS.ACCESS_TOKEN);

  if (!accessToken) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 lg:p-6">
        <div className="content-panel min-h-full p-3 sm:p-4 lg:rounded-xl lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}