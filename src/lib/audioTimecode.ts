// src/lib/audioTimecode.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';

export interface AudioTimecode {
  id: number;
  material_id: number;
  lang_code: string;
  audio_path: string;
  seconds: number;
  label: string;
  comment: string;
  position: number;
}

export interface CreateAudioTimecodePayload {
  material_id: number;
  lang_code: string;
  audio_path: string;
  seconds: number;
  label: string;
  comment?: string;
  position?: number;
}

export interface UpdateAudioTimecodePayload {
  seconds?: number;
  label?: string;
  comment?: string;
  position?: number;
}

/** Получить таймкоды конкретного аудиофайла материала. */
export async function getAudioTimecodes(
  materialId: number,
  langCode: string,
  audioPath: string
): Promise<AudioTimecode[]> {
  const url = `${API_BASE_URL}/material/audio/timecodes?material_id=${materialId}&lang_code=${encodeURIComponent(
    langCode
  )}&audio_path=${encodeURIComponent(audioPath)}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Не удалось загрузить таймкоды: ${response.status} ${text}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createAudioTimecode(
  payload: CreateAudioTimecodePayload
): Promise<AudioTimecode> {
  const response = await fetchWithAuth(`${API_BASE_URL}/material/audio/timecode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Не удалось создать таймкод: ${response.status} ${text}`);
  }

  return response.json();
}

export async function updateAudioTimecode(
  id: number,
  payload: UpdateAudioTimecodePayload
): Promise<AudioTimecode> {
  const response = await fetchWithAuth(`${API_BASE_URL}/material/audio/timecode/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Не удалось обновить таймкод: ${response.status} ${text}`);
  }

  return response.json();
}

export async function deleteAudioTimecode(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/material/audio/timecode/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Не удалось удалить таймкод: ${response.status} ${text}`);
  }
}

/** "1:05" / "83" / "1:02:03" -> секунды. Возвращает null при неверном формате. */
export function parseTimecode(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  const parts = trimmed.split(':').map((p) => p.trim());
  if (parts.some((p) => p === '' || !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  let seconds = 0;
  for (const n of nums) seconds = seconds * 60 + n;
  return seconds;
}

/** Секунды -> "1:05" / "1:02:03". */
export function formatTimecode(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
