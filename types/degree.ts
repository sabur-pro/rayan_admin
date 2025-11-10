// src/types/degree.ts
export type LangCode = 'tj' | 'ru' | 'en' | 'uz' | 'kg' | 'kz';

export interface DegreeTranslation {
  lang_code: LangCode | string;
  name: string;
  description: string;
  status: string;
}

export interface DegreeItem {
  id: number;
  translations: DegreeTranslation[];
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface DegreeTranslationsResponse {
  data: DegreeItem[];
  page: number;
  limit: number;
  total_count: number;
}

/**
 * Request body for creating a degree
 */
export interface DegreeCreateRequest {
  translations: DegreeTranslation[];
}
