'use client';

import React, { useState } from 'react';
import { X, Plus, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Account,
    SubscriptionType,
    SUBSCRIPTION_PRICES,
    SUBSCRIPTION_LABELS
} from './types';

interface AddIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
    onSubmit: (data: {
        description: string;
        amount: number;
        date: string;
        accountId: string;
        subscriptionType: SubscriptionType;
    }) => void;
}

export function AddIncomeModal({ isOpen, onClose, accounts, onSubmit }: AddIncomeModalProps) {
    const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('monthly');
    const [customAmount, setCustomAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(accounts[0]?.id || '');
    const [customerName, setCustomerName] = useState('');

    if (!isOpen) return null;

    const amount = subscriptionType === 'custom'
        ? parseFloat(customAmount) || 0
        : SUBSCRIPTION_PRICES[subscriptionType];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || !accountId) return;

        const desc = description ||
            `${SUBSCRIPTION_LABELS[subscriptionType]}${customerName ? ` - ${customerName}` : ''}`;

        onSubmit({
            description: desc,
            amount,
            date,
            accountId,
            subscriptionType,
        });

        // Reset form
        setSubscriptionType('monthly');
        setCustomAmount('');
        setDescription('');
        setCustomerName('');
        setDate(new Date().toISOString().split('T')[0]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 glass">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-green-500">
                        <Plus className="h-5 w-5" />
                        Добавить доход
                    </CardTitle>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Тип подписки */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Тип подписки</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['yearly', 'halfYearly', 'monthly', 'custom'] as SubscriptionType[]).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSubscriptionType(type)}
                                        className={`p-3 rounded-lg border text-sm transition-colors ${subscriptionType === type
                                                ? 'bg-green-500 text-white border-green-500'
                                                : 'hover:bg-muted border-muted'
                                            }`}
                                    >
                                        <div className="font-medium">{SUBSCRIPTION_LABELS[type]}</div>
                                        {type !== 'custom' && (
                                            <div className="text-xs mt-1 opacity-80">{SUBSCRIPTION_PRICES[type]} сом</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Произвольная сумма */}
                        {subscriptionType === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Сумма (сом)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Введите сумму"
                                    required
                                />
                            </div>
                        )}

                        {/* Имя клиента */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Клиент (опционально)</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Имя клиента"
                            />
                        </div>

                        {/* Описание */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Описание (опционально)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Автоматически из типа подписки"
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
                                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>

                        {/* Счёт */}
                        <div>
                            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Счёт зачисления
                            </label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.bank}) — {acc.balance.toLocaleString()} {acc.currency}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Предпросмотр */}
                        {amount > 0 && (
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Сумма дохода:</span>
                                    <span className="text-xl font-bold text-green-500">+{amount.toFixed(2)} сом</span>
                                </div>
                                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                    <span>Налог 6%:</span>
                                    <span>{(amount * 0.06).toFixed(2)} сом</span>
                                </div>
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
                                disabled={amount <= 0 || !accountId}
                                className="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
