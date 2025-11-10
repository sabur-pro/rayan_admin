// src/types/course.ts
export interface Course {
  id: number;
  number: number;
  created_at: string;
  updated_at: string;
  translations: Array<{
    lang_code: string;
    name: string;
    description: string;
    status: string;
  }>;
}

export interface CourseResponse {
  data: Course[];
  page: number;
  limit: number;
  total_count: number;
}
