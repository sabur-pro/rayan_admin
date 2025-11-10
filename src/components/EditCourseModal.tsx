// components/EditCourseModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/http';

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

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseItem | null;
  onUpdated: (course: CourseItem) => void;
}

export default function EditCourseModal({ isOpen, onClose, course, onUpdated }: EditCourseModalProps) {
  const [number, setNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      setNumber(course.number.toString());
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course || !number) {
      setError('Please fill all fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`https://api.medlife.tj/course/${course.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: parseInt(number),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      const updatedCourse = await response.json();
      onUpdated(updatedCourse);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Редактировать курс #{course.number}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              {submitting ? 'Обновление...' : 'Обновить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}