export type FinanceType = 'income' | 'expense';

export type IncomeSource = 'market' | 'subscription' | 'manual';
export type ExpenseCategory = 'server' | 'materials' | 'salary' | 'rent' | 'tax' | 'other';

export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  market: 'Магазин',
  subscription: 'Подписки',
  manual: 'Прочий доход',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  server: 'Сервер/Хостинг',
  materials: 'Создание материалов',
  salary: 'Зарплата',
  rent: 'Аренда',
  tax: 'Налог',
  other: 'Прочее',
};

export interface FinanceTransaction {
  id: number;
  type: FinanceType;
  category: string;
  amount: number;
  description: string;
  occurred_at: string;
  order_id?: number;
  subscription_id?: number;
  tax_period?: string;
  locked: boolean;
  created_at: string;
}

export interface TransactionListResponse {
  data: FinanceTransaction[];
  page: number;
  limit: number;
  total_count: number;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

export interface TaxMonth {
  month: string;
  turnover: number;
  rate: number;
  fixed: number;
  computed: number;
  paid: number;
  remaining: number;
}

export interface TaxSummary {
  computed: number;
  paid: number;
  remaining: number;
  months: TaxMonth[];
}

export interface FinanceStats {
  total_income: number;
  total_expense: number;
  net_profit: number;
  income_by_source: Record<string, number>;
  expense_by_category: Record<string, number>;
  monthly: MonthlyPoint[];
  tax: TaxSummary;
}

export interface Founder {
  id: number;
  name: string;
  share: number;
  balance: number;
  joined_at: string;
}

export interface FounderLedgerEntry {
  id: number;
  type: 'distribution' | 'payout';
  amount: number;
  description: string;
  transaction_id?: number;
  occurred_at: string;
}

export interface FounderLedgerResponse {
  data: FounderLedgerEntry[];
  page: number;
  limit: number;
  total_count: number;
}

export interface CreateTransactionPayload {
  type: FinanceType;
  category: string;
  amount: number;
  description?: string;
  occurred_at?: string;
}
