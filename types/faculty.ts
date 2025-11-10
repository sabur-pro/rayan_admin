// src/types/faculty.ts
export interface Faculty {
  id: number;
  university_id: number;
  created_at: string;
  updated_at: string;
  translations: FacultyTranslation[];
}

export interface FacultyTranslation {
  faculty_id: number;
  name: string;
  description: string;
  status: string;
}

export interface FacultyResponse {
  data: Faculty[];
  page: number;
  limit: number;
  total_count: number;
}