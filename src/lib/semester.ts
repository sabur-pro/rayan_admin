// src/lib/semester.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';
import type { SemesterResponse } from '../../types/semester';

export async function getSemesters(page = 1, limit = 50): Promise<SemesterResponse> {
  const url = `${API_BASE_URL}/semester?page=${page}&limit=${limit}`;
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch semesters: ${response.status} ${text}`);
  }
  return response.json();
}
