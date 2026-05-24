import { getAuthCookie } from '@/lib/cookies';

export function getRoleFromToken(): string | null {
  const token = getAuthCookie('ACCESS_TOKEN');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function getCanCreateBanner(): boolean {
  const token = getAuthCookie('ACCESS_TOKEN');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !!payload.can_create_banner;
  } catch {
    return false;
  }
}
