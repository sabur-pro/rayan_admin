'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
  Plus,
  Minus,
  Trash2,
  Settings,
  Clock,
  Calendar,
  X
} from 'lucide-react';

import { useFinanceStorage } from './useFinanceStorage';
import { AddIncomeModal } from './AddIncomeModal';
import { AddExpenseModal } from './AddExpenseModal';
import { ManageAccountsModal } from './ManageAccountsModal';
import {
  SUBSCRIPTION_LABELS,
  SUBSCRIPTION_PRICES,
  EXPENSE_CATEGORY_LABELS,
  TAX_RATE
} from './types';

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts'>('overview');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Date filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Modals
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  // Finance storage hook
  const {
    transactions,
    accounts,
    isLoaded,
    addTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    getStats,
    getFilteredTransactions,
  } = useFinanceStorage();

  // Filter transactions by date
  const dateFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  // Calculated stats (with date filter)
  const stats = useMemo(() => {
    const filtered = dateFilteredTransactions;
    const incomeTransactions = filtered.filter(t => t.type === 'income');
    const expenseTransactions = filtered.filter(t => t.type === 'expense' && t.category !== 'tax');
    const taxTransactions = filtered.filter(t => t.type === 'expense' && t.category === 'tax');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const taxAmount = taxTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpense - taxAmount;

    // Расшифровка по подпискам
    const subscriptionBreakdown = {
      yearly: { count: 0, total: 0 },
      halfYearly: { count: 0, total: 0 },
      monthly: { count: 0, total: 0 },
      custom: { count: 0, total: 0 },
    };

    incomeTransactions.forEach(t => {
      const subType = t.subscriptionType || 'custom';
      subscriptionBreakdown[subType].count++;
      subscriptionBreakdown[subType].total += t.amount;
    });

    return {
      totalIncome,
      totalExpense: totalExpense + taxAmount,
      taxRate: TAX_RATE,
      taxAmount,
      netProfit,
      subscriptionBreakdown,
    };
  }, [dateFilteredTransactions]);

  const filteredTransactions = useMemo(
    () => dateFilteredTransactions
      .filter(t => transactionFilter === 'all' || t.type === transactionFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [dateFilteredTransactions, transactionFilter]
  );

  // Clear date filter
  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  const hasDateFilter = dateFrom || dateTo;

  // Export report to CSV
  const exportReport = () => {
    const periodText = hasDateFilter
      ? `${dateFrom || 'начало'} — ${dateTo || 'конец'}`
      : 'Все время';

    // Build CSV content
    let csv = '\ufeff'; // BOM for Excel
    csv += `Финансовый отчёт\n`;
    csv += `Период: ${periodText}\n`;
    csv += `Дата создания: ${new Date().toLocaleDateString('ru-RU')}\n\n`;

    csv += `СВОДКА\n`;
    csv += `Общий доход;${stats.totalIncome.toFixed(2)} сом\n`;
    csv += `Общий расход;${stats.totalExpense.toFixed(2)} сом\n`;
    csv += `Налог 6%;${suggestedTax.toFixed(2)} сом\n`;
    csv += `Чистая прибыль;${stats.netProfit.toFixed(2)} сом\n\n`;

    csv += `ТРАНЗАКЦИИ\n`;
    csv += `Дата;Тип;Описание;Сумма;Счёт\n`;

    filteredTransactions.forEach(t => {
      const account = accounts.find(a => a.id === t.accountId);
      csv += `${t.date};${t.type === 'income' ? 'Доход' : 'Расход'};${t.description};${t.amount.toFixed(2)};${account?.name || '-'}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_report_${dateFrom || 'all'}_${dateTo || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate suggested tax
  const suggestedTax = Math.round(stats.totalIncome * TAX_RATE * 100) / 100;
  const paidTax = stats.taxAmount;
  const remainingTax = Math.max(0, suggestedTax - paidTax);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Выполнено';
      case 'pending': return 'Ожидает';
      case 'failed': return 'Отклонено';
      default: return status;
    }
  };

  // Handle add income
  const handleAddIncome = (data: {
    description: string;
    amount: number;
    date: string;
    accountId: string;
    subscriptionType: 'yearly' | 'halfYearly' | 'monthly' | 'custom';
  }) => {
    addTransaction('income', {
      ...data,
    });
  };

  // Handle add expense
  const handleAddExpense = (data: {
    description: string;
    amount: number;
    date: string;
    accountId: string;
    category: 'server' | 'advertising' | 'salary' | 'tax' | 'other';
  }) => {
    addTransaction('expense', data);
  };

  // Handle delete transaction
  const handleDeleteTransaction = (id: string) => {
    if (confirm('Удалить эту транзакцию? Баланс счёта будет обновлён.')) {
      deleteTransaction(id);
    }
  };

  // Quick add tax expense
  const handleAddTaxExpense = () => {
    if (remainingTax <= 0) return;
    const defaultAccount = accounts[0];
    if (!defaultAccount) return;

    addTransaction('expense', {
      description: `Налог 6% от дохода (${stats.totalIncome} сом)`,
      amount: remainingTax,
      date: new Date().toISOString().split('T')[0],
      accountId: defaultAccount.id,
      category: 'tax',
    });
  };

  if (!isLoaded) {
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
          <p className="text-muted-foreground">Управление финансами и транзакциями</p>
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
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
        >
          Обзор
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'transactions' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
        >
          Транзакции ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'accounts' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
        >
          Счета ({accounts.length})
        </button>
      </div>

      {/* Date Filter - hide on accounts tab */}
      {activeTab !== 'accounts' && (
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Period Label */}
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Период отчёта</p>
                  <p className="text-sm font-medium">
                    {hasDateFilter
                      ? `${dateFrom || '...'} — ${dateTo || '...'}`
                      : 'Все время'
                    }
                  </p>
                </div>
              </div>

              {/* Preset Buttons */}
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

              {/* Divider */}
              <div className="hidden md:block w-px h-8 bg-border" />

              {/* Date Inputs */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute -top-2 left-2 px-1 text-[10px] text-muted-foreground bg-card">От</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[140px]"
                  />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground rotate-45" />
                <div className="relative">
                  <span className="absolute -top-2 left-2 px-1 text-[10px] text-muted-foreground bg-card">До</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[140px]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                {hasDateFilter && (
                  <button
                    onClick={clearDateFilter}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-sm"
                  >
                    <X className="h-4 w-4" />
                    Сбросить
                  </button>
                )}
                <button
                  onClick={exportReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  Скачать отчёт
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            {hasDateFilter && (
              <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Доход:</span>
                  <span className="font-medium text-green-500">+{stats.totalIncome.toFixed(2)} сом</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Расход:</span>
                  <span className="font-medium text-red-500">-{stats.totalExpense.toFixed(2)} сом</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Прибыль:</span>
                  <span className="font-medium text-blue-500">{stats.netProfit.toFixed(2)} сом</span>
                </div>
                <div className="ml-auto text-muted-foreground">
                  {filteredTransactions.length} транзакций
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Общий доход</p>
                    <p className="text-2xl font-bold text-green-500">{stats.totalIncome.toLocaleString()} сом</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {Object.values(stats.subscriptionBreakdown).reduce((sum, s) => sum + s.count, 0)} транзакций
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Общий расход</p>
                    <p className="text-2xl font-bold text-red-500">{stats.totalExpense.toLocaleString()} сом</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Включая налоги
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Налог (6%)</p>
                    <p className="text-2xl font-bold text-yellow-500">{suggestedTax.toLocaleString()} сом</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <div className="mt-3 text-xs">
                  {paidTax > 0 && (
                    <span className="text-green-500">Оплачено: {paidTax} сом</span>
                  )}
                  {remainingTax > 0 && (
                    <span className="text-yellow-500 ml-2">К оплате: {remainingTax} сом</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Чистая прибыль</p>
                    <p className="text-2xl font-bold text-blue-500">{stats.netProfit.toLocaleString()} сом</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  После вычета расходов
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Breakdown */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Расшифровка доходов по подпискам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Тип подписки</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Цена</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Количество</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Итого</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(['yearly', 'halfYearly', 'monthly', 'custom'] as const).map((type) => {
                      const data = stats.subscriptionBreakdown[type];
                      if (data.count === 0) return null;
                      return (
                        <tr key={type} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{SUBSCRIPTION_LABELS[type]}</td>
                          <td className="px-4 py-3 text-sm">
                            {type !== 'custom' ? `${SUBSCRIPTION_PRICES[type]} сом` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm">{data.count} шт.</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-500">
                            {data.total.toFixed(2)} сом
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-muted/50 font-bold">
                      <td className="px-4 py-3 text-sm" colSpan={2}>ИТОГО ДОХОД</td>
                      <td className="px-4 py-3 text-sm">
                        {Object.values(stats.subscriptionBreakdown).reduce((sum, s) => sum + s.count, 0)} шт.
                      </td>
                      <td className="px-4 py-3 text-sm text-green-500">{stats.totalIncome.toFixed(2)} сом</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tax Summary */}
          <Card className="glass border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Сводка для налоговой отчётности
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                    <span className="text-sm">Общий доход:</span>
                    <span className="font-bold text-green-500">+{stats.totalIncome.toFixed(2)} сом</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-red-500/10">
                    <span className="text-sm">Расходы (без налога):</span>
                    <span className="font-bold text-red-500">-{(stats.totalExpense - stats.taxAmount).toFixed(2)} сом</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-500/10">
                    <span className="text-sm">Налог 6% (оплачено):</span>
                    <span className="font-bold text-yellow-500">-{stats.taxAmount.toFixed(2)} сом</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10 border-2 border-blue-500/30">
                    <span className="text-sm font-bold">Чистая прибыль:</span>
                    <span className="font-bold text-blue-500">{stats.netProfit.toFixed(2)} сом</span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Расчёт налога:</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Налоговая база: {stats.totalIncome.toFixed(2)} сом</p>
                    <p>• Ставка налога: {TAX_RATE * 100}%</p>
                    <p>• Сумма налога: {stats.totalIncome.toFixed(2)} × {TAX_RATE} = <strong>{suggestedTax.toFixed(2)} сом</strong></p>
                    {paidTax > 0 && <p className="text-green-500">• Уже оплачено: {paidTax.toFixed(2)} сом</p>}
                  </div>
                  {remainingTax > 0 && (
                    <button
                      onClick={handleAddTaxExpense}
                      className="mt-4 w-full px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors text-sm"
                    >
                      Записать налог {remainingTax.toFixed(2)} сом
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Последние транзакции
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Нет транзакций</p>
                  <p className="text-sm mt-2">Добавьте первый доход или расход</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}>
                          {t.type === 'income' ? (
                            <ArrowUpRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{t.description}</p>
                          <p className="text-xs text-muted-foreground">{t.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)} сом
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getStatusIcon(t.status)}
                            <span>{getStatusLabel(t.status)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 transition-all"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )
      }

      {/* Transactions Tab */}
      {
        activeTab === 'transactions' && (
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Все транзакции
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={transactionFilter}
                    onChange={(e) => setTransactionFilter(e.target.value as 'all' | 'income' | 'expense')}
                    className="px-3 py-1 rounded-md border bg-transparent text-sm"
                  >
                    <option value="all">Все</option>
                    <option value="income">Приходы</option>
                    <option value="expense">Расходы</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Нет транзакций</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Тип</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Описание</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Сумма</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Дата</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Счёт</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTransactions.map((t) => {
                        const account = accounts.find(a => a.id === t.accountId);
                        return (
                          <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                }`}>
                                {t.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {t.type === 'income' ? 'Приход' : 'Расход'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{t.description}</td>
                            <td className={`px-4 py-3 text-sm font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                              {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)} сом
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{t.date}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {account?.name || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {/* Accounts Tab */}
      {
        activeTab === 'accounts' && (
          <>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAccountsModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                Управление счетами
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((account) => (
                <Card key={account.id} className="glass border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{account.name}</h3>
                        <p className="text-sm text-muted-foreground">{account.bank}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Баланс</p>
                        <p className="text-3xl font-bold">{account.balance.toLocaleString()} {account.currency}</p>
                      </div>
                      <div className="flex gap-2 pt-3 border-t">
                        <button
                          onClick={() => {
                            setShowIncomeModal(true);
                          }}
                          className="flex-1 px-3 py-2 rounded-md bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                        >
                          + Пополнить
                        </button>
                        <button
                          onClick={() => {
                            setShowExpenseModal(true);
                          }}
                          className="flex-1 px-3 py-2 rounded-md bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                        >
                          − Расход
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Account Card */}
              <Card
                onClick={() => setShowAccountsModal(true)}
                className="glass border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Добавить новый счёт</p>
                </CardContent>
              </Card>
            </div>
          </>
        )
      }

      {/* Modals */}
      <AddIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        accounts={accounts}
        onSubmit={handleAddIncome}
      />

      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        accounts={accounts}
        onSubmit={handleAddExpense}
      />

      <ManageAccountsModal
        isOpen={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        accounts={accounts}
        onAddAccount={addAccount}
        onUpdateAccount={updateAccount}
        onDeleteAccount={deleteAccount}
      />
    </div>
  );
}
