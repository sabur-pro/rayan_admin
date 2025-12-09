// users/page.tsx
'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, GraduationCap, Building2, BookOpen, Calendar, CreditCard, Check, X, Loader2 } from 'lucide-react';
import { getUsers, getSubscriptions, updateSubscriptionStatus } from '@/lib/user';
import { api } from '@/lib/api-client';
import { getCourses } from '@/lib/course';
import { getSemesters } from '@/lib/semester';
import type { User, Subscription } from '../../../../types/user';
import type { UniversityTranslation } from '../../../../types/university';
import type { Faculty } from '../../../../types/faculty';
import type { Course } from '../../../../types/course';
import type { Semester } from '../../../../types/semester';

type LangCode = 'tj' | 'ru' | 'en' | 'uz' | 'kg' | 'kz';

const LANGS: { code: LangCode; label: string }[] = [
  { code: 'ru', label: 'Русский (ru)' },
  { code: 'tj', label: 'Тоҷикӣ (tj)' },
  { code: 'en', label: 'English (en)' },
  { code: 'uz', label: 'Oʻzbek (uz)' },
  { code: 'kg', label: 'Кыргызча (kg)' },
  { code: 'kz', label: 'Қазақша (kz)' },
];

const ROLES = [
  { value: 'user', label: 'Пользователь' },
  { value: 'admin', label: 'Администратор' },
];

