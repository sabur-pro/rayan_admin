// src/components/EditDegreeTranslationModal.tsx
'use client';

import React, { JSX, useEffect, useState } from 'react';
import { updateDegreeTranslation } from '@/lib/degree';

interface EditingData {
  degreeId: number;
  langCode: string;
  currentName: string;
  currentDescription: string;
  currentStatus: string;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editingData: EditingData | null;
  onUpdated: (updated: { name: string; description: string; status: string }) => void;
};

export default function EditDegreeTranslationModal({ isOpen, onClose, editingData, onUpdated }: Props): JSX.Element | null {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingData) {
      setName(editingData.currentName);
      setDescription(editingData.currentDescription);
      setStatus(editingData.currentStatus);
    }
  }, [editingData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingData) return;

    setSubmitting(true);
    setError(null);
    try {
      await updateDegreeTranslation(editingData.degreeId, editingData.langCode, {
        name,
        description,
        status,
      });
      onUpdated({ name, description, status });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && onClose()} />

      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md glass p-6 rounded-2xl border shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Редактировать перевод</h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="rounded p-1 hover:opacity-90"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {editingData && (
          <div className="mb-4">
            <p>
              Уровень: {editingData.degreeId}, язык: {editingData.langCode.toUpperCase()}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm block mb-1">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 bg-transparent"
              placeholder="Название"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Описание</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border px-3 py-2 bg-transparent"
              placeholder="Описание"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Статус</label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border px-3 py-2 bg-transparent"
              placeholder="Статус"
            />
          </div>
        </div>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={submitting}
            className="btn-outline px-4 py-2 rounded"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-4 py-2 rounded text-white"
          >
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}