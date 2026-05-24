export interface CategorySeller {
  id: number;
  login: string;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  image_path: string;
  university_id?: number;
  university_name?: string;
  faculty_id?: number;
  faculty_name?: string;
  course_id?: number;
  course_number?: number;
  semester_id?: number;
  semester_number?: number;
  sellers: CategorySeller[];
}

export interface CategoryListResponse {
  data: Category[];
  page: number;
  limit: number;
  total_count: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  image_path?: string;
  university_id?: number;
  faculty_id?: number;
  course_id?: number;
  semester_id?: number;
  seller_ids?: number[];
}
