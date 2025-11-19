// components/CreateSubjectModal.tsx
'use client';

import React, { useState } from 'react';
import { createSubject } from '@/lib/subject';
import type { Subject } from '../../types/subject';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (subject: Subject) => void;
  course_id: number;
  semester_id: number;
  faculty_id: number;
}

interface TranslationForm {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

const AVAILABLE_LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'tj', name: 'Таджикский' },
  { code: 'uz', name: 'Узбекский' },
  { code: 'kz', name: 'Казахский' },
  { code: 'kg', name: 'Киргизский' },
];

export default function CreateSubjectModal({
  isOpen,
  onClose,
  onCreated,
  course_id,
  semester_id,
  faculty_id,
}: CreateSubjectModalProps) {
  const [translations, setTranslations] = useState<TranslationForm[]>([
    { lang_code: 'ru', name: '', description: '', status: 'active' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddLanguage = () => {
    const usedLanguages = translations.map((t) => t.lang_code);
    const availableLanguage = AVAILABLE_LANGUAGES.find(
      (lang) => !usedLanguages.includes(lang.code)
    );
    if (availableLanguage) {
      setTranslations([
        ...translations,
        { lang_code: availableLanguage.code, name: '', description: '', status: 'active' },
      ]);
    }
  };

  const handleRemoveLanguage = (index: number) => {
    if (translations.length > 1) {
      setTranslations(translations.filter((_, i) => i !== index));
    }
  };

  const handleTranslationChange = (
    index: number,
    field: keyof TranslationForm,
    value: string
  ) => {
    const newTranslations = [...translations];
    newTranslations[index][field] = value;
    setTranslations(newTranslations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const hasEmptyFields = translations.some(
      (t) => !t.name.trim() || !t.description.trim()
    );
    if (hasEmptyFields) {
      setError('Заполните все поля для каждого языка');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        course_id,
        faculty_ids: [faculty_id],
        semester_id,
        translations: translations.map((t) => ({
          description: t.description,
          lang_code: t.lang_code,
          name: t.name,
          status: t.status,
        })),
      };

      const newSubject = await createSubject(payload);
      onCreated(newSubject);
      onClose();
      // Reset form
      setTranslations([{ lang_code: 'ru', name: '', description: '', status: 'active' }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании предмета');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const usedLanguages = translations.map((t) => t.lang_code);
  const canAddMore = usedLanguages.length < AVAILABLE_LANGUAGES.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl my-8 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Добавить предмет</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {translations.map((translation, index) => {
            const languageName =
              AVAILABLE_LANGUAGES.find((l) => l.code === translation.lang_code)?.name ||
              translation.lang_code;

            return (
              <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{languageName}</h3>
                  {translations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Удалить
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Язык</label>
                  <select
                    value={translation.lang_code}
                    onChange={(e) =>
                      handleTranslationChange(index, 'lang_code', e.target.value)
                    }
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <option
                        key={lang.code}
                        value={lang.code}
                        disabled={
                          usedLanguages.includes(lang.code) &&
                          lang.code !== translation.lang_code
                        }
                      >
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Название</label>
                  <input
                    type="text"
                    value={translation.name}
                    onChange={(e) => handleTranslationChange(index, 'name', e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                    placeholder="Введите название предмета"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <textarea
                    value={translation.description}
                    onChange={(e) =>
                      handleTranslationChange(index, 'description', e.target.value)
                    }
                    className="w-full p-2 border rounded-md bg-background min-h-[80px]"
                    placeholder="Введите описание предмета"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Статус</label>
                  <select
                    value={translation.status}
                    onChange={(e) => handleTranslationChange(index, 'status', e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="active">Активный</option>
                    <option value="inactive">Неактивный</option>
                  </select>
                </div>
              </div>
            );
          })}

          {canAddMore && (
            <button
              type="button"
              onClick={handleAddLanguage}
              className="w-full p-2 border-2 border-dashed rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              + Добавить перевод на другой язык
            </button>
          )}

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Создание...' : 'Создать предмет'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
