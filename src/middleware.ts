import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_KEYS } from './lib/cookies';

const publicRoutes = ['/', '/login', '/edit'];
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(AUTH_KEYS.ACCESS_TOKEN);
  const refreshToken = request.cookies.get(AUTH_KEYS.REFRESH_TOKEN);
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname);

  // Разрешаем доступ к публичным маршрутам
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Если нет токенов и маршрут не публичный - перенаправляем на логин
  if (!accessToken?.value && !refreshToken?.value && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Если есть токены и пользователь на auth-маршруте - перенаправляем на dashboard
  if (accessToken?.value && refreshToken?.value && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};