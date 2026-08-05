// src/lib/chapter.ts
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';

/**
 * A node of a book's table of contents.
 *
 * `anchor` is the id of the invisible marker embedded in the document at the
 * chapter's start. The reader locates that marker to jump to the chapter, which
 * is why a chapter without a marker in the document will never be reachable —
 * the editor always inserts one when creating a chapter.
 */
export interface Chapter {
  id: number;
  material_id: number;
  lang_code: string;
  doc_path: string;
  parent_id?: number;
  anchor: string;
  name: string;
  description: string;
  position: number;
  children?: Chapter[];
}

export interface CreateChapterPayload {
  material_id: number;
  lang_code: string;
  doc_path: string;
  parent_id?: number;
  /** Omit to let the server mint one and return it for insertion. */
  anchor?: string;
  name: string;
  description?: string;
  position?: number;
}

export interface UpdateChapterPayload {
  name?: string;
  description?: string;
  anchor?: string;
  position?: number;
  parent_id?: number;
  clear_parent?: boolean;
}

async function readError(response: Response, action: string): Promise<never> {
  const text = await response.text().catch(() => '');
  throw new Error(`${action}: ${response.status} ${text}`);
}

/** Returns the table of contents as a tree of top-level chapters. */
export async function getChapters(
  materialId: number,
  langCode: string,
  docPath: string
): Promise<Chapter[]> {
  const url =
    `${API_BASE_URL}/reader/chapters?material_id=${materialId}` +
    `&lang_code=${encodeURIComponent(langCode)}` +
    `&doc_path=${encodeURIComponent(docPath)}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await readError(response, 'Не удалось загрузить главы');

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createChapter(payload: CreateChapterPayload): Promise<Chapter> {
  const response = await fetchWithAuth(`${API_BASE_URL}/reader/chapter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await readError(response, 'Не удалось создать главу');
  return response.json();
}

export async function updateChapter(
  id: number,
  payload: UpdateChapterPayload
): Promise<Chapter> {
  const response = await fetchWithAuth(`${API_BASE_URL}/reader/chapter/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await readError(response, 'Не удалось обновить главу');
  return response.json();
}

/** Deletes a chapter together with every subchapter beneath it. */
export async function deleteChapter(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/reader/chapter/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await readError(response, 'Не удалось удалить главу');
}

export async function reorderChapters(
  items: { id: number; parent_id?: number; position: number }[]
): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/reader/chapters/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) await readError(response, 'Не удалось изменить порядок глав');
}

/**
 * Re-points a translation's chapters, bookmarks, quotes and reading progress at
 * a new document path.
 *
 * Replacing a material file stores the content under a freshly generated name,
 * so every save hands back a different path. Call this immediately after a
 * successful replacement, or the book's table of contents and every reader's
 * bookmarks detach from it.
 */
export async function rebindDocument(
  materialId: number,
  langCode: string,
  oldDocPath: string,
  newDocPath: string
): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/reader/document/rebind`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      material_id: materialId,
      lang_code: langCode,
      old_doc_path: oldDocPath,
      new_doc_path: newDocPath,
    }),
  });
  if (!response.ok) await readError(response, 'Не удалось перепривязать данные читалки');
}

/** Flattens the chapter tree, preserving order and recording each node's depth. */
export function flattenChapters(
  chapters: Chapter[],
  depth = 0
): { chapter: Chapter; depth: number }[] {
  return chapters.flatMap((chapter) => [
    { chapter, depth },
    ...flattenChapters(chapter.children || [], depth + 1),
  ]);
}

/** True for the document formats the in-app book reader can open. */
export function isBookDocument(path: string): boolean {
  const extension = path.split('?')[0].split('.').pop()?.toLowerCase();
  return extension === 'json' || extension === 'md';
}
