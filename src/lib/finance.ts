import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import type {
  FinanceStats,
  TransactionListResponse,
  FinanceTransaction,
  Founder,
  FounderLedgerResponse,
  CreateTransactionPayload,
} from '../../types/finance';

async function handle<T>(res: Response, action: string): Promise<T> {
  if (!res.ok) {
    let message = `${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message || `Failed to ${action}`);
  }
  return res.json() as Promise<T>;
}

function dateParams(dateFrom?: string, dateTo?: string): string {
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const s = params.toString();
  return s ? `&${s}` : '';
}

export async function getFinanceStats(dateFrom?: string, dateTo?: string): Promise<FinanceStats> {
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/stats?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle<FinanceStats>(res, 'fetch stats');
}

export async function getTransactions(opts: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<TransactionListResponse> {
  const { page = 1, limit = 50, type, category, dateFrom, dateTo } = opts;
  let url = `${API_BASE_URL}/finance/transactions?page=${page}&limit=${limit}`;
  if (type) url += `&type=${type}`;
  if (category) url += `&category=${category}`;
  url += dateParams(dateFrom, dateTo);
  const res = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle<TransactionListResponse>(res, 'fetch transactions');
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<FinanceTransaction> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle<FinanceTransaction>(res, 'create transaction');
}

export async function deleteTransaction(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/transactions/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  await handle<unknown>(res, 'delete transaction');
}

export async function recordTax(month: string): Promise<FinanceTransaction> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/tax/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month }),
  });
  return handle<FinanceTransaction>(res, 'record tax');
}

export async function getFounders(): Promise<Founder[]> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/founders`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle<Founder[]>(res, 'fetch founders');
}

export async function createFounder(name: string, share: number): Promise<Founder> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/founders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, share }),
  });
  return handle<Founder>(res, 'create founder');
}

export async function updateFounder(id: number, data: { name?: string; share?: number }): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/founders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await handle<unknown>(res, 'update founder');
}

export async function deleteFounder(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/founders/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  await handle<unknown>(res, 'delete founder');
}

export async function payoutFounder(id: number, amount: number, description?: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/founders/${id}/payout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, description }),
  });
  await handle<unknown>(res, 'record payout');
}

export async function getFounderLedger(id: number, page = 1, limit = 50): Promise<FounderLedgerResponse> {
  const res = await fetchWithAuth(`${API_BASE_URL}/finance/founders/${id}/ledger?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handle<FounderLedgerResponse>(res, 'fetch founder ledger');
}
