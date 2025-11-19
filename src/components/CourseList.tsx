// components/CourseList.tsx (исправленная версия)
'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/http';
import CreateCourseModal from './CreateCourseModal';
import EditCourseModal from './EditCourseModal';

interface CourseTranslation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

interface CourseItem {
  id: number;
  number: number;
  created_at: string;
  updated_at: string;
  translations: CourseTranslation[];
}

interface CoursesResponse {
  data: CourseItem[];
  page: number;
  limit: number;
  total_count: number;
}

export default function CourseList() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [numberFilter, setNumberFilter] = useState<number | ''>('');
  const [langCodeFilter, setLangCodeFilter] = useState('ru');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        lang_code: langCodeFilter,
      });
      
      if (numberFilter) {
        params.append('number', numberFilter.toString());
      }

      const response = await fetchWithAuth(
        `https://api.medlife.tj/course?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data: CoursesResponse = await response.json();
      setCourses(data.data);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, numberFilter, langCodeFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleCourseCreated = (newCourse: CourseItem) => {
    setCourses(prev => [newCourse, ...prev]);
    setTotalCount(prev => prev + 1);
  };

  const handleCourseUpdated = (updatedCourse: CourseItem) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === updatedCourse.id ? updatedCourse : course
      )
    );
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Список курсов</h2>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-dark"
        >
          + Добавить курс
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-card rounded-lg border">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Номер курса</label>
          <input
            type="number"
            value={numberFilter}
            onChange={(e) => setNumberFilter(e.target.value ? parseInt(e.target.value) : '')}
            className="w-full p-2 border rounded-md bg-background"
            placeholder="Фильтр по номеру"
            min="1"
          />
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Язык</label>
          <select
            value={langCodeFilter}
            onChange={(e) => setLangCodeFilter(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="kz">Казахский</option>
            <option value="tj">Таджикский</option>
            <option value="uz">Узбекский</option>
            <option value="kg">Киргизский</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Элементов на странице</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Состояние загрузки */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/2 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="p-4 mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Список курсов */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">Курс #{course.number}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCourse(course)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Изменить
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {new Date(course.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Исправление ошибки: добавлена проверка на существование translations */}
                {(course.translations || [])
                  .filter((t) => t.lang_code === langCodeFilter)
                  .map((translation) => (
                    <div key={translation.lang_code} className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Название: </span>
                        <span>{translation.name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Описание: </span>
                        <span className="line-clamp-2">{translation.description || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Статус: </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          translation.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {translation.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              
              <span className="text-sm">
                Страница {page} из {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCourseCreated}
      />

      <EditCourseModal
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        course={editingCourse}
        onUpdated={handleCourseUpdated}
      />
    </div>
  );
}