// types/user.ts
export interface User {
  id: number;
  login: string;
  course_id: number;
  semester_id: number;
  university_id: number;
  faculty_id: number;
  lang_code: string;
  role: string;
  created_at: string;
  updated_at: string;
  faculty?: {
    id: number;
    subjects?: Array<{
      id: number;
      created_at: string;
      updated_at: string;
    }>;
  };
}

export interface UsersResponse {
  data: User[];
  page: number;
  limit: number;
  total_count: number;
}

export interface UsersQueryParams {
  page: number;
  limit: number;
  role?: string;
  lang_code?: string;
  course_id?: number;
  semester_id?: number;
  university_id?: number;
  faculty_id?: number;
  login?: string;
}

export type SubscriptionStatus = 'pending' | 'accepted' | 'denied';

export interface Subscription {
  id: number;
  start_date: string;
  end_date: string;
  description: string;
  price: number;
  proof_photo: string;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    login: string;
    course_id: number;
    semester_id: number;
    university_id: number;
    faculty_id: number;
    lang_code: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
}

export interface SubscriptionQueryParams {
  page: number;
  limit: number;
  start_date?: string;
  end_date?: string;
}
