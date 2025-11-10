// src/lib/material.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';
import type { MaterialTypeResponse, MaterialResponse } from '../../types/material';

/**
 * Получает список типов материалов для конкретного предмета
 */
export async function getMaterialTypes({
  lang_code,
  subject_id,
  page = 1,
  limit = 10,
}: {
  lang_code: string;
  subject_id: number;
  page?: number;
  limit?: number;
}): Promise<MaterialTypeResponse> {
  const url = `${API_BASE_URL}/material-type?page=${page}&limit=${limit}&lang_code=${encodeURIComponent(lang_code)}&subject_id=${subject_id}`;
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch material types: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Получает список всех типов материалов (без фильтра по subject_id)
 */
export async function getAllMaterialTypes({
  lang_code,
  page = 1,
  limit = 10,
}: {
  lang_code: string;
  page?: number;
  limit?: number;
}): Promise<MaterialTypeResponse> {
  const url = `${API_BASE_URL}/material-type?page=${page}&limit=${limit}&lang_code=${encodeURIComponent(lang_code)}`;
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch all material types: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Получает список материалов с фильтрацией
 */
export async function getMaterials({
  lang_code,
  course_id,
  semester_id,
  subject_id,
  material_type_id,
  page = 1,
  limit = 10,
}: {
  lang_code: string;
  course_id: number;
  semester_id: number;
  subject_id: number;
  material_type_id: number;
  page?: number;
  limit?: number;
}): Promise<MaterialResponse> {
  const url = `${API_BASE_URL}/material?page=${page}&limit=${limit}&course_id=${course_id}&semester_id=${semester_id}&subject_id=${subject_id}&material_type_id=${material_type_id}&lang_code=${encodeURIComponent(lang_code)}`;
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch materials: ${response.status} ${text}`);
  }

  return response.json();
}
