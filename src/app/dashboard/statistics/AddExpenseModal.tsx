'use client';

import React, { useState } from 'react';
import { X, Minus, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Account,
    ExpenseCategory,
    EXPENSE_CATEGORY_LABELS
} from './types';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
    onSubmit: (data: {
        description: string;
        amount: number;
        date: string;
        accountId: string;
        category: ExpenseCategory;
    }) => void;
}

export function AddExpenseModal({ isOpen, onClose, accounts, onSubmit }: AddExpenseModalProps) {
    const [category, setCategory] = useState<ExpenseCategory>('server');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(accounts[0]?.id || '');

    if (!isOpen) return null;

    const parsedAmount = parseFloat(amount) || 0;
    const selectedAccount = accounts.find(a => a.id === accountId);
    const insufficientFunds = selectedAccount && parsedAmount > selectedAccount.balance;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (parsedAmount <= 0 || !accountId || insufficientFunds) return;

        const desc = description || EXPENSE_CATEGORY_LABELS[category];

        onSubmit({
            description: desc,
            amount: parsedAmount,
            date,
            accountId,
            category,
        });

        // Reset form
        setCategory('server');
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 glass">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-red-500">
                        <Minus className="h-5 w-5" />
                        Добавить расход
                    </CardTitle>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Категория */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Категория расхода</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`p-3 rounded-lg border text-sm transition-colors ${category === cat
                                                ? 'bg-red-500 text-white border-red-500'
                                                : 'hover:bg-muted border-muted'
                                            }`}
                                    >
                                        {EXPENSE_CATEGORY_LABELS[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Сумма */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Сумма (сом)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Введите сумму"
                                required
                            />
                        </div>

                        {/* Описание */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Описание (опционально)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Автоматически из категории"
                            />
                        </div>

                        {/* Дата */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Дата
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                            />
                        </div>

                        {/* Счёт */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Счёт списания
                            </label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.bank}) — {acc.balance.toLocaleString()} {acc.currency}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Предупреждение о недостатке средств */}
                        {insufficientFunds && (
                            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-500">Недостаточно средств</p>
                                    <p className="text-muted-foreground">
                                        На счёте: {selectedAccount?.balance.toLocaleString()} {selectedAccount?.currency}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Предпросмотр */}
                        {parsedAmount > 0 && !insufficientFunds && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Сумма расхода:</span>
                                    <span className="text-xl font-bold text-red-500">-{parsedAmount.toFixed(2)} сом</span>
                                </div>
                                {selectedAccount && (
                                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                        <span>Остаток на счёте:</span>
                                        <span>{(selectedAccount.balance - parsedAmount).toFixed(2)} {selectedAccount.currency}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Кнопки */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={parsedAmount <= 0 || !accountId || insufficientFunds}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Добавить
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
