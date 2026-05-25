'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Trash2,
  Calendar,
  X,
  Users,
  UserPlus,
  Pencil,
  Lock,
  PieChart,
  Receipt,
} from 'lucide-react';

import { AddIncomeModal } from './AddIncomeModal';
import { AddExpenseModal } from './AddExpenseModal';
import { FounderModal } from './FounderModal';
import { PayoutModal } from './PayoutModal';
import { MonthlyChart, IncomeSourcePie, ExpenseCategoryPie } from './FinanceCharts';
import {
  getFinanceStats,
  getTransactions,
  createTransaction,
  deleteTransaction,
  recordTax,
  getFounders,
  createFounder,
  updateFounder,
  deleteFounder,
  payoutFounder,
} from '@/lib/finance';
import type {
  FinanceStats,
  FinanceTransaction,
  Founder,
  ExpenseCategory,
} from '../../../../types/finance';
import {
  INCOME_SOURCE_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '../../../../types/finance';

const fmtMoney = (v: number) => `${Number(v || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} сом`;

function monthLabelRu(month: string): string {
  const [y, m] = month.split('-');
  const names = ['', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return `${names[parseInt(m, 10)] || m} ${y}`;
}

function categoryLabel(t: FinanceTransaction): string {
  if (t.type === 'income') {
    return INCOME_SOURCE_LABELS[t.category as keyof typeof INCOME_SOURCE_LABELS] || t.category;
  }
  return EXPENSE_CATEGORY_LABELS[t.category as keyof typeof EXPENSE_CATEGORY_LABELS] || t.category;
}

type Tab = 'overview' | 'transactions' | 'founders';

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');

  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null);
  const [payoutFor, setPayoutFor] = useState<Founder | null>(null);

  const loadStats = useCallback(async () => {
    const data = await getFinanceStats(dateFrom || undefined, dateTo || undefined);
    setStats(data);
  }, [dateFrom, dateTo]);

  const loadTransactions = useCallback(async () => {
    const data = await getTransactions({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      type: transactionFilter === 'all' ? undefined : transactionFilter,
      limit: 100,
    });
    setTransactions(data.data || []);
  }, [dateFrom, dateTo, transactionFilter]);

  const loadFounders = useCallback(async () => {
    setFounders((await getFounders()) ?? []);
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadStats(), loadTransactions(), loadFounders()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadTransactions, loadFounders]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };
  const hasDateFilter = Boolean(dateFrom || dateTo);

  // ---- handlers ----
  const handleAddIncome = async (data: { amount: number; description: string; date: string }) => {
    await createTransaction({
      type: 'income',
      category: 'manual',
      amount: data.amount,
      description: data.description,
      occurred_at: data.date,
    });
    await Promise.all([loadStats(), loadTransactions(), loadFounders()]);
  };

  const handleAddExpense = async (data: {
    category: ExpenseCategory;
    amount: number;
    description: string;
    date: string;
  }) => {
    await createTransaction({
      type: 'expense',
      category: data.category,
      amount: data.amount,
      description: data.description,
      occurred_at: data.date,
    });
    await Promise.all([loadStats(), loadTransactions(), loadFounders()]);
  };

  const handleDeleteTransaction = async (t: FinanceTransaction) => {
    if (t.locked) return;
    if (!confirm('Удалить эту транзакцию? Доли основателей будут пересчитаны.')) return;
    try {
      await deleteTransaction(t.id);
      await Promise.all([loadStats(), loadTransactions(), loadFounders()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось удалить');
    }
  };

  const handleRecordTax = async (month: string) => {
    if (!confirm(`Записать налог за ${monthLabelRu(month)} как расход?`)) return;
    try {
      await recordTax(month);
      await Promise.all([loadStats(), loadTransactions(), loadFounders()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось записать налог');
    }
  };

  const handleSaveFounder = async (data: { name: string; share: number }) => {
    if (editingFounder) {
      await updateFounder(editingFounder.id, data);
    } else {
      await createFounder(data.name, data.share);
    }
    await loadFounders();
  };

  const handleDeleteFounder = async (f: Founder) => {
    if (!confirm(`Удалить основателя «${f.name}»? История его долей будет удалена.`)) return;
    try {
      await deleteFounder(f.id);
      await loadFounders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось удалить');
    }
  };

  const handlePayout = async (amount: number, description: string) => {
    if (!payoutFor) return;
    await payoutFounder(payoutFor.id, amount, description);
    await loadFounders();
  };

  const totalShare = founders.reduce((sum, f) => sum + f.share, 0);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Финансы</h1>
          <p className="text-muted-foreground">Доходы, расходы, налоги и доли основателей</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Доход
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <Minus className="h-4 w-4" />
            Расход
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit flex-wrap">
        {([
          ['overview', 'Обзор'],
          ['transactions', `Транзакции`],
          ['founders', `Основатели (${founders.length})`],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      {activeTab !== 'founders' && (
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Период</p>
                  <p className="text-sm font-medium">
                    {hasDateFilter ? `${dateFrom || '...'} — ${dateTo || '...'}` : 'Всё время'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    setDateFrom(firstDay.toISOString().split('T')[0]);
                    setDateTo(today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  Этот месяц
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                    setDateFrom(lastMonth.toISOString().split('T')[0]);
                    setDateTo(lastDay.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
                >
                  Прошлый месяц
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), 0, 1);
                    setDateFrom(firstDay.toISOString().split('T')[0]);
                    setDateTo(today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
                >
                  Этот год
                </button>
              </div>

              <div className="hidden md:block w-px h-8 bg-border" />

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground rotate-45" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {hasDateFilter && (
                <button
                  onClick={clearDateFilter}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-sm ml-auto"
                >
                  <X className="h-4 w-4" />
                  Сбросить
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================== OVERVIEW ===================== */}
      {activeTab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Общий доход"
              value={fmtMoney(stats.total_income)}
              color="green"
              icon={<TrendingUp className="h-6 w-6 text-green-500" />}
              sub={`Магазин: ${fmtMoney(stats.income_by_source?.market || 0)}`}
            />
            <StatCard
              title="Общий расход"
              value={fmtMoney(stats.total_expense)}
              color="red"
              icon={<TrendingDown className="h-6 w-6 text-red-500" />}
              sub="Включая налоги"
            />
            <StatCard
              title="Налог к оплате"
              value={fmtMoney(stats.tax.remaining)}
              color="yellow"
              icon={<Wallet className="h-6 w-6 text-yellow-500" />}
              sub={`Начислено: ${fmtMoney(stats.tax.computed)}`}
            />
            <StatCard
              title="Чистая прибыль"
              value={fmtMoney(stats.net_profit)}
              color="blue"
              icon={<TrendingUp className="h-6 w-6 text-blue-500" />}
              sub="Доход − расход"
            />
          </div>

          {/* Charts */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Доходы и расходы по месяцам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyChart data={stats.monthly} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Доходы по источникам
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeSourcePie data={stats.income_by_source} />
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Расходы по категориям
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseCategoryPie data={stats.expense_by_category} />
              </CardContent>
            </Card>
          </div>

          {/* Tax by month */}
          <Card className="glass border-2 border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Налог по месяцам (202 сом + 6% от оборота; при обороте {'>'} 20200 — 7% без фикс. части)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(stats.tax.months?.length ?? 0) === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Нет оборота за период</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Месяц</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Оборот</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Ставка</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Начислено</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Оплачено</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">К оплате</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(stats.tax.months ?? []).map((m) => (
                        <tr key={m.month} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{monthLabelRu(m.month)}</td>
                          <td className="px-4 py-3 text-sm">{fmtMoney(m.turnover)}</td>
                          <td className="px-4 py-3 text-sm">
                            {(m.rate * 100).toFixed(0)}%{m.fixed > 0 ? ` + ${m.fixed} сом` : ''}
                          </td>
                          <td className="px-4 py-3 text-sm">{fmtMoney(m.computed)}</td>
                          <td className="px-4 py-3 text-sm text-green-600">{fmtMoney(m.paid)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-yellow-600">
                            {fmtMoney(m.remaining)}
                          </td>
                          <td className="px-4 py-3">
                            {m.remaining > 0 ? (
                              <button
                                onClick={() => handleRecordTax(m.month)}
                                className="px-3 py-1.5 rounded-md bg-yellow-500 text-white text-xs hover:bg-yellow-600 transition-colors"
                              >
                                Записать налог
                              </button>
                            ) : (
                              <span className="text-xs text-green-600">Оплачено</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 font-bold">
                        <td className="px-4 py-3 text-sm">ИТОГО</td>
                        <td className="px-4 py-3 text-sm" colSpan={2}></td>
                        <td className="px-4 py-3 text-sm">{fmtMoney(stats.tax.computed)}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{fmtMoney(stats.tax.paid)}</td>
                        <td className="px-4 py-3 text-sm text-yellow-600">{fmtMoney(stats.tax.remaining)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ===================== TRANSACTIONS ===================== */}
      {activeTab === 'transactions' && (
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Транзакции
              </CardTitle>
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value as 'all' | 'income' | 'expense')}
                className="px-3 py-1.5 rounded-md border bg-transparent text-sm"
              >
                <option value="all">Все</option>
                <option value="income">Доходы</option>
                <option value="expense">Расходы</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Нет транзакций</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Тип</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Категория</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Описание</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Сумма</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Дата</th>
                      <th className="px-4 py-3 text-left text-sm font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              t.type === 'income'
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            {t.type === 'income' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {t.type === 'income' ? 'Доход' : 'Расход'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{categoryLabel(t)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{t.description}</td>
                        <td
                          className={`px-4 py-3 text-sm font-semibold ${
                            t.type === 'income' ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {fmtMoney(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(t.occurred_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-4 py-3">
                          {t.locked ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                              title="Авто-запись (магазин/подписка). Удаление недоступно."
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteTransaction(t)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===================== FOUNDERS ===================== */}
      {activeTab === 'founders' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-muted-foreground">
              Распределено долей: <span className="font-semibold">{totalShare.toFixed(2)}%</span>
              {totalShare !== 100 && (
                <span className="ml-2 text-yellow-600">
                  (нераспределённая доля компании: {(100 - totalShare).toFixed(2)}%)
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setEditingFounder(null);
                setShowFounderModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <UserPlus className="h-4 w-4" />
              Добавить основателя
            </button>
          </div>

          {founders.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-10 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                Пока нет основателей. Добавьте первого, чтобы доходы и расходы
                распределялись по долям.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {founders.map((f) => (
                <Card key={f.id} className="glass border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{f.name}</h3>
                        <p className="text-sm text-muted-foreground">Доля: {f.share}%</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingFounder(f);
                            setShowFounderModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFounder(f)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Баланс к выплате</p>
                        <p className="text-3xl font-bold">{fmtMoney(f.balance)}</p>
                      </div>
                      <button
                        onClick={() => setPayoutFor(f)}
                        disabled={f.balance <= 0}
                        className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Выплатить
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddIncomeModal isOpen={showIncomeModal} onClose={() => setShowIncomeModal(false)} onSubmit={handleAddIncome} />
      <AddExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} onSubmit={handleAddExpense} />
      <FounderModal
        isOpen={showFounderModal}
        onClose={() => setShowFounderModal(false)}
        founder={editingFounder}
        takenShare={totalShare - (editingFounder?.share || 0)}
        onSubmit={handleSaveFounder}
      />
      <PayoutModal
        isOpen={Boolean(payoutFor)}
        onClose={() => setPayoutFor(null)}
        founder={payoutFor}
        onSubmit={handlePayout}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  icon,
  sub,
}: {
  title: string;
  value: string;
  color: 'green' | 'red' | 'yellow' | 'blue';
  icon: React.ReactNode;
  sub?: string;
}) {
  const border = {
    green: 'border-l-green-500',
    red: 'border-l-red-500',
    yellow: 'border-l-yellow-500',
    blue: 'border-l-blue-500',
  }[color];
  const text = {
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
  }[color];
  const bg = {
    green: 'bg-green-500/10',
    red: 'bg-red-500/10',
    yellow: 'bg-yellow-500/10',
    blue: 'bg-blue-500/10',
  }[color];

  return (
    <Card className={`glass border-l-4 ${border}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={`text-2xl font-bold ${text}`}>{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full ${bg} flex items-center justify-center`}>{icon}</div>
        </div>
        {sub && <div className="mt-3 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
