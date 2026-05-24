import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type { SellerListResponse, CreateSellerRequest, UpdateSellerRequest } from '../../types/seller';

export async function getSellers(page = 1, limit = 20): Promise<SellerListResponse> {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/seller?page=${page}&limit=${limit}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch sellers: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createSeller(data: CreateSellerRequest): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/seller`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create seller: ${res.status} ${text}`);
  }
}

export async function updateSeller(id: number, data: UpdateSellerRequest): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/seller/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update seller: ${res.status} ${text}`);
  }
}

export async function deleteSeller(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/seller/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete seller: ${res.status} ${text}`);
  }
}
