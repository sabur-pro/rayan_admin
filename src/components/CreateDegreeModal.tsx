// src/components/CreateDegreeModal.tsx
'use client';

import React, { JSX, useMemo, useState } from 'react';
import type { DegreeTranslation, DegreeCreateRequest, LangCode, DegreeItem } from '../../types/degree';
import { createDegree } from '@/lib/degree';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (item: DegreeItem) => void;
};

const DEFAULT_LANGS: LangCode[] = ['tj', 'ru'];

const ALL_LANGS: LangCode[] = ['tj', 'ru', 'en', 'uz', 'kg', 'kz'];

export default function CreateDegreeModal({ isOpen, onClose, onCreated }: Props): JSX.Element | null {
  const [translations, setTranslations] = useState<DegreeTranslation[]>(
    DEFAULT_LANGS.map((lc) => ({
      lang_code: lc,
      name: '',
      description: '',
      status: 'active',
    }))
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const availableLangs = useMemo(() => {
    const used = new Set(translations.map((t) => t.lang_code));
    return ALL_LANGS.filter((l) => !used.has(l));
  }, [translations]);

  function updateTranslation(index: number, patch: Partial<DegreeTranslation>) {
    setTranslations((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTranslation(lang?: LangCode) {
    const code = lang ?? (availableLangs[0] as LangCode) ?? 'en';
    setTranslations((prev) => [
      ...prev,
      { lang_code: code, name: '', description: '', status: 'active' },
    ]);
  }

  function removeTranslation(index: number) {
    setTranslations((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string | null {
    if (translations.length === 0) return 'Добавьте хотя бы один перевод.';
    for (const t of translations) {
      if (!t.lang_code) return 'У одного из переводов не указан язык.';
      if (!t.name.trim()) return `У языка ${t.lang_code} не задано имя.`;
    }
    return null;
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const payload: DegreeCreateRequest = { translations };
    try {
      setSubmitting(true);
      const created = await createDegree(payload);
      onCreated?.(created);
      // reset form to defaults
      setTranslations(DEFAULT_LANGS.map((lc) => ({ lang_code: lc, name: '', description: '', status: 'active' })));
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && onClose()} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-2xl glass p-6 rounded-2xl border shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Добавить уровень</h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="rounded p-1 hover:opacity-90"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {translations.map((t, idx) => (
            <div key={idx} className="p-4 rounded-lg border bg-card text-card-foreground">
              <div className="flex items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm">Язык</label>
                  <select
                    value={t.lang_code}
                    onChange={(e) => updateTranslation(idx, { lang_code: e.target.value })}
                    className="rounded-md border px-2 py-1 bg-transparent"
                  >
                    {/* include current value plus unused languages */}
                    <option value={t.lang_code}>{t.lang_code.toUpperCase()}</option>
                    {availableLangs.map((lc) => (
                      <option key={lc} value={lc}>
                        {lc.toUpperCase()}
                      </option>
                    ))}
                    {/* also offer all others (in case the current one already equals) */}
                    {ALL_LANGS.filter((a) => a !== t.lang_code && !availableLangs.includes(a)).map((lc) => (
                      <option key={lc} value={lc}>
                        {lc.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm">Статус</label>
                  <input
                    value={t.status}
                    onChange={(e) => updateTranslation(idx, { status: e.target.value })}
                    className="rounded-md border px-2 py-1 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeTranslation(idx)}
                    disabled={submitting}
                    className="ml-2 text-sm text-red-600 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm block mb-1">Название</label>
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => updateTranslation(idx, { name: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 bg-transparent"
                    placeholder="Название"
                  />
                </div>

                <div>
                  <label className="text-sm block mb-1">Краткое описание</label>
                  <input
                    type="text"
                    value={t.description}
                    onChange={(e) => updateTranslation(idx, { description: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 bg-transparent"
                    placeholder="Описание"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => addTranslation(undefined)}
              disabled={availableLangs.length === 0}
              className="btn-outline px-3 py-1 rounded"
            >
              Добавить язык
            </button>

            {availableLangs.length > 0 && (
              <select
                onChange={(e) => addTranslation(e.target.value as LangCode)}
                defaultValue=""
                className="rounded-md border px-2 py-1 bg-transparent"
              >
                <option value="">Добавить выбранный язык</option>
                {availableLangs.map((lc) => (
                  <option key={lc} value={lc}>
                    {lc.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
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
            {submitting ? 'Сохранение...' : 'Создать уровень'}
          </button>
        </div>
      </form>
    </div>
  );
}
