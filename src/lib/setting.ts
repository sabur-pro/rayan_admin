import { fetchWithAuth, API_BASE_URL } from '@/lib/http';

export async function getDeliveryCost(): Promise<number> {
  const res = await fetchWithAuth(`${API_BASE_URL}/config/delivery`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch delivery cost: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.delivery_cost ?? 0;
}

export async function updateDeliveryCost(deliveryCost: number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/config/delivery`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delivery_cost: deliveryCost }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update delivery cost: ${res.status} ${text}`);
  }
}

export async function getAcademicProgressURL(): Promise<string> {
  const res = await fetchWithAuth(`${API_BASE_URL}/config/academic-progress-url`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch academic progress url: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.url ?? '';
}

export async function updateAcademicProgressURL(url: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/config/academic-progress-url`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update academic progress url: ${res.status} ${text}`);
  }
}
