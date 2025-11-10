// src/types/subject.ts
export interface Subject {
  id: number;
  semester_id: number;
  course_id: number;
  created_at: string;
  updated_at: string;
  translations: Array<{
    lang_code: string;
    name: string;
    description: string;
    status: string;
  }>;
  faculties: Array<any>;
  materials: Array<any>;
}

export interface SubjectResponse {
  data: Subject[];
  page: number;
  limit: number;
  total_count: number;
}
