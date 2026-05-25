'use client';

import React, { useEffect, useState } from 'react';
import { X, Wallet, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Founder } from '../../../../types/finance';

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  founder: Founder | null;
  onSubmit: (amount: number, description: string) => Promise<void>;
}

export function PayoutModal({ isOpen, onClose, founder, onSubmit }: PayoutModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !founder) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const insufficient = parsedAmount > founder.balance;
  const remaining = founder.balance - parsedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0 || insufficient) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(parsedAmount, description);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при выплате');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Выплата — {founder.name}
          </CardTitle>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10">
              <span className="text-sm">Доступно к выплате:</span>
              <span className="font-bold text-blue-500">{founder.balance.toFixed(2)} сом</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Сумма выплаты (сом)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите сумму"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Комментарий (опционально)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Например: выплата за май"
              />
            </div>

            {insufficient && parsedAmount > 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <span className="text-sm text-yellow-600">Сумма превышает доступный баланс</span>
              </div>
            )}

            {parsedAmount > 0 && !insufficient && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Останется на счёте:</span>
                <span>{remaining.toFixed(2)} сом</span>
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
                disabled={parsedAmount <= 0 || insufficient || submitting}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Выплата...' : 'Выплатить'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
