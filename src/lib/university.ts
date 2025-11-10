// src/lib/university.ts
import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type { CreateUniversityRequest, CreateUniversityResponse } from '../../types/university';

export async function createUniversity(payload: CreateUniversityRequest): Promise<CreateUniversityResponse> {
  const url = `${API_BASE_URL}/university`;

  const resp = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Failed to create university: ${resp.status} ${text}`);
  }

  const data: CreateUniversityResponse = await resp.json();
  return data;
}
