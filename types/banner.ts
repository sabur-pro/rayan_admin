export interface Banner {
  id: number;
  image_path: string;
  description: string;
  link_type?: string;
  link_id?: number;
  university_id?: number;
  university_name?: string;
  faculty_id?: number;
  faculty_name?: string;
  course_id?: number;
  course_number?: number;
  semester_id?: number;
  semester_number?: number;
}

export interface BannerListResponse {
  data: Banner[];
  page: number;
  limit: number;
  total_count: number;
}
