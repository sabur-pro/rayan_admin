import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type { Project, ProjectInput, ProjectsResponse } from '../../types/project';

async function failure(res: Response, what: string): Promise<never> {
  const text = await res.text().catch(() => '');
  throw new Error(`${what}: ${res.status} ${text}`);
}

export async function getProjects(page = 1, limit = 100): Promise<ProjectsResponse> {
  const res = await fetchWithAuth(`${API_BASE_URL}/project?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return failure(res, 'Не удалось загрузить проекты');
  return res.json();
}

export async function getProject(id: number): Promise<Project> {
  const res = await fetchWithAuth(`${API_BASE_URL}/project/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return failure(res, 'Не удалось загрузить проект');
  return res.json();
}

export async function createProject(data: ProjectInput): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return failure(res, 'Не удалось создать проект');
}

export async function updateProject(id: number, data: ProjectInput): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/project/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) return failure(res, 'Не удалось сохранить проект');
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/project/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return failure(res, 'Не удалось удалить проект');
}

/** Uploads one picture and returns its public URL, ready to go into `images`. */
export async function uploadProjectImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const res = await fetchWithAuth(`${API_BASE_URL}/project/image`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) return failure(res, `Не удалось загрузить «${file.name}»`);
  const json = (await res.json()) as { url: string };
  return json.url;
}
