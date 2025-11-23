// src/lib/files.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';

export interface UploadedFile {
  lang: string;
  name: string;
  path: string;
}

export interface FilesResponse {
  data: UploadedFile[];
  pagination: {
    limit: number;
    page: number;
    total_count: number;
  };
}

/**
 * Upload a file to the server
 */
export async function uploadFile(file: File, lang: string): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('lang', lang);

  const response = await fetchWithAuth(`${API_BASE_URL}/files/upload`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type for multipart/form-data - browser will set it with boundary
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Не удалось загрузить файл: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Fetch suspended files with pagination
 */
export async function fetchSuspendedFiles(
  lang: string,
  page = 1,
  limit = 50
): Promise<FilesResponse> {
  const url = `${API_BASE_URL}/files/suspended?page=${page}&limit=${limit}&lang_code=${encodeURIComponent(lang)}`;
  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Не удалось загрузить файлы: ${response.status} ${text}`);
  }

  return response.json();
}

