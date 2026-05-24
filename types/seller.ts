export interface Seller {
  id: number;
  login: string;
  name: string;
  can_create_banner: boolean;
  created_at: string;
  updated_at: string;
}

export interface SellerListResponse {
  data: Seller[];
  page: number;
  limit: number;
  total_count: number;
}

export interface CreateSellerRequest {
  login: string;
  password: string;
  name: string;
  can_create_banner: boolean;
}

export interface UpdateSellerRequest {
  login?: string;
  name?: string;
  can_create_banner?: boolean;
}
