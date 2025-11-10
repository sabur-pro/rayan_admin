// src/lib/api-client.ts
import { LoginRequest, AuthResponse } from '../../types/auth';
import { setAuthCookie, removeAuthCookies } from '@/lib/cookies';
import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type { UniversityTranslationsResponse } from '../../types/university';
import { createUniversity } from '@/lib/university';
import type { FacultyResponse } from '../../types/faculty';

// degree exports
import { getDegreeTranslationsPage, getAllDegreeTranslations } from '@/lib/degree';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Login failed: ${response.status} ${text}`);
    }

    const data: AuthResponse = await response.json();
    setAuthCookie('ACCESS_TOKEN', data.access_token, data.expires_in);
    setAuthCookie('REFRESH_TOKEN', data.refresh_token);
    return data;
  },

  logout: async (): Promise<void> => {
    await fetchWithAuth(`${API_BASE_URL}/auth/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      /* ignore */
    });

    removeAuthCookies();
  },

  getUniversityTranslations: async (langCode: string, page = 1, limit = 10): Promise<UniversityTranslationsResponse> => {
    const url = `${API_BASE_URL}/university?page=${page}&limit=${limit}&lang_code=${encodeURIComponent(
      langCode
    )}`;

    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to fetch university translations: ${response.status} ${text}`);
    }

    const data: UniversityTranslationsResponse = await response.json();
    return data;
  },

  getFaculties: async (university_id: number, langCode: string, page = 1, limit = 10): Promise<FacultyResponse> => {
    const url = `${API_BASE_URL}/faculty?page=${page}&limit=${limit}&university_id=${university_id}&lang_code=${encodeURIComponent(langCode)}`;

    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to fetch faculties: ${response.status} ${text}`);
    }

    const data: FacultyResponse = await response.json();
    return data;
  },

  getProtectedData: async (): Promise<unknown> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/protected`);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to fetch protected data: ${response.status} ${text}`);
    }
    return response.json();
  },

  // Переэкспортируем createUniversity — реализация находится в src/lib/university.ts
  createUniversity,
};


// Переэкспорт degree-интерфейсов/функций
export const degreeApi = {
  getDegreeTranslationsPage,
  getAllDegreeTranslations,
};

// Алиасы
export const api = authApi;