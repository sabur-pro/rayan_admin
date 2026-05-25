'use client';

import React, { useState } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; description: string; date: string }) => Promise<void>;
}

// Market and subscription income is recorded automatically; this is for other
// manual income (category = manual on the backend).
export function AddIncomeModal({ isOpen, onClose, onSubmit }: AddIncomeModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ amount: parsedAmount, description: description || 'Прочий доход', date });
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md glass">
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
            <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
              Доход с магазина и подписок записывается автоматически. Здесь — прочий
              ручной доход.
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Сумма (сом)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Введите сумму"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Описание</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Например: возврат, грант, прочее"
              />
            </div>

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

            {parsedAmount > 0 && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex justify-between items-center">
                <span className="text-sm">Сумма дохода:</span>
                <span className="text-xl font-bold text-green-500">+{parsedAmount.toFixed(2)} сом</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
                {error}
              </div>
            )}

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
                disabled={parsedAmount <= 0 || submitting}
                className="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Сохранение...' : 'Добавить'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
