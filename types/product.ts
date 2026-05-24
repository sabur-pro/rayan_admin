export interface Product {
  id: number;
  name: string;
  description: string;
  cost_price: number;
  price: number;
  stock: number;
  images: string[];
  rating: number;
  tag: string;
  category_id: number;
  priority: number;
  university_id?: number;
  university_name?: string;
  faculty_id?: number;
  faculty_name?: string;
  course_id?: number;
  course_number?: number;
  semester_id?: number;
  semester_number?: number;
  is_active: boolean;
  seller_id: number;
}

export interface ProductListResponse {
  data: Product[];
  page: number;
  limit: number;
  total_count: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  cost_price?: number;
  price?: number;
  stock?: number;
  tag?: string;
  category_id?: number;
  priority?: number;
  university_id?: number;
  faculty_id?: number;
  course_id?: number;
  semester_id?: number;
  is_active?: boolean;
}
