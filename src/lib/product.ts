import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type { ProductListResponse, UpdateProductRequest } from '../../types/product';

export async function getProducts(page = 1, limit = 20, categoryId?: number, sellerId?: number): Promise<ProductListResponse> {
  let url = `${API_BASE_URL}/product?page=${page}&limit=${limit}`;
  if (categoryId) url += `&category_id=${categoryId}`;
  if (sellerId) url += `&seller_id=${sellerId}`;

  const res = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch products: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createProduct(formData: FormData): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/product`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create product: ${res.status} ${text}`);
  }
}

export async function updateProduct(id: number, data: UpdateProductRequest): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/product/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update product: ${res.status} ${text}`);
  }
}

export async function addProductImages(id: number, formData: FormData): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/product/${id}/images`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to add images: ${res.status} ${text}`);
  }
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/product/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete product: ${res.status} ${text}`);
  }
}
