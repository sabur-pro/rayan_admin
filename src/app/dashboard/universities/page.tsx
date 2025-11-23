// src/app/dashboard/universities/page.tsx
'use client';

import React, { JSX, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import type { UniversityTranslation } from '../../../../types/university';
import { useTheme } from '../../../../contexts/theme-context';
import AddUniversityForm from '@/components/AddUniversityForm';
import { useRouter } from 'next/navigation';

type LangCode = 'tj' | 'ru' | 'en' | 'uz' | 'kg' | 'kz';

const LANGS: { code: LangCode; label: string }[] = [
  { code: 'tj', label: 'Тоҷикӣ (tj)' },
  { code: 'ru', label: 'Русский (ru)' },
  { code: 'en', label: 'English (en)' },
  { code: 'uz', label: 'Oʻzbek (uz)' },
  { code: 'kg', label: 'Кыргызча (kg)' },
  { code: 'kz', label: 'Kazah (kz)' },
];

const LS_LANG_KEY = 'app_lang';

export default function UniversitiesPage(): JSX.Element {
  const { theme } = useTheme();
  const router = useRouter();

  const [lang, setLang] = useState<LangCode>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(LS_LANG_KEY) : null;
      if (stored && isLangCode(stored)) return stored as LangCode;
    } catch {
      // ignore
    }
    return 'tj';
  });

  const [items, setItems] = useState<UniversityTranslation[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LS_LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getUniversityTranslations(lang, page, limit);
        if (cancelled) return;
        setItems(res.data);
        setTotalCount(res.total_count);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError((err as Error).message || 'Ошибка при загрузке данных');
          setItems([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lang, page, limit]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / limit));
  }, [totalCount, limit]);

  function handlePrev() {
    setPage((p) => Math.max(1, p - 1));
  }
  function handleNext() {
    setPage((p) => Math.min(totalPages, p + 1));
  }
  function handleSelectLang(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (isLangCode(val)) {
      setLang(val);
      setPage(1); // сброс страницы при смене языка
    }
  }
  function handleLimitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLimit = parseInt(e.target.value, 10) || 50;
    setLimit(newLimit);
    setPage(1);
  }

  function handleCreated() {
    // После успешного создания — перезагрузим текущую страницу данных.
    // Можно оптимистично добавить в список, но лучше перезагрузить данные с сервера.
    setShowAddForm(false);
    // Если API возвращает новый объект с translations — попытаемся вставить локально
    // В простом варианте — просто перезагрузим список
    setPage(1);
    // Перезапрос данных
    (async () => {
      try {
        setLoading(true);
        const res = await api.getUniversityTranslations(lang, page, limit);
        setItems(res.data);
        setTotalCount(res.total_count);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }

  function handleUniversityClick(university_id: number) {
    router.push(`/dashboard/faculties?university_id=${university_id}&lang=${lang}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Университеты</h1>
          <p className="text-muted-foreground">Управление университетами в системе</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card p-2 rounded-md glass">
            <label htmlFor="lang-select" className="text-sm mr-2 text-muted-foreground">
              Язык:
            </label>
            <select
              id="lang-select"
              value={lang}
              onChange={handleSelectLang}
              className="px-2 py-1 rounded-md border bg-transparent"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-card p-2 rounded-md glass">
            <label htmlFor="limit-select" className="text-sm mr-2 text-muted-foreground">
              На странице:
            </label>
            <select
              id="limit-select"
              value={String(limit)}
              onChange={handleLimitChange}
              className="px-2 py-1 rounded-md border bg-transparent"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <Button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <svg className="mr-2 h-4 w-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Добавить университет
          </Button>
        </div>
      </div>

      {/* Панель состояния */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Тема: <span className="font-medium">{theme === 'dark' ? 'Тёмная' : 'Светлая'}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {loading ? 'Загрузка...' : error ? <span className="text-destructive">{error}</span> : `${totalCount} найдено`}
        </div>
      </div>

      {/* Карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 && !loading && !error && (
          <div className="col-span-full text-center text-muted-foreground">Нет данных для выбранного языка.</div>
        )}

        {items.map((u, idx) => (
          <Card
            key={`${u.lang_code}-${idx}`}
            className="card-hover animate-in cursor-pointer"
            onClick={() => u.university_id && handleUniversityClick(u.university_id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{u.name}</CardTitle>
                  {/* <div className="text-sm text-muted-foreground mt-1">{u.lang_code.toUpperCase()}</div> */}
                </div>
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{u.description}</p>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Статус: <span className="font-medium">{u.status}</span>
                </div>
                {/* <div className="text-xs text-muted-foreground">ID: {idx + 1}</div> */}
              </div>
            </CardContent>
          </Card>
        ))}

        {loading &&
          Array.from({ length: Math.min(6, limit) }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="card-hover animate-in opacity-80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg bg-muted h-6 w-40 rounded-sm animate-pulse" />
                  <Building2 className="h-6 w-6 text-primary opacity-40" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="h-4 bg-muted w-full rounded-sm mb-2 animate-pulse" />
                <p className="h-4 bg-muted w-3/4 rounded-sm animate-pulse" />
                <div className="flex items-center justify-between mt-3">
                  <span className="h-3 w-20 bg-muted rounded-sm animate-pulse" />
                  <span className="h-3 w-12 bg-muted rounded-sm animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Пагинация */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Страница {page} из {totalPages}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="btn-outline px-3 py-1 rounded disabled:opacity-50"
            aria-label="Первая страница"
          >
            «1
          </button>

          <button
            onClick={handlePrev}
            disabled={page === 1}
            className="btn-outline px-3 py-1 rounded disabled:opacity-50"
            aria-label="Предыдущая"
          >
            ‹
          </button>

          {generatePageRange(page, totalPages, 5).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${p === page ? 'btn-primary text-white' : 'btn-outline'}`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={handleNext}
            disabled={page === totalPages}
            className="btn-outline px-3 py-1 rounded disabled:opacity-50"
            aria-label="Следующая"
          >
            ›
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="btn-outline px-3 py-1 rounded disabled:opacity-50"
            aria-label="Последняя"
          >
            {totalPages}»
          </button>
        </div>
      </div>

      {showAddForm && <AddUniversityForm onClose={() => setShowAddForm(false)} onCreated={handleCreated} />}
    </div>
  );
}

/* --- helpers --- */

function isLangCode(v: unknown): v is LangCode {
  return typeof v === 'string' && ['tj', 'ru', 'en', 'uz', 'kg', 'kz'].includes(v);
}

function generatePageRange(current: number, total: number, windowSize = 5): number[] {
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, current + half);

  while (end - start + 1 < windowSize && (start > 1 || end < total)) {
    if (start > 1) start--;
    if (end < total) end++;
  }

  const res: number[] = [];
  for (let i = start; i <= end; i++) res.push(i);
  return res;
}