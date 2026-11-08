'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Building2, 
  Users, 
  LogOut,
  Sun,
  Moon,
  Home,
  ShoppingBag,
  Bell,
  FolderKanban,
  Menu,
  X
} from 'lucide-react';
import { removeAuthCookies } from '@/lib/cookies';
import { authApi } from '@/lib/api-client';
import { AUTH_KEYS } from '@/lib/cookies';
import { useTheme } from '../../contexts/theme-context';
import { cn } from '@/lib/utils';
import { getRoleFromToken } from '@/lib/auth-utils';

const adminNavigation = [
  {
    name: 'Главная',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Финансы',
    href: '/dashboard/statistics',
    icon: Wallet,
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
    name: 'Магазин',
    href: '/dashboard/market',
    icon: ShoppingBag,
  },
  {
    name: 'Уведомления',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    name: 'Проекты',
    href: '/dashboard/projects',
    icon: FolderKanban,
  },
];

const sellerNavigation = [
  {
    name: 'Магазин',
    href: '/dashboard/market',
    icon: ShoppingBag,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setRole(getRoleFromToken());
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  const navigation = role === 'seller' ? sellerNavigation : adminNavigation;
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  const currentTitle = navigation.find((item) => isActive(item.href))?.name ?? 'Rayan Admin';

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
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card px-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Открыть меню"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{currentTitle}</h2>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Сменить тему"
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "sidebar-panel fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r p-5 transition-[transform,visibility] duration-200",
          "lg:visible lg:static lg:z-auto lg:min-h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:p-6",
          menuOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-3">
            <span className="text-primary-foreground font-bold">R</span>
          </div>
          <h2 className="min-w-0 flex-1 text-xl font-semibold">Rayan Admin</h2>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть меню"
            className="-mr-1 flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.name} href={item.href} className="block" onClick={() => setMenuOpen(false)}>
                <Button
                  variant={active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    active
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
      </aside>
    </>
  );
}
