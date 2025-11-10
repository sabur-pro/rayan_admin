// src/types/semester.ts
export interface Semester {
  ID: number;
  Number: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface SemesterResponse {
  data: Semester[];
  page: number;
  limit: number;
  total_count: number;
}
