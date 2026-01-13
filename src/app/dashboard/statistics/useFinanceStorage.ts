'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Transaction,
    Account,
    FinanceStats,
    DEFAULT_ACCOUNTS,
    TAX_RATE,
    SubscriptionType,
    ExpenseCategory,
} from './types';

const TRANSACTIONS_KEY = 'finance_transactions';
const ACCOUNTS_KEY = 'finance_accounts';

// Генерация уникального ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useFinanceStorage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Загрузка данных из LocalStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
            const savedAccounts = localStorage.getItem(ACCOUNTS_KEY);

            if (savedTransactions) {
                try {
                    setTransactions(JSON.parse(savedTransactions));
                } catch {
                    setTransactions([]);
                }
            }

            if (savedAccounts) {
                try {
                    setAccounts(JSON.parse(savedAccounts));
                } catch {
                    setAccounts(DEFAULT_ACCOUNTS);
                }
            } else {
                setAccounts(DEFAULT_ACCOUNTS);
            }

            setIsLoaded(true);
        }
    }, []);

    // Сохранение транзакций
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
        }
    }, [transactions, isLoaded]);

    // Сохранение счетов
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        }
    }, [accounts, isLoaded]);

    // Добавить транзакцию
    const addTransaction = useCallback((
        type: 'income' | 'expense',
        data: {
            description: string;
            amount: number;
            date: string;
            accountId: string;
            subscriptionType?: SubscriptionType;
            category?: ExpenseCategory;
        }
    ) => {
        const newTransaction: Transaction = {
            id: generateId(),
            type,
            description: data.description,
            amount: data.amount,
            date: data.date,
            status: 'completed',
            accountId: data.accountId,
            subscriptionType: data.subscriptionType,
            category: data.category,
            createdAt: new Date().toISOString(),
        };

        setTransactions(prev => [newTransaction, ...prev]);

        // Обновляем баланс счёта
        setAccounts(prev => prev.map(acc => {
            if (acc.id === data.accountId) {
                return {
                    ...acc,
                    balance: type === 'income'
                        ? acc.balance + data.amount
                        : acc.balance - data.amount,
                };
            }
            return acc;
        }));

        return newTransaction;
    }, []);

    // Удалить транзакцию
    const deleteTransaction = useCallback((id: string) => {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        // Откатываем баланс счёта
        setAccounts(prev => prev.map(acc => {
            if (acc.id === transaction.accountId) {
                return {
                    ...acc,
                    balance: transaction.type === 'income'
                        ? acc.balance - transaction.amount
                        : acc.balance + transaction.amount,
                };
            }
            return acc;
        }));

        setTransactions(prev => prev.filter(t => t.id !== id));
    }, [transactions]);

    // Добавить счёт
    const addAccount = useCallback((data: { name: string; bank: string; balance: number; currency: string }) => {
        const newAccount: Account = {
            id: generateId(),
            ...data,
        };
        setAccounts(prev => [...prev, newAccount]);
        return newAccount;
    }, []);

    // Обновить счёт
    const updateAccount = useCallback((id: string, data: Partial<Omit<Account, 'id'>>) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === id) {
                return { ...acc, ...data };
            }
            return acc;
        }));
    }, []);

    // Удалить счёт
    const deleteAccount = useCallback((id: string) => {
        // Проверяем, есть ли транзакции на этом счёте
        const hasTransactions = transactions.some(t => t.accountId === id);
        if (hasTransactions) {
            return { success: false, error: 'Невозможно удалить счёт с транзакциями' };
        }
        setAccounts(prev => prev.filter(acc => acc.id !== id));
        return { success: true };
    }, [transactions]);

    // Получить статистику
    const getStats = useCallback((): FinanceStats => {
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.category !== 'tax');
        const taxTransactions = transactions.filter(t => t.type === 'expense' && t.category === 'tax');

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
        const taxAmount = taxTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Расчёт налога 6% от дохода
        const calculatedTax = Math.round(totalIncome * TAX_RATE * 100) / 100;

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

        // Расходы по категориям
        const expenseBreakdown: Record<ExpenseCategory, number> = {
            server: 0,
            advertising: 0,
            salary: 0,
            tax: taxAmount,
            other: 0,
        };

        expenseTransactions.forEach(t => {
            const cat = t.category || 'other';
            expenseBreakdown[cat] += t.amount;
        });

        return {
            totalIncome,
            totalExpense: totalExpense + taxAmount,
            taxRate: TAX_RATE,
            taxAmount,
            netProfit,
            subscriptionBreakdown,
            expenseBreakdown,
        };
    }, [transactions]);

    // Фильтрация транзакций
    const getFilteredTransactions = useCallback((
        filter: 'all' | 'income' | 'expense',
        dateFrom?: string,
        dateTo?: string
    ) => {
        return transactions
            .filter(t => {
                if (filter !== 'all' && t.type !== filter) return false;
                if (dateFrom && t.date < dateFrom) return false;
                if (dateTo && t.date > dateTo) return false;
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

    return {
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
    };
}