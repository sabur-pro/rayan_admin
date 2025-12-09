// src/lib/user.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';
import type { UsersResponse, UsersQueryParams, Subscription, SubscriptionQueryParams } from '../../types/user';

export async function getUsers(params: UsersQueryParams): Promise<UsersResponse> {
  const searchParams = new URLSearchParams();
  
  // Обязательные параметры
  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));
  
  // Опциональные параметры
  if (params.role) {
    searchParams.set('role', params.role);
  }
  if (params.lang_code) {
    searchParams.set('lang_code', params.lang_code);
  }
  if (params.course_id !== undefined && params.course_id > 0) {
    searchParams.set('course_id', String(params.course_id));
  }
  if (params.semester_id !== undefined && params.semester_id > 0) {
    searchParams.set('semester_id', String(params.semester_id));
  }
  if (params.university_id !== undefined && params.university_id > 0) {
    searchParams.set('university_id', String(params.university_id));
  }
  if (params.faculty_id !== undefined && params.faculty_id > 0) {
    searchParams.set('faculty_id', String(params.faculty_id));
  }
  if (params.login) {
    searchParams.set('login', params.login);
  }

  const url = `${API_BASE_URL}/user?${searchParams.toString()}`;
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch users: ${response.status} ${text}`);
  }
  
  return response.json();
}

export async function getSubscriptions(params: SubscriptionQueryParams): Promise<Subscription[]> {
  const searchParams = new URLSearchParams();
  
  // Обязательные параметры
  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));
  
  // Опциональные параметры
  if (params.start_date) {
    searchParams.set('start_date', params.start_date);
  }
  if (params.end_date) {
    searchParams.set('end_date', params.end_date);
  }

  const url = `${API_BASE_URL}/user/subscription?${searchParams.toString()}`;
  
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch subscriptions: ${response.status} ${text}`);
  }
  
  return response.json();
}

export async function updateSubscriptionStatus(
  subscriptionId: number,
  status: 'accepted' | 'denied'
): Promise<void> {
  const url = `${API_BASE_URL}/admin/subscription/activate`;
  
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription_id: subscriptionId,
      status: status,
    }),
  });
  
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to update subscription: ${response.status} ${text}`);
  }
}
