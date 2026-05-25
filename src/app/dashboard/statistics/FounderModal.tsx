'use client';

import React, { useEffect, useState } from 'react';
import { X, UserPlus, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Founder } from '../../../../types/finance';

interface FounderModalProps {
  isOpen: boolean;
  onClose: () => void;
  founder?: Founder | null; // when set -> edit mode
  takenShare: number; // sum of other founders' shares
  onSubmit: (data: { name: string; share: number }) => Promise<void>;
}

export function FounderModal({ isOpen, onClose, founder, takenShare, onSubmit }: FounderModalProps) {
  const [name, setName] = useState('');
  const [share, setShare] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(founder?.name ?? '');
      setShare(founder ? String(founder.share) : '');
      setError('');
    }
  }, [isOpen, founder]);

  if (!isOpen) return null;

  const parsedShare = parseFloat(share) || 0;
  const remaining = Math.round((100 - takenShare) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || parsedShare < 0 || parsedShare > 100) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ name: name.trim(), share: parsedShare });
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
          <CardTitle className="flex items-center gap-2 text-primary">
            <UserPlus className="h-5 w-5" />
            {founder ? 'Редактировать основателя' : 'Добавить основателя'}
          </CardTitle>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Имя основателя"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Доля в компании (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={share}
                onChange={(e) => setShare(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Например: 40"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Свободно для распределения: {remaining.toFixed(2)}%
              </p>
            </div>

            {parsedShare > remaining && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-600">
                Сумма долей превысит 100%. Остаток ({(100 - takenShare).toFixed(2)}%) — нераспределённая
                доля компании.
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
                disabled={!name.trim() || submitting}
                className="flex-1 px-4 py-2 rounded-lg btn-primary bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
