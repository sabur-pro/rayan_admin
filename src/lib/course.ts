// src/lib/course.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';
import type { CourseResponse } from '../../types/course';

export async function getCourses(lang_code: string, page = 1, limit = 10): Promise<CourseResponse> {
  const url = `${API_BASE_URL}/course?page=${page}&limit=${limit}&lang_code=${encodeURIComponent(lang_code)}`;
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch courses: ${response.status} ${text}`);
  }
  return response.json();
}
