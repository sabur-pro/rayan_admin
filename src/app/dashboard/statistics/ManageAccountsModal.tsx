'use client';

import React, { useState } from 'react';
import { X, Plus, CreditCard, Trash2, Edit2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Account } from './types';

interface ManageAccountsModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
    onAddAccount: (data: { name: string; bank: string; balance: number; currency: string }) => void;
    onUpdateAccount: (id: string, data: Partial<Omit<Account, 'id'>>) => void;
    onDeleteAccount: (id: string) => { success: boolean; error?: string };
}

export function ManageAccountsModal({
    isOpen,
    onClose,
    accounts,
    onAddAccount,
    onUpdateAccount,
    onDeleteAccount
}: ManageAccountsModalProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // New account form
    const [newName, setNewName] = useState('');
    const [newBank, setNewBank] = useState('');
    const [newBalance, setNewBalance] = useState('0');
    const [newCurrency, setNewCurrency] = useState('TJS');

    // Edit form
    const [editName, setEditName] = useState('');
    const [editBank, setEditBank] = useState('');

    if (!isOpen) return null;

    const handleAddAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newBank.trim()) return;

        onAddAccount({
            name: newName.trim(),
            bank: newBank.trim(),
            balance: parseFloat(newBalance) || 0,
            currency: newCurrency,
        });

        setNewName('');
        setNewBank('');
        setNewBalance('0');
        setNewCurrency('TJS');
        setShowAddForm(false);
    };

    const handleStartEdit = (account: Account) => {
        setEditingId(account.id);
        setEditName(account.name);
        setEditBank(account.bank);
        setError(null);
    };

    const handleSaveEdit = (id: string) => {
        onUpdateAccount(id, { name: editName, bank: editBank });
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        const result = onDeleteAccount(id);
        if (!result.success) {
            setError(result.error || 'Ошибка удаления');
            setTimeout(() => setError(null), 3000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-lg mx-4 glass max-h-[90vh] overflow-hidden flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Управление счетами
                    </CardTitle>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto">
                    {/* Error message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Existing accounts */}
                    <div className="space-y-3">
                        {accounts.map((account) => (
                            <div key={account.id} className="p-4 rounded-lg bg-muted/30 border">
                                {editingId === account.id ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Название счёта"
                                        />
                                        <input
                                            type="text"
                                            value={editBank}
                                            onChange={(e) => setEditBank(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Банк"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveEdit(account.id)}
                                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600"
                                            >
                                                <Check className="h-4 w-4" />
                                                Сохранить
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1 rounded-lg border text-sm hover:bg-muted"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">{account.name}</h4>
                                            <p className="text-sm text-muted-foreground">{account.bank}</p>
                                            <p className="text-lg font-bold mt-1">
                                                {account.balance.toLocaleString()} {account.currency}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleStartEdit(account)}
                                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                title="Редактировать"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(account.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                                                title="Удалить"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add new account form */}
                    {showAddForm ? (
                        <form onSubmit={handleAddAccount} className="p-4 rounded-lg border-2 border-dashed border-primary/50 space-y-3">
                            <h4 className="font-medium">Новый счёт</h4>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Название счёта"
                                required
                            />
                            <input
                                type="text"
                                value={newBank}
                                onChange={(e) => setNewBank(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Банк"
                                required
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Начальный баланс"
                                />
                                <select
                                    value={newCurrency}
                                    onChange={(e) => setNewCurrency(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="TJS">TJS (Сомони)</option>
                                    <option value="USD">USD (Доллар)</option>
                                    <option value="RUB">RUB (Рубль)</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                                >
                                    <Plus className="h-4 w-4" />
                                    Добавить
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 rounded-lg border text-sm hover:bg-muted"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
                        >
                            <Plus className="h-5 w-5" />
                            Добавить новый счёт
                        </button>
                    )}

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                        Закрыть
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}
