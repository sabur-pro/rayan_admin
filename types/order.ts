export interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  cost_price: number;
  quantity: number;
  image: string;
  seller_id: number;
}

export interface Order {
  id: number;
  user_id: number;
  user_phone?: string;
  total_price: number;
  total_cost_price: number;
  profit: number;
  status: string;
  comment: string;
  phone: string;
  address: string;
  payment_method: 'cash' | 'card';
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  data: Order[];
  page: number;
  limit: number;
  total_count: number;
}
