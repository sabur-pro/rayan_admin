// components/CreateCourseModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/http';
import type { Course } from '../../types/course';

interface DegreeTranslation {
  lang_code: string;
  name: string;
  description: string;
  status: string;
}

interface DegreeItem {
  id: number;
  translations: DegreeTranslation[];
  created_at: string;
  updated_at: string;
}

interface DegreesResponse {
  data: DegreeItem[];
  page: number;
  limit: number;
  total_count: number;
}

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (course: Course) => void;
}

export default function CreateCourseModal({ isOpen, onClose, onCreated }: CreateCourseModalProps) {
  const [langCode, setLangCode] = useState('ru');
  const [degrees, setDegrees] = useState<DegreeItem[]>([]);
  const [selectedDegreeId, setSelectedDegreeId] = useState<number | null>(null);
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDegrees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, langCode]);

  const fetchDegrees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(
        `https://api.medlife.tj/degree?page=1&limit=100&lang_code=${langCode}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch degrees');
      }

      const data: DegreesResponse = await response.json();
      setDegrees(data.data);
      if (data.data.length > 0 && !selectedDegreeId) {
        setSelectedDegreeId(data.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDegreeId || !number) {
      setError('Please fill all fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetchWithAuth('https://api.medlife.tj/course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          degree_id: selectedDegreeId,
          number: parseInt(number),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create course');
      }

      const newCourse = await response.json();
      onCreated(newCourse);
      onClose();
      setNumber('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Добавить курс</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Язык</label>
            <select
              value={langCode}
              onChange={(e) => setLangCode(e.target.value)}
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

          <div>
            <label className="block text-sm font-medium mb-1">Уровень</label>
            {loading ? (
              <div className="p-2 border rounded-md bg-muted animate-pulse">Загрузка уровней...</div>
            ) : (
              <select
                value={selectedDegreeId || ''}
                onChange={(e) => setSelectedDegreeId(Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">Выберите уровень</option>
                {degrees.map((degree) => {
                  const translation = degree.translations.find(t => t.lang_code === langCode);
                  return (
                    <option key={degree.id} value={degree.id}>
                      {translation?.name || `Уровень ${degree.id}`}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Номер курса</label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Введите номер курса"
              min="1"
              required
            />
          </div>

          {error && (
            <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
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
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}