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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="glass rounded-xl p-6 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}