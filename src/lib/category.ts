import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type { CategoryListResponse, UpdateCategoryRequest } from '../../types/category';

export async function getCategories(page = 1, limit = 20): Promise<CategoryListResponse> {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/category?page=${page}&limit=${limit}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch categories: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createCategory(formData: FormData): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/category`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create category: ${res.status} ${text}`);
  }
}

export async function updateCategory(id: number, data: UpdateCategoryRequest): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/category/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update category: ${res.status} ${text}`);
  }
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/category/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete category: ${res.status} ${text}`);
  }
}
