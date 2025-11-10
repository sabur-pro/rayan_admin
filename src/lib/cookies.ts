import Cookies from 'js-cookie';

export const AUTH_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export type AuthKey = keyof typeof AUTH_KEYS;

export const getAuthCookie = (key: AuthKey): string | undefined => {
  return Cookies.get(AUTH_KEYS[key]);
};

export const setAuthCookie = (
  key: AuthKey,
  value: string,
  expiresIn?: number
): void => {
  const options = expiresIn ? { expires: expiresIn / 86400 } : {};
  Cookies.set(AUTH_KEYS[key], value, { path: '/', ...options });
};

export const removeAuthCookies = (): void => {
  Object.values(AUTH_KEYS).forEach(key => {
    Cookies.remove(key, { path: '/' });
  });
};