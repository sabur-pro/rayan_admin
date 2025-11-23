// src/app/dashboard/faculties/page.tsx
'use client';

import React, { JSX, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Faculty } from '../../../../types/faculty';
import type { Course } from '../../../../types/course';
import type { Semester } from '../../../../types/semester';
import { getCourses } from '@/lib/course';
import { getSemesters } from '@/lib/semester';
import { getSubjects } from '@/lib/subject';
import type { Subject } from '../../../../types/subject';
import { useTheme } from '../../../../contexts/theme-context';
import CreateSubjectModal from '@/components/CreateSubjectModal';

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

export default function FacultiesPage(): JSX.Element {
  const { theme } = useTheme();
  const searchParams = useSearchParams();

  const university_id = parseInt(searchParams.get('university_id') || '0', 10);
  const initialLang = (searchParams.get('lang') as LangCode) || 'tj';
  const [lang, setLang] = useState<LangCode>(initialLang);

  const [items, setItems] = useState<Faculty[]>([]);
  // --- new states for selection and data ---
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semestersLoading, setSemestersLoading] = useState(false);
  const [semestersError, setSemestersError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [limit, setLimit] = useState<number>(50);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(LS_LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    if (university_id <= 0) {
      setError('Неверный ID университета');
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getFaculties(university_id, lang, 1, limit);
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
  }, [university_id, lang, limit]);

  // Reset selections on faculty list change
  useEffect(() => {
    setSelectedFaculty(null);
    setCourses([]);
    setSelectedCourse(null);
    setSemesters([]);
    setSelectedSemester(null);
  }, [items, lang]);

  // --- API functions ---
  async function fetchCourses(lang: string, page = 1, limit = 50) {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const res = await getCourses(lang, page, limit);
      setCourses(res.data);
    } catch (e: unknown) {
      setCoursesError(e instanceof Error ? e.message : 'Ошибка при загрузке курсов');
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }

  async function fetchSemesters(page = 1, limit = 50) {
    setSemestersLoading(true);
    setSemestersError(null);
    try {
      const res = await getSemesters(page, limit);
      setSemesters(res.data);
    } catch (e: unknown) {
      setSemestersError(e instanceof Error ? e.message : 'Ошибка при загрузке семестров');
      setSemesters([]);
    } finally {
      setSemestersLoading(false);
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / limit));
  }, [totalCount, limit]);

  function handlePrev() {
    // setPage((p) => Math.max(1, p - 1));
  }
  function handleNext() {
    // setPage((p) => Math.min(totalPages, p + 1));
  }
  function handleSelectLang(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (isLangCode(val)) {
      setLang(val);
      // setPage(1); // сброс страницы при смене языка
    }
  }
  function handleLimitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLimit = parseInt(e.target.value, 10) || 50;
    setLimit(newLimit);
    // setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Факультеты</h1>
          <p className="text-muted-foreground">Управление факультетами в системе</p>
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


      {/* --- Факультеты --- */}
      {!selectedFaculty && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 && !loading && !error && (
            <div className="col-span-full text-center text-muted-foreground">Нет данных для выбранного языка.</div>
          )}
          {items.map((u, idx) => {
            const translation = u.translations[0] || { name: '', description: '', status: '' };
            return (
              <Card
                key={`${lang}-${u.id}-${idx}`}
                className="card-hover animate-in cursor-pointer border-2 hover:border-primary"
                onClick={() => {
                  setSelectedFaculty(u);
                  fetchCourses(lang, 1, 50);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{translation.name}</CardTitle>
                    </div>
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{translation.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Статус: <span className="font-medium">{translation.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
      )}

      {/* --- Курсы --- */}
      {selectedFaculty && !selectedCourse && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <button
              className="btn-outline px-3 py-1 rounded"
              onClick={() => setSelectedFaculty(null)}
            >
              ← Назад к факультетам
            </button>
            <h2 className="text-xl font-bold">Курсы факультета</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesLoading && <div className="col-span-full text-center">Загрузка курсов...</div>}
            {coursesError && <div className="col-span-full text-center text-destructive">{coursesError}</div>}
            {courses.map((c) => {
              const t = c.translations[0] || { name: '', description: '', status: '' };
              return (
                <Card
                  key={c.id}
                  className="card-hover animate-in cursor-pointer border-2 hover:border-primary"
                  onClick={() => {
                    setSelectedCourse(c);
                    fetchSemesters(1, 50);
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {t.name} <span className="ml-2 text-primary">№{c.number}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{t.description}</p>
                    <div className="text-xs text-muted-foreground">Статус: {t.status}</div>
                  </CardContent>
                </Card>
              );
            })}
            {!coursesLoading && courses.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">Нет курсов</div>
            )}
          </div>
        </div>
      )}

      {/* --- Семестры --- */}
      {selectedFaculty && selectedCourse && !selectedSemester && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <button
              className="btn-outline px-3 py-1 rounded"
              onClick={() => setSelectedCourse(null)}
            >
              ← Назад к курсам
            </button>
            <h2 className="text-xl font-bold">Семестры курса</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {semestersLoading && <div className="col-span-full text-center">Загрузка семестров...</div>}
            {semestersError && <div className="col-span-full text-center text-destructive">{semestersError}</div>}
            {semesters.map((s) => (
              <Card
                key={s.ID}
                className="card-hover animate-in cursor-pointer border-2 hover:border-primary"
                onClick={() => {
                  setSelectedSemester(s);
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Семестр {s.Number}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">ID: {s.ID}</div>
                </CardContent>
              </Card>
            ))}
            {!semestersLoading && semesters.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">Нет семестров</div>
            )}
          </div>
        </div>
      )}

      {/* --- Список предметов --- */}
      {selectedFaculty && selectedCourse && selectedSemester && (
        <SubjectsBlock
          facultyId={selectedFaculty.id}
          courseId={selectedCourse.id}
          semesterId={selectedSemester.ID}
          langCode={lang}
          onBack={() => setSelectedSemester(null)}
        />
      )}



      {/* Пагинация факультетов только на первом экране */}
      {!selectedFaculty && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Страница 1 из {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              disabled={true}
              className="btn-outline px-3 py-1 rounded disabled:opacity-50"
              aria-label="Первая страница"
            >
              «1
            </button>
            <button
              onClick={() => {}}
              disabled={true}
              className="btn-outline px-3 py-1 rounded disabled:opacity-50"
              aria-label="Предыдущая"
            >
              ‹
            </button>
            {generatePageRange(1, totalPages, 5).map((p) => (
              <button
                key={p}
                onClick={() => {}}
                className={`px-3 py-1 rounded ${p === 1 ? 'btn-primary text-white' : 'btn-outline'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => {}}
              disabled={true}
              className="btn-outline px-3 py-1 rounded disabled:opacity-50"
              aria-label="Следующая"
            >
              ›
            </button>
            <button
              onClick={() => {}}
              disabled={true}
              className="btn-outline px-3 py-1 rounded disabled:opacity-50"
              aria-label="Последняя"
            >
              {totalPages}»
            </button>
          </div>
        </div>
      )}
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

function SubjectsBlock({ facultyId, courseId, semesterId, langCode, onBack }: {
  facultyId: number;
  courseId: number;
  semesterId: number;
  langCode: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const loadingMore = React.useRef(false);

  const loadSubjects = React.useCallback(
    async (pageNum: number, append = false) => {
      if (loadingMore.current) return;

      if (!append) {
        setLoading(true);
      }
      loadingMore.current = true;
      setError(null);

      try {
        const res = await getSubjects({
          lang_code: langCode,
          faculty_id: facultyId,
          course_id: courseId,
          semester_id: semesterId,
          page: pageNum,
          limit: 50,
        });

        if (append) {
          setSubjects((prev) => [...prev, ...res.data]);
        } else {
          setSubjects(res.data);
        }

        setHasMore(res.data.length === 50 && res.page * res.limit < res.total_count);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Ошибка при загрузке предметов');
      } finally {
        setLoading(false);
        loadingMore.current = false;
      }
    },
    [facultyId, courseId, semesterId, langCode]
  );

  useEffect(() => {
    setSubjects([]);
    setPage(1);
    setHasMore(true);
    loadSubjects(1, false);
  }, [facultyId, courseId, semesterId, langCode, loadSubjects]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore.current) {
          setPage((prev) => {
            const nextPage = prev + 1;
            loadSubjects(nextPage, true);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadSubjects]);

  const handleSubjectClick = (subjectId: number) => {
    console.log('Subject clicked:', subjectId);
    const params = new URLSearchParams({
      faculty_id: facultyId.toString(),
      course_id: courseId.toString(),
      semester_id: semesterId.toString(),
      subject_id: subjectId.toString(),
      lang_code: langCode,
    });
    const url = `/dashboard/material-types?${params.toString()}`;
    console.log('Navigating to:', url);
    router.push(url);
  };

  const handleSubjectCreated = (newSubject: Subject) => {
    setSubjects([newSubject, ...subjects]);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="btn-outline px-3 py-1 rounded" onClick={onBack}>
            ← Назад к семестрам
          </button>
          <h2 className="text-xl font-bold">Список предметов</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + Добавить предмет
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && <div className="col-span-full text-center">Загрузка...</div>}
        {error && <div className="col-span-full text-center text-destructive">{error}</div>}
        {subjects.map((subj) => {
          const t = subj.translations[0] || { name: '', description: '', status: '' };
          return (
            <button
              key={subj.id}
              onClick={() => handleSubjectClick(subj.id)}
              className="cursor-pointer w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
              type="button"
            >
              <Card className="card-hover animate-in border-2 transition-all hover:shadow-lg h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{t.description}</p>
                  <div className="text-xs text-muted-foreground">Статус: {t.status}</div>
                </CardContent>
              </Card>
            </button>
          );
        })}
        {!loading && !error && subjects.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground">Нет предметов</div>
        )}
      </div>

      {hasMore && !error && (
        <div ref={observerTarget} className="col-span-full text-center py-4">
          {loadingMore.current && <div className="text-muted-foreground">Загрузка...</div>}
        </div>
      )}

      <CreateSubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleSubjectCreated}
        course_id={courseId}
        semester_id={semesterId}
        faculty_id={facultyId}
      />
    </div>
  );
}