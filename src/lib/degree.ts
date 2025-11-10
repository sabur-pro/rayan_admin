// src/lib/degree.ts
import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type {
  DegreeTranslationsResponse,
  DegreeItem,
  DegreeCreateRequest,
} from '../../types/degree';

const ENDPOINT = '/degree';
const TRANSLATIONS_ENDPOINT = '/degree';

export async function getDegreeTranslationsPage(page = 1, limit = 10): Promise<DegreeTranslationsResponse> {
  const url = `${API_BASE_URL}${TRANSLATIONS_ENDPOINT}?page=${page}&limit=${limit}`;
  const resp = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Failed to fetch degree translations: ${resp.status} ${txt}`);
  }

  const data: DegreeTranslationsResponse = await resp.json();
  return data;
}

export async function getAllDegreeTranslations(initialLimit = 10): Promise<DegreeItem[]> {
  const collected: DegreeItem[] = [];
  let page = 1;
  let total = Infinity;

  while (collected.length < total) {
    const res = await getDegreeTranslationsPage(page, initialLimit);
    collected.push(...res.data);

    total = res.total_count;
    if (res.data.length === 0) break;

    page += 1;
    if (page > 1000) break; // safety
  }

  return collected;
}

export async function createDegree(payload: DegreeCreateRequest): Promise<DegreeItem> {
  const url = `${API_BASE_URL}${ENDPOINT}`;
  const resp = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Failed to create degree: ${resp.status} ${txt}`);
  }

  const data: DegreeItem = await resp.json();
  return data;
}

export async function updateDegreeTranslation(
  degreeId: number,
  langCode: string,
  payload: { name: string; description: string; status: string }
): Promise<void> {
  const url = `${API_BASE_URL}${ENDPOINT}/translation/${degreeId}?lang_code=${langCode}`;
  const resp = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Failed to update degree translation: ${resp.status} ${txt}`);
  }

  return;
}