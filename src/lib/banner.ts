import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type { BannerListResponse } from '../../types/banner';

export async function getBanners(page = 1, limit = 10): Promise<BannerListResponse> {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/banner?page=${page}&limit=${limit}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch banners: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createBanner(formData: FormData): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/banner`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create banner: ${res.status} ${text}`);
  }
}

export async function updateBanner(id: number, data: Record<string, unknown>): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/banner/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update banner: ${res.status} ${text}`);
  }
}

export async function deleteBanner(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/banner/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete banner: ${res.status} ${text}`);
  }
}
