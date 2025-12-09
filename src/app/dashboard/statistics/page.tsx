'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

// Моковые данные для демонстрации
const mockStats = {
  totalIncome: 125840,
  totalExpense: 45320,
  balance: 80520,
  pendingPayments: 12500,
  monthlyGrowth: 23.5,
};

const mockTransactions = [
  { id: 1, type: 'income', description: 'Подписка Premium - Алиев А.', amount: 299, date: '2025-12-08', status: 'completed' },
  { id: 2, type: 'income', description: 'Подписка Standard - Каримов Б.', amount: 199, date: '2025-12-08', status: 'completed' },
  { id: 3, type: 'expense', description: 'Оплата сервера', amount: 1500, date: '2025-12-07', status: 'completed' },
  { id: 4, type: 'income', description: 'Подписка Premium - Рахимов В.', amount: 299, date: '2025-12-07', status: 'pending' },
  { id: 5, type: 'expense', description: 'Реклама в Telegram', amount: 500, date: '2025-12-06', status: 'completed' },
  { id: 6, type: 'income', description: 'Подписка Standard - Сафаров Г.', amount: 199, date: '2025-12-06', status: 'completed' },
  { id: 7, type: 'income', description: 'Подписка Premium - Назаров Д.', amount: 299, date: '2025-12-05', status: 'failed' },
  { id: 8, type: 'expense', description: 'Зарплата модератору', amount: 3000, date: '2025-12-05', status: 'completed' },
];

const mockAccounts = [
  { id: 1, name: 'Основной счёт', bank: 'Амонатбонк', balance: 65000, currency: 'TJS' },
  { id: 2, name: 'Резервный счёт', bank: 'Ориёнбонк', balance: 15520, currency: 'TJS' },
];

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts'>('overview');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = mockTransactions.filter((t) => {
    if (transactionFilter === 'all') return true;
    return t.type === transactionFilter;
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Финансы</h1>
          <p className="text-muted-foreground">Управление финансами и транзакциями</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors">
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'overview' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Обзор
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'transactions' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Транзакции
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'accounts' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Счета
        </button>
      </div>

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
                    <p className="text-2xl font-bold text-green-500">{mockStats.totalIncome.toLocaleString()} сом</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+{mockStats.monthlyGrowth}% за месяц</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Общий расход</p>
                    <p className="text-2xl font-bold text-red-500">{mockStats.totalExpense.toLocaleString()} сом</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-red-500">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>-8.2% за месяц</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Баланс</p>
                    <p className="text-2xl font-bold text-blue-500">{mockStats.balance.toLocaleString()} сом</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Доступно для вывода
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ожидает</p>
                    <p className="text-2xl font-bold text-yellow-500">{mockStats.pendingPayments.toLocaleString()} сом</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Ожидает подтверждения
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Последние транзакции
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTransactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
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
                    <div className="text-right">
                      <p className={`font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount} сом
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(t.status)}
                        <span>{getStatusLabel(t.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Тип</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Описание</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Сумма</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Дата</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">#{t.id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          t.type === 'income' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                        }`}>
                          {t.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {t.type === 'income' ? 'Приход' : 'Расход'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{t.description}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount} сом
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{t.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          {getStatusIcon(t.status)}
                          <span>{getStatusLabel(t.status)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockAccounts.map((account) => (
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
                    <button className="flex-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
                      Пополнить
                    </button>
                    <button className="flex-1 px-3 py-2 rounded-md border text-sm hover:bg-muted transition-colors">
                      Вывести
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Account Card */}
          <Card className="glass border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-3xl text-muted-foreground">+</span>
              </div>
              <p className="text-muted-foreground">Добавить новый счёт</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