export default function UsersPage() {
  // Фильтры пользователей
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [role, setRole] = useState('user');
  const [langCode, setLangCode] = useState<LangCode>('ru');
  const [universityId, setUniversityId] = useState<number>(0);
  const [facultyId, setFacultyId] = useState<number>(0);
  const [courseId, setCourseId] = useState<number>(0);
  const [semesterId, setSemesterId] = useState<number>(0);
  const [loginSearch, setLoginSearch] = useState('');

  // Данные для селекторов
  const [universities, setUniversities] = useState<UniversityTranslation[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Загрузка данных
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [facultiesLoading, setFacultiesLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [semestersLoading, setSemestersLoading] = useState(false);

  // Пользователи
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Табы
  const [activeTab, setActiveTab] = useState<'users' | 'subscriptions'>('users');

  // Подписки
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subsPage, setSubsPage] = useState(1);
  const [subsLimit] = useState(20);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [subsHasMore, setSubsHasMore] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const subsObserverRef = useRef<HTMLDivElement>(null);
  const subsLoadingMore = useRef(false);
  const [updatingSubIds, setUpdatingSubIds] = useState<Set<number>>(new Set());
  const [proofPhotoModal, setProofPhotoModal] = useState<string | null>(null);

  // Функция расчёта периода подписки
  const calculatePeriod = (startDateStr: string, endDateStr: string): string => {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    const diff = end - start;
    
    if (diff <= 0) return '0 дней';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут'}`);
    if (seconds > 0 && days === 0) parts.push(`${seconds} ${seconds === 1 ? 'секунда' : seconds < 5 ? 'секунды' : 'секунд'}`);
    
    return parts.length > 0 ? parts.join(' ') : '0 секунд';
  };

  // Функция расчёта оставшегося времени
  const calculateRemaining = (endDateStr: string): { text: string; isExpired: boolean } => {
    const now = Date.now();
    const end = new Date(endDateStr).getTime();
    const diff = end - now;
    
    if (diff <= 0) return { text: 'Истекла', isExpired: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`);
    if (minutes > 0 && days === 0) parts.push(`${minutes} ${minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут'}`);
    
    return { text: parts.length > 0 ? parts.join(' ') : 'Менее минуты', isExpired: false };
  };

  // Обработчик изменения статуса подписки
  const handleStatusChange = async (subId: number, newStatus: 'accepted' | 'denied') => {
    setUpdatingSubIds((prev) => new Set(prev).add(subId));
    try {
      await updateSubscriptionStatus(subId, newStatus);
      // Обновляем статус в локальном состоянии
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subId ? { ...sub, status: newStatus } : sub
        )
      );
    } catch (err) {
      console.error('Failed to update subscription status:', err);
      alert('Ошибка при обновлении статуса: ' + (err as Error).message);
    } finally {
      setUpdatingSubIds((prev) => {
        const next = new Set(prev);
        next.delete(subId);
        return next;
      });
    }
  };

  // Загрузка университетов
  useEffect(() => {
    let cancelled = false;
    async function loadUniversities() {
      setUniversitiesLoading(true);
      try {
        const res = await api.getUniversityTranslations(langCode, 1, 100);
        if (!cancelled) setUniversities(res.data);
      } catch (err) {
        console.error('Failed to load universities:', err);
      } finally {
        if (!cancelled) setUniversitiesLoading(false);
      }
    }
    loadUniversities();
    return () => { cancelled = true; };
  }, [langCode]);

  // Загрузка факультетов
  useEffect(() => {
    if (universityId <= 0) {
      setFaculties([]);
      setFacultyId(0);
      return;
    }
    let cancelled = false;
    async function loadFaculties() {
      setFacultiesLoading(true);
      try {
        const res = await api.getFaculties(universityId, langCode, 1, 100);
        if (!cancelled) setFaculties(res.data);
      } catch (err) {
        console.error('Failed to load faculties:', err);
      } finally {
        if (!cancelled) setFacultiesLoading(false);
      }
    }
    loadFaculties();
    return () => { cancelled = true; };
  }, [universityId, langCode]);

  // Загрузка курсов
  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      setCoursesLoading(true);
      try {
        const res = await getCourses(langCode, 1, 100);
        if (!cancelled) setCourses(res.data);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }
    loadCourses();
    return () => { cancelled = true; };
  }, [langCode]);

  // Загрузка семестров
  useEffect(() => {
    let cancelled = false;
    async function loadSemesters() {
      setSemestersLoading(true);
      try {
        const res = await getSemesters(1, 100);
        if (!cancelled) setSemesters(res.data);
      } catch (err) {
        console.error('Failed to load semesters:', err);
      } finally {
        if (!cancelled) setSemestersLoading(false);
      }
    }
    loadSemesters();
    return () => { cancelled = true; };
  }, []);

  // Загрузка пользователей
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers({
        page,
        limit,
        role: role || undefined,
        lang_code: langCode || undefined,
        course_id: courseId > 0 ? courseId : undefined,
        semester_id: semesterId > 0 ? semesterId : undefined,
        university_id: universityId > 0 ? universityId : undefined,
        faculty_id: facultyId > 0 ? facultyId : undefined,
        login: loginSearch || undefined,
      });
      setUsers(res.data);
      setTotalCount(res.total_count);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError((err as Error).message || 'Ошибка при загрузке пользователей');
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, role, langCode, courseId, semesterId, universityId, facultyId, loginSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / limit)), [totalCount, limit]);

  const handleFilterChange = () => setPage(1);

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

  // Загрузка подписок
  const loadSubscriptionsData = useCallback(async (pageNum: number, append = false) => {
    if (subsLoadingMore.current) return;
    if (!append) setSubsLoading(true);
    subsLoadingMore.current = true;
    setSubsError(null);

    try {
      const res = await getSubscriptions({
        page: pageNum,
        limit: subsLimit,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      if (append) {
        setSubscriptions((prev) => [...prev, ...res]);
      } else {
        setSubscriptions(res);
      }
      setSubsHasMore(res.length === subsLimit);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setSubsError((err as Error).message || 'Ошибка при загрузке подписок');
    } finally {
      setSubsLoading(false);
      subsLoadingMore.current = false;
    }
  }, [subsLimit, startDate, endDate]);

  // Загрузка подписок при переключении таба
  useEffect(() => {
    if (activeTab === 'subscriptions') {
      setSubscriptions([]);
      setSubsPage(1);
      setSubsHasMore(true);
      loadSubscriptionsData(1, false);
    }
  }, [activeTab, startDate, endDate, loadSubscriptionsData]);

  // Infinity scroll
  useEffect(() => {
    if (activeTab !== 'subscriptions') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && subsHasMore && !subsLoadingMore.current) {
          setSubsPage((prev) => {
            const nextPage = prev + 1;
            loadSubscriptionsData(nextPage, true);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = subsObserverRef.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [activeTab, subsHasMore, loadSubscriptionsData]);

  const getStatusBorderStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'accepted': return { borderColor: '#22c55e', borderWidth: '3px' };
      case 'pending': return { borderColor: '#eab308', borderWidth: '3px' };
      case 'denied': return { borderColor: '#ef4444', borderWidth: '3px' };
      default: return { borderColor: '#9ca3af', borderWidth: '2px' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Принята';
      case 'pending': return 'Ожидает';
      case 'denied': return 'Отклонена';
      default: return status;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/10 text-green-600';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'denied': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Пользователи</h1>
          <p className="text-muted-foreground">Управление пользователями системы</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'users' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <Users className="h-4 w-4" />
              Пользователи
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'subscriptions' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Подписки
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            {activeTab === 'users'
              ? (loading ? 'Загрузка...' : error ? <span className="text-destructive">{error}</span> : `${totalCount} найдено`)
              : (subsLoading ? 'Загрузка...' : subsError ? <span className="text-destructive">{subsError}</span> : `${subscriptions.length} подписок`)}
          </div>
        </div>
      </div>

      {/* Контент для Пользователей */}
      {activeTab === 'users' && (
        <>
          <Card className="glass">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Search className="h-4 w-4" />
                    Логин
                  </label>
                  <input
                    type="text"
                    value={loginSearch}
                    onChange={(e) => { setLoginSearch(e.target.value); handleFilterChange(); }}
                    placeholder="Введите логин..."
                    className="px-3 py-2 rounded-md border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Роль
                  </label>
                  <select value={role} onChange={(e) => { setRole(e.target.value); handleFilterChange(); }} className="px-3 py-2 rounded-md border bg-transparent">
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground">Язык</label>
                  <select value={langCode} onChange={(e) => { setLangCode(e.target.value as LangCode); handleFilterChange(); }} className="px-3 py-2 rounded-md border bg-transparent">
                    {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Университет
                  </label>
                  <select value={universityId} onChange={(e) => { setUniversityId(Number(e.target.value)); setFacultyId(0); handleFilterChange(); }} className="px-3 py-2 rounded-md border bg-transparent" disabled={universitiesLoading}>
                    <option value={0}>Все университеты</option>
                    {universities.map((u) => <option key={u.university_id} value={u.university_id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Факультет
                  </label>
                  <select value={facultyId} onChange={(e) => { setFacultyId(Number(e.target.value)); handleFilterChange(); }} className="px-3 py-2 rounded-md border bg-transparent" disabled={facultiesLoading || universityId <= 0}>
                    <option value={0}>Все факультеты</option>
                    {faculties.map((f) => <option key={f.id} value={f.id}>{f.translations?.[0]?.name || `Факультет ${f.id}`}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Курс
                  </label>
                  <select value={courseId} onChange={(e) => { setCourseId(Number(e.target.value)); handleFilterChange(); }} className="px-3 py-2 rounded-md border bg-transparent" disabled={coursesLoading}>
                    <option value={0}>Все курсы</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.number} курс</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Семестр
                  </label>
                  <select value={semesterId} onChange={(e) => { setSemesterId(Number(e.target.value)); handleFilterChange(); }} className="px-3 py-2 rounded-md border bg-transparent" disabled={semestersLoading}>
                    <option value={0}>Все семестры</option>
                    {semesters.map((s) => <option key={s.ID} value={s.ID}>Семестр {s.Number}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground">На странице</label>
                  <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="px-3 py-2 rounded-md border bg-transparent">
                    {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Логин</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Роль</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Язык</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Курс</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Семестр</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Университет</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Факультет</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Предметов</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Создан</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading && <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Загрузка...</td></tr>}
                    {!loading && error && <tr><td colSpan={10} className="px-4 py-8 text-center text-destructive">{error}</td></tr>}
                    {!loading && !error && users.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Пользователи не найдены</td></tr>}
                    {!loading && !error && users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm">{user.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{user.login}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {user.role === 'admin' ? 'Админ' : 'Пользователь'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{user.lang_code?.toUpperCase()}</td>
                        <td className="px-4 py-3 text-sm">{user.course_id > 0 ? 7 - user.course_id : '-'}</td>
                        <td className="px-4 py-3 text-sm">{user.semester_id}</td>
                        <td className="px-4 py-3 text-sm">{user.university_id}</td>
                        <td className="px-4 py-3 text-sm">{user.faculty_id}</td>
                        <td className="px-4 py-3 text-sm"><span className="px-2 py-1 rounded bg-muted text-xs">{user.faculty?.subjects?.length || 0}</span></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Страница {page} из {totalPages} • Всего: {totalCount}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(1)} disabled={page === 1} className="btn-outline px-3 py-1 rounded disabled:opacity-50">«1</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline px-3 py-1 rounded disabled:opacity-50">‹</button>
                {generatePageRange(page, totalPages, 5).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'btn-outline hover:bg-muted'}`}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline px-3 py-1 rounded disabled:opacity-50">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="btn-outline px-3 py-1 rounded disabled:opacity-50">{totalPages}»</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Контент для Подписок */}
      {activeTab === 'subscriptions' && (
        <>
          <Card className="glass">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Дата начала
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate ? startDate.slice(0, 16) : ''}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="px-3 py-2 rounded-md border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Дата окончания
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate ? endDate.slice(0, 16) : ''}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="px-3 py-2 rounded-md border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1 justify-end">
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subsLoading && subscriptions.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">Загрузка...</div>
            )}
            {subsError && (
              <div className="col-span-full text-center py-8 text-destructive">{subsError}</div>
            )}
            {!subsLoading && !subsError && subscriptions.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">Подписки не найдены</div>
            )}
            {subscriptions.map((sub) => {
              const isUpdating = updatingSubIds.has(sub.id);
              const remaining = calculateRemaining(sub.end_date);
              return (
                <Card 
                  key={sub.id} 
                  className="border-solid transition-all hover:shadow-lg"
                  style={getStatusBorderStyle(sub.status)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium">{sub.user?.login || 'Неизвестный пользователь'}</div>
                        <div className="text-xs text-muted-foreground">ID подписки: {sub.id}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Цена:</span>
                        <span className="font-medium">{sub.price} сомони</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Начало:</span>
                        <span>{new Date(sub.start_date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Окончание:</span>
                        <span>{new Date(sub.end_date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Период:</span>
                        <span className="font-medium text-primary">{calculatePeriod(sub.start_date, sub.end_date)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Осталось:</span>
                        <span className={`font-semibold ${remaining.isExpired ? 'text-red-500' : 'text-green-500'}`}>
                          {remaining.text}
                        </span>
                      </div>
                      {sub.description && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground">Описание: </span>
                          <span>{sub.description}</span>
                        </div>
                      )}
                      {sub.proof_photo && sub.proof_photo !== 'https://api.medlife.tj/' && (
                        <div className="pt-2">
                          <button
                            onClick={() => setProofPhotoModal(sub.proof_photo)}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                          >
                            <CreditCard className="h-3 w-3" />
                            Посмотреть чек
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Курс: {sub.user?.course_id > 0 ? 7 - sub.user.course_id : '-'} • Семестр: {sub.user?.semester_id || '-'}
                    </div>
                    
                    {/* Кнопки управления для pending */}
                    {sub.status === 'pending' && (
                      <div className="mt-4 pt-3 border-t flex gap-2">
                        <button
                          onClick={() => handleStatusChange(sub.id, 'accepted')}
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleStatusChange(sub.id, 'denied')}
                          disabled={isUpdating}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          Отказать
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {subsHasMore && !subsError && (
            <div ref={subsObserverRef} className="text-center py-4">
              {subsLoadingMore.current && <div className="text-muted-foreground">Загрузка...</div>}
            </div>
          )}
        </>
      )}

      {/* Модальное окно для просмотра чека */}
      {proofPhotoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-auto"
          onClick={() => setProofPhotoModal(null)}
        >
          <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* Кнопка закрытия */}
            <button
              onClick={() => setProofPhotoModal(null)}
              className="fixed top-4 right-4 z-50 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Заголовок */}
            <div className="mb-4 flex items-center gap-4">
              <span className="text-white font-medium">Чек оплаты</span>
              <a 
                href={proofPhotoModal} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-300 hover:text-blue-200 underline"
              >
                Открыть оригинал
              </a>
            </div>
            
            {/* Изображение */}
            <img
              src={proofPhotoModal}
              alt="Чек оплаты"
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
