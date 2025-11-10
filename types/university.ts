// src/types/university.ts

export type LangCode = 'tj' | 'ru' | 'en' | 'uz' | 'kg' | "kz";

export interface UniversityTranslation {
  university_id?: number;
  lang_code: LangCode | string;
  name: string;
  description: string;
  status: 'Published' | 'Draft' | string;
}

export interface UniversityTranslationsResponse {
  data: UniversityTranslation[];
  page: number;
  limit: number;
  total_count: number;
}

/**
 * Тело запроса на создание университета
 */
export interface CreateUniversityRequest {
  translations: UniversityTranslation[];
}

/**
 * Ответ сервера при создании университета — структура может отличаться в API,
 * поэтому здесь базовая типизация. Подправьте при наличии реального ответа.
 */
export interface CreateUniversityResponse {
  id?: number | string;
  translations: UniversityTranslation[];
  // Дополнительные поля (например created_at) можно добавить при необходимости
}