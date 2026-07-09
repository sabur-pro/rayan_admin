// src/app/dashboard/settings/page.tsx
'use client';

import React, { JSX, useEffect, useState } from 'react';
import type { DegreeItem } from '../../../../types/degree';
import { getAllDegreeTranslations } from '@/lib/degree';
import CreateDegreeModal from '@/components/CreateDegreeModal';
import EditDegreeTranslationModal from '@/components/EditDegreeTranslationModal';
import SemesterList from '@/components/SemesterList';
import CourseList from '@/components/CourseList';
import { getAcademicProgressURL, updateAcademicProgressURL } from '@/lib/setting';

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: DegreeItem[] }
  | { status: 'error'; error: string };

function AcademicProgressUrlCard(): JSX.Element {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAcademicProgressURL()
      .then((u) => setUrl(u))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      await updateAcademicProgressURL(url.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-8 rounded-xl glass p-5 border shadow-sm">
      <h2 className="text-lg font-semibold">Ссылка на сайт успеваемости</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Эта ссылка открывается у студента в приложении в разделе «Успеваемость». Оставьте пустым, чтобы скрыть раздел.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading || saving}
          placeholder="https://study.tj"
          className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="btn-primary px-4 py-2 rounded-lg shadow-md disabled:opacity-60"
        >
          {saving ? 'Сохранение…' : saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>
      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">Ошибка: {error}</div>
      )}
    </section>
  );
}

export default function Page(): JSX.Element {
  const [state, setState] = useState<FetchState>({ status: 'idle' });
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [editingTranslation, setEditingTranslation] = useState<{
    degreeId: number;
    langCode: string;
    currentName: string;
    currentDescription: string;
    currentStatus: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        setState({ status: 'loading' });
        const all = await getAllDegreeTranslations(10);
        if (!mounted) return;
        setState({ status: 'success', data: all });
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', error: message });
      }
    }

    loadAll();

    return () => {
      mounted = false;
    };
  }, []);

  function handleCreated(item: DegreeItem) {
    setState((prev) => {
      if (prev.status === 'success') {
        return { status: 'success', data: [item, ...prev.data] };
      }
      return { status: 'success', data: [item] };
    });
  }

  function handleTranslationUpdated(degreeId: number, langCode: string, updatedTranslation: { name: string; description: string; status: string }) {
    setState(prev => {
      if (prev.status === 'success') {
        const updatedData = prev.data.map(degree => {
          if (degree.id === degreeId) {
            return {
              ...degree,
              translations: degree.translations.map(t =>
                t.lang_code === langCode
                  ? { ...t, ...updatedTranslation }
                  : t
              ),
            };
          }
          return degree;
        });
        return { ...prev, data: updatedData };
      }
      return prev;
    });
  }

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Уровни (Degree Translations)</h1>
          <p className="text-sm text-muted-foreground mt-1">Список всех уровней с переводами.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
          >
            + Добавить уровень
          </button>
        </div>
      </header>

      <AcademicProgressUrlCard />

      {state.status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl glass animate-in p-5 min-h-[140px] border shadow-sm"
            >
              <div className="h-5 bg-muted rounded w-1/3 mb-3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          Ошибка загрузки: {state.error}
        </div>
      )}

      {state.status === 'success' && (
        <>
          {state.data.length === 0 ? (
            <div className="p-6 rounded-lg bg-card text-card-foreground">Нет данных.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.data.map((item) => (
                <DegreeCard 
                  key={item.id} 
                  item={item} 
                  onEdit={(langCode, currentName, currentDescription, currentStatus) => 
                    setEditingTranslation({ 
                      degreeId: item.id, 
                      langCode, 
                      currentName, 
                      currentDescription, 
                      currentStatus 
                    })
                  }
                />
              ))}
            </div>
          )}
        <SemesterList />
        <CourseList />
        </>
      )}

      <CreateDegreeModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <EditDegreeTranslationModal
        isOpen={!!editingTranslation}
        onClose={() => setEditingTranslation(null)}
        editingData={editingTranslation}
        onUpdated={(updated) => {
          if (editingTranslation) {
            handleTranslationUpdated(editingTranslation.degreeId, editingTranslation.langCode, updated);
          }
          setEditingTranslation(null);
        }}
      />
    </main>
  );
}

/* ==================== Helper components ==================== */

function DegreeCard({ item, onEdit }: { 
  item: DegreeItem; 
  onEdit: (langCode: string, currentName: string, currentDescription: string, currentStatus: string) => void 
}): JSX.Element {
  const created = formatDate(item.created_at);
  const updated = formatDate(item.updated_at);

  return (
    <article className="rounded-2xl p-5 bg-card text-card-foreground border shadow-sm hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Уровень #{item.id}</h3>
          <p className="text-sm text-muted-foreground">Создано: {created}</p>
        </div>

        <div className="text-xs text-muted-foreground">Обновлён: {updated}</div>
      </div>

      <div className="mt-4 space-y-3">
        {item.translations.map((t) => (
          <div
            key={t.lang_code}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border bg-card-foreground/5"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                  {t.lang_code.toUpperCase()}
                </span>
                <h4 className="text-sm font-semibold">{t.name || '—'}</h4>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description || '—'}</p>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={t.status} />
              <button
                onClick={() => onEdit(t.lang_code, t.name, t.description, t.status)}
                className="text-sm text-blue-600 hover:underline"
              >
                Изменить
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>

  );
}

function StatusBadge({ status }: { status: string }): JSX.Element {
  const s = (status ?? '').toLowerCase();
  const label = status || '—';

  let classes =
    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border';

  if (s === 'active' || s === 'enabled' || s === 'true') {
    classes += ' bg-primary text-primary-foreground border-transparent';
  } else if (s === 'inactive' || s === 'disabled' || s === 'false') {
    classes += ' bg-muted text-muted-foreground border-transparent';
  } else if (s === 'pending' || s === 'draft') {
    classes += ' bg-secondary text-secondary-foreground border-transparent';
  } else {
    classes += ' bg-accent text-accent-foreground border-transparent';
  }

  return <span className={classes}>{label}</span>;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}