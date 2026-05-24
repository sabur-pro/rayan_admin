import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type { OrderListResponse, Order } from '../../types/order';

export async function getOrders(
  page = 1,
  limit = 20,
  status?: string,
  userId?: number
): Promise<OrderListResponse> {
  let url = `${API_BASE_URL}/order?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  if (userId) url += `&user_id=${userId}`;

  const res = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch orders: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getOrderById(id: number): Promise<Order> {
  const res = await fetchWithAuth(`${API_BASE_URL}/order/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch order: ${res.status} ${text}`);
  }
  return res.json();
}

export async function updateOrderStatus(id: number, status: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/order/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update order status: ${res.status} ${text}`);
  }
}
