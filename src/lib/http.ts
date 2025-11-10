// src/lib/http.ts
import { getAuthCookie, setAuthCookie, removeAuthCookies } from '@/lib/cookies';
import type { AuthResponse } from '../../types/auth';

export const API_BASE_URL = 'https://api.medlife.tj';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

async function doRefreshToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh(resolve);
    });
  }

  isRefreshing = true;
  const refreshToken = getAuthCookie('REFRESH_TOKEN');

  if (!refreshToken) {
    isRefreshing = false;
    throw new Error('No refresh token');
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Refresh failed: ${resp.status} ${text}`);
    }

    const data: AuthResponse = await resp.json();
    setAuthCookie('ACCESS_TOKEN', data.access_token, data.expires_in);
    setAuthCookie('REFRESH_TOKEN', data.refresh_token);

    isRefreshing = false;
    onRefreshed(data.access_token);
    return data.access_token;
  } catch (err) {
    isRefreshing = false;
    removeAuthCookies();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw err;
  }
}

/**
 * Fetch wrapper that injects Authorization header and tries refresh on 401.
 */
export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let accessToken = getAuthCookie('ACCESS_TOKEN');

  const baseHeaders: HeadersInit = {
    ...(init?.headers ?? {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  let response = await fetch(input, {
    ...init,
    headers: baseHeaders,
  });

  if (response.status === 401) {
    try {
      accessToken = await doRefreshToken();
      const retryHeaders: HeadersInit = {
        ...(init?.headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      response = await fetch(input, {
        ...init,
        headers: retryHeaders,
      });
    } catch (err) {
      throw err;
    }
  }

  return response;
}
