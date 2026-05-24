'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { getCourses } from '@/lib/course';
import { getSemesters } from '@/lib/semester';
import type { UniversityTranslation } from '../../types/university';
import type { Faculty } from '../../types/faculty';
import type { Course } from '../../types/course';
import type { Semester } from '../../types/semester';

export function useAcademicData() {
  const [universities, setUniversities] = useState<UniversityTranslation[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  useEffect(() => {
    Promise.all([
      api.getUniversityTranslations('ru', 1, 100),
      getCourses('ru', 1, 100),
      getSemesters(1, 100),
    ]).then(([uniRes, courseRes, semRes]) => {
      setUniversities(uniRes.data || []);
      setCourses(courseRes.data || []);
      setSemesters(semRes.data || []);
    }).catch(() => {});
  }, []);

  const loadFaculties = async (universityId: number) => {
    if (universityId <= 0) { setFaculties([]); return; }
    try {
      const res = await api.getFaculties(universityId, 'ru', 1, 100);
      setFaculties(res.data || []);
    } catch { setFaculties([]); }
  };

  return { universities, faculties, courses, semesters, loadFaculties };
}

interface SelectorsProps {
  uni: string;
  setUni: (v: string) => void;
  fac: string;
  setFac: (v: string) => void;
  course: string;
  setCourse: (v: string) => void;
  sem: string;
  setSem: (v: string) => void;
  universities: UniversityTranslation[];
  faculties: Faculty[];
  courses: Course[];
  semesters: Semester[];
  onUniversityChange?: (id: number) => void;
}

export function AcademicSelectors({
  uni, setUni, fac, setFac, course, setCourse, sem, setSem,
  universities, faculties, courses, semesters, onUniversityChange
}: SelectorsProps) {
  const selectClass = "w-full px-3 py-2 rounded-md border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm";

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium mb-1 block">Университет</label>
        <select
          value={uni}
          onChange={(e) => {
            setUni(e.target.value);
            setFac('');
            onUniversityChange?.(Number(e.target.value));
          }}
          className={selectClass}
        >
          <option value="">Не указан</option>
          {universities.map(u => (
            <option key={u.university_id} value={u.university_id}>{u.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Факультет</label>
        <select
          value={fac}
          onChange={(e) => setFac(e.target.value)}
          className={selectClass}
          disabled={!uni}
        >
          <option value="">Не указан</option>
          {faculties.map(f => (
            <option key={f.id} value={f.id}>
              {f.translations?.[0]?.name || `Факультет ${f.id}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Курс</label>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className={selectClass}>
          <option value="">Не указан</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.number} курс</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Семестр</label>
        <select value={sem} onChange={(e) => setSem(e.target.value)} className={selectClass}>
          <option value="">Не указан</option>
          {semesters.map(s => (
            <option key={s.ID} value={s.ID}>Семестр {s.Number}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface TagsProps {
  item: {
    university_name?: string;
    faculty_name?: string;
    course_number?: number;
    semester_number?: number;
    university_id?: number;
    faculty_id?: number;
    course_id?: number;
    semester_id?: number;
  };
}

export function AcademicTags({ item }: TagsProps) {
  const hasAny = item.university_id || item.faculty_id || item.course_id || item.semester_id;

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {item.university_id ? (
        <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded-full">
          {item.university_name || `Университет #${item.university_id}`}
        </span>
      ) : null}
      {item.faculty_id ? (
        <span className="px-2 py-1 bg-purple-500/10 text-purple-600 rounded-full">
          {item.faculty_name || `Факультет #${item.faculty_id}`}
        </span>
      ) : null}
      {item.course_id ? (
        <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded-full">
          {item.course_number ? `${item.course_number} курс` : `Курс #${item.course_id}`}
        </span>
      ) : null}
      {item.semester_id ? (
        <span className="px-2 py-1 bg-orange-500/10 text-orange-600 rounded-full">
          {item.semester_number ? `Семестр ${item.semester_number}` : `Семестр #${item.semester_id}`}
        </span>
      ) : null}
      {!hasAny && (
        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full">Для всех</span>
      )}
    </div>
  );
}
