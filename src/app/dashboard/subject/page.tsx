// src/app/dashboard/subject/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubjects } from '@/lib/subject';
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

  useEffect(() => {
    if (!faculty_id || !course_id || !semester_id) {
      setError('Некорректные параметры запроса');
      return;
    }
    setLoading(true);
    setError(null);
    getSubjects({
      lang_code,
      faculty_id,
      course_id,
      semester_id,
      page: 1,
      limit: 10,
    })
      .then((res) => setSubjects(res.data))
      .catch((e) => setError(e.message || 'Ошибка при загрузке предметов'))
      .finally(() => setLoading(false));
  }, [faculty_id, course_id, semester_id, lang_code]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button className="btn-outline px-3 py-1 rounded" onClick={() => router.back()}>
          ← Назад
        </button>
        <h1 className="text-2xl font-bold">Список предметов</h1>
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
    </div>
  );
}
