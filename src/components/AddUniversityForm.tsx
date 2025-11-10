// src/components/AddUniversityForm.tsx
'use client';

import React, { useMemo, useState } from 'react';
import type { LangCode } from '../../types/university';
import type { CreateUniversityRequest, UniversityTranslation, CreateUniversityResponse } from '../../types/university';
import { createUniversity } from '@/lib/university';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LANGS: { code: LangCode; label: string }[] = [
  { code: 'tj', label: 'Тоҷикӣ (tj)' },
  { code: 'ru', label: 'Русский (ru)' },
  { code: 'en', label: 'English (en)' },
  { code: 'uz', label: "Oʻzbek (uz)" },
  { code: 'kg', label: 'Кыргызча (kg)' },
  { code: 'kz', label: 'Қазақша (kz)' },
];

interface Props {
  onClose: () => void;
  onCreated: (created: CreateUniversityResponse) => void;
}

/**
 * Модальное окно с формой добавления университета.
 * Динамически создаёт поля для выбранных языков.
 */
export default function AddUniversityForm({ onClose, onCreated }: Props) {
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set(['tj'])); // по умолчанию tj
  const [values, setValues] = useState<Record<string, { name: string; description: string; status: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Убедимся, что для выбранных языков всегда существуют записи в values
  const ensureValuesForSelected = () => {
    const next = { ...values };
    selectedLangs.forEach((lang) => {
      if (!next[lang]) {
        next[lang] = { name: '', description: '', status: 'Published' };
      }
    });
    setValues(next);
  };

  React.useEffect(() => {
    ensureValuesForSelected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLangs]);

  const toggleLang = (code: string) => {
    const next = new Set(selectedLangs);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelectedLangs(next);
  };

  const handleChange = (lang: string, field: 'name' | 'description' | 'status', v: string) => {
    setValues((prev) => ({
      ...prev,
      [lang]: {
        ...(prev[lang] ?? { name: '', description: '', status: 'Published' }),
        [field]: v,
      },
    }));
  };

  const canSubmit = useMemo(() => {
    if (selectedLangs.size === 0) return false;
    for (const lang of selectedLangs) {
      const v = values[lang];
      if (!v) return false;
      if (!v.name.trim() || !v.description.trim()) return false;
    }
    return true;
  }, [selectedLangs, values]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) {
      setError('Пожалуйста, заполните все поля для выбранных языков.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const translations: UniversityTranslation[] = Array.from(selectedLangs).map((lang) => {
      const v = values[lang]!;
      return {
        lang_code: lang,
        name: v.name,
        description: v.description,
        status: v.status as UniversityTranslation['status'],
      };
    });

    const payload: CreateUniversityRequest = { translations };

    try {
      const created = await createUniversity(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      console.error(err);
      setError((err as Error)?.message ?? 'Ошибка при создании университета');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-card text-card-foreground rounded-2xl shadow-lg p-6 glass">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Добавить университет</h3>
          <button onClick={onClose} aria-label="Закрыть" className="p-2 rounded hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">Выберите языки (для каждого языка будут поля)</div>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => {
                const checked = selectedLangs.has(l.code);
                return (
                  <label
                    key={l.code}
                    className={`px-3 py-1 rounded-md border cursor-pointer select-none ${
                      checked ? 'bg-primary text-white' : 'bg-card'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() => toggleLang(l.code)}
                    />
                    <span className="text-sm">{l.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="max-h-[50vh] overflow-auto space-y-4">
            {Array.from(selectedLangs).map((lang) => {
              const v = values[lang] ?? { name: '', description: '', status: 'Published' };
              return (
                <div key={lang} className="p-4 border rounded-md bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{lang.toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">Язык: {lang}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm block mb-1">Название</label>
                      <input
                        value={v.name}
                        onChange={(e) => handleChange(lang, 'name', e.target.value)}
                        className="w-full px-3 py-2 border rounded bg-transparent"
                        placeholder="Название университета"
                      />
                    </div>

                    <div>
                      <label className="text-sm block mb-1">Статус</label>
                      <select
                        value={v.status}
                        onChange={(e) => handleChange(lang, 'status', e.target.value)}
                        className="w-full px-3 py-2 border rounded bg-transparent"
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-sm block mb-1">Описание</label>
                    <textarea
                      value={v.description}
                      onChange={(e) => handleChange(lang, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded bg-transparent"
                      placeholder="Описание университета"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex items-center justify-end gap-3">
            <Button className="btn-outline" type="button" onClick={onClose} disabled={submitting}>
              Отмена
            </Button>
            <Button className="btn-primary" type="submit" disabled={!canSubmit || submitting}>
              {submitting ? 'Создание...' : 'Создать университет'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
