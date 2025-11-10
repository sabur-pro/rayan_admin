// components/SemesterList.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/http';

interface Semester {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Number: number;
}

interface SemesterResponse {
  data: Semester[];
  page: number;
  limit: number;
  total_count: number;
}

export default function SemesterList() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 10;
  const totalPages = Math.ceil(totalCount / limit);

  useEffect(() => {
    fetchSemesters();
  }, [currentPage]);

  const fetchSemesters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchWithAuth(
        `https://api.medlife.tj/semester?page=${currentPage}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
      }

      const data: SemesterResponse = await response.json();
      setSemesters(data.data);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-destructive mb-4">Ошибка: {error}</div>
        <button 
          onClick={fetchSemesters}
          className="btn-primary px-4 py-2 rounded-lg"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 animate-in">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Список семестров</h2>
      
      {semesters.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Семестры не найдены
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {semesters.map((semester) => (
              <div
                key={semester.ID}
                className="card-hover bg-card rounded-lg shadow-md p-6 border border-border transition-all duration-300"
              >
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                  Семестр #{semester.Number}
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ID: {semester.ID}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Создан: {new Date(semester.CreatedAt).toLocaleDateString('ru-RU')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Обновлён: {new Date(semester.UpdatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-outline px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              
              <span className="text-foreground">
                Страница {currentPage} из {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-outline px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}