// src/lib/notifications.ts
// API-клиент раздела «Уведомления» (push-рассылки).
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';

export type AudienceType = 'all' | 'users';
export type SubscriptionSeg = 'all' | 'active' | 'inactive';
export type ScheduleType = 'now' | 'scheduled' | 'recurring';
export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'cancelled'
  | 'failed';

export interface PushTranslation {
  lang_code: string;
  title: string;
  body: string;
}

export interface CampaignAudience {
  audience_type: AudienceType;
  university_id?: number | null;
  faculty_id?: number | null;
  course_id?: number | null;
  semester_id?: number | null;
  subscription_seg?: SubscriptionSeg;
}

export interface CampaignSchedule {
  schedule_type: ScheduleType;
  scheduled_at?: string | null; // ISO 8601
  cron_expr?: string;
  timezone?: string;
}

export interface Campaign {
  id: number;
  audience_type: AudienceType;
  university_id: number | null;
  faculty_id: number | null;
  course_id: number | null;
  semester_id: number | null;
  subscription_seg: SubscriptionSeg;
  schedule_type: ScheduleType;
  scheduled_at: string | null;
  cron_expr: string;
  timezone: string;
  next_run_at: string | null;
  active: boolean;
  data: string;
  status: CampaignStatus;
  last_run_at: string | null;
  total_sent: number;
  total_failed: number;
  created_at: string;
  translations: PushTranslation[];
}

export interface CampaignRun {
  id: number;
  run_at: string;
  recipient_count: number;
  device_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  error: string;
}

export interface CreateCampaignPayload {
  audience: CampaignAudience;
  schedule: CampaignSchedule;
  data?: string;
  translations: PushTranslation[];
}

export type UpdateCampaignPayload = Partial<{
  audience: CampaignAudience;
  schedule: CampaignSchedule;
  data: string;
  active: boolean;
  translations: PushTranslation[];
}>;

export interface AudiencePreview {
  recipient_count: number;
  device_count: number;
}

export interface PushStats {
  total_devices: number;
  android_devices: number;
  ios_devices: number;
  users_with_device: number;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total_count: number;
}

async function handle<T>(resp: Response, action: string): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`${action}: ${resp.status} ${text}`);
  }
  return resp.json();
}

export async function listCampaigns(page = 1, limit = 20): Promise<Paginated<Campaign>> {
  const resp = await fetchWithAuth(
    `${API_BASE_URL}/push/campaigns?page=${page}&limit=${limit}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } }
  );
  return handle(resp, 'Не удалось загрузить рассылки');
}

export async function getCampaign(id: number): Promise<Campaign> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/campaigns/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle(resp, 'Не удалось загрузить рассылку');
}

export async function getCampaignRuns(id: number): Promise<CampaignRun[]> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/campaigns/${id}/runs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle(resp, 'Не удалось загрузить историю доставок');
}

export async function createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(resp, 'Не удалось создать рассылку');
}

export async function updateCampaign(id: number, payload: UpdateCampaignPayload): Promise<Campaign> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/campaigns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(resp, 'Не удалось обновить рассылку');
}

export async function deleteCampaign(id: number): Promise<void> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/campaigns/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Не удалось удалить рассылку: ${resp.status} ${text}`);
  }
}

export async function sendCampaignNow(id: number): Promise<Campaign> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/campaigns/${id}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle(resp, 'Не удалось отправить рассылку');
}

export async function cancelCampaign(id: number): Promise<Campaign> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/campaigns/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle(resp, 'Не удалось отменить рассылку');
}

export async function getPushStats(): Promise<PushStats> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/stats`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle(resp, 'Не удалось загрузить статистику');
}

export async function previewAudience(audience: CampaignAudience): Promise<AudiencePreview> {
  const resp = await fetchWithAuth(`${API_BASE_URL}/push/campaigns/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(audience),
  });
  return handle(resp, 'Не удалось оценить охват');
}

// Языки push-рассылок должны совпадать с LangCode приложения.
export const PUSH_LANGS: { code: string; label: string }[] = [
  { code: 'ru', label: 'Русский' },
  { code: 'tj', label: 'Тоҷикӣ' },
  { code: 'uz', label: "O'zbek" },
  { code: 'en', label: 'English' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'ky', label: 'Кыргызча' },
];
