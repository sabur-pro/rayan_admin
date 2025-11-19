// src/lib/subject.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';
import type { SubjectResponse } from '../../types/subject';

export async function getSubjects({
  lang_code,
  faculty_id,
  semester_id,
  course_id,
  page = 1,
  limit = 10,
}: {
  lang_code: string;
  faculty_id: number;
  semester_id: number;
  course_id: number;
  page?: number;
  limit?: number;
}): Promise<SubjectResponse> {
  const url = `${API_BASE_URL}/subject?lang_code=${encodeURIComponent(lang_code)}&faculty_id=${faculty_id}&semester_id=${semester_id}&course_id=${course_id}&page=${page}&limit=${limit}`;
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch subjects: ${response.status} ${text}`);
  }
  return response.json();
}

interface CreateSubjectPayload {
  course_id: number;
  faculty_ids: number[];
  semester_id: number;
  translations: Array<{
    description: string;
    lang_code: string;
    name: string;
    status: string;
  }>;
}

export async function createSubject(payload: CreateSubjectPayload) {
  const response = await fetchWithAuth(`${API_BASE_URL}/subject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to create subject: ${response.status} ${text}`);
  }
  return response.json();
}
