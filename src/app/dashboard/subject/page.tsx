// src/app/dashboard/subject/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubjects } from '@/lib/subject';
import CreateSubjectModal from '@/components/CreateSubjectModal';
import type { Subject } from '../../../../types/subject';

export default function SubjectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const faculty_id = Number(searchParams.get('faculty_id'));
  const course_id = Number(searchParams.get('course_id'));
  const semester_id = Number(searchParams.get('semester_id'));
  const lang_code = searchParams.get('lang_code') || 'ru';
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);

  const handleSubjectClick = (subjectId: number) => {
    console.log('Subject clicked:', subjectId);
    const params = new URLSearchParams({
      faculty_id: faculty_id.toString(),
      course_id: course_id.toString(),
      semester_id: semester_id.toString(),
      subject_id: subjectId.toString(),
      lang_code,
    });
    const url = `/dashboard/material-types?${params.toString()}`;
    console.log('Navigating to:', url);
    router.push(url);
  };

  const loadSubjects = useCallback(
    async (pageNum: number, append = false) => {
      if (!faculty_id || !course_id || !semester_id || loadingMore.current) {
        return;
      }

      if (!append) {
        setLoading(true);
      }
      loadingMore.current = true;
      setError(null);

      try {
        const res = await getSubjects({
          lang_code,
          faculty_id,
          course_id,
          semester_id,
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
    [faculty_id, course_id, semester_id, lang_code]
  );

  useEffect(() => {
    if (!faculty_id || !course_id || !semester_id) {
      setError('Некорректные параметры запроса');
      return;
    }
    setSubjects([]);
    setPage(1);
    setHasMore(true);
    loadSubjects(1, false);
  }, [faculty_id, course_id, semester_id, lang_code, loadSubjects]);

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

  const handleSubjectCreated = (newSubject: Subject) => {
    setSubjects([newSubject, ...subjects]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button className="btn-outline px-3 py-1 rounded" onClick={() => router.back()}>
            ← Назад
          </button>
          <h1 className="text-2xl font-bold">Список предметов</h1>
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
        course_id={course_id}
        semester_id={semester_id}
        faculty_id={faculty_id}
      />
    </div>
  );
}
