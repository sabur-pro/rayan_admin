'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Building2, 
  Users, 
  LogOut,
  Sun,
  Moon,
  Home,
  Settings
} from 'lucide-react';
import { removeAuthCookies } from '@/lib/cookies';
import { authApi } from '@/lib/api-client';
import { AUTH_KEYS } from '@/lib/cookies';
import { useTheme } from '../../contexts/theme-context';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Главная',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Статистика',
    href: '/dashboard/statistics',
    icon: BarChart3,
  },
  {
    name: 'Университеты',
    href: '/dashboard/universities',
    icon: Building2,
  },
  {
    name: 'Пользователи',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'Настройки',
    href: '/dashboard/settings',
    icon: Settings,
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${AUTH_KEYS.ACCESS_TOKEN}=`))
        ?.split('=')[1];

      if (accessToken) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthCookies();
      router.push('/login');
    }
  };

  return (
    <div className="w-64 bg-card border-r min-h-screen p-6 flex flex-col glass">
      <div className="flex items-center mb-8">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-3">
          <span className="text-primary-foreground font-bold">R</span>
        </div>
        <h2 className="text-xl font-semibold">Rayan Admin</h2>
      </div>
      
      <nav className="space-y-2 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button 
                variant={isActive ? "default" : "ghost"} 
                className={cn(
                  "w-full justify-start transition-all duration-200",
                  isActive 
                    ? "btn-primary shadow-md" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="space-y-4 pt-4 border-t">
        <Button 
          variant="outline" 
          className="w-full justify-between btn-outline" 
          onClick={toggleTheme}
        >
          <span>Тема</span>
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-between btn-outline" 
          onClick={handleLogout}
        >
          <span>Выход</span>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}