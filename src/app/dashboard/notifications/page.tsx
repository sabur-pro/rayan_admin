// notifications/page.tsx — раздел push-рассылок.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell, Plus, Send, Users2, Ban, Trash2, Loader2, Clock, Repeat, Zap, RefreshCw, Search, X, UserPlus,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { getCourses } from '@/lib/course';
import { getSemesters } from '@/lib/semester';
import { getUsers } from '@/lib/user';
import RichEditor from '@/components/RichEditor';
import {
  listCampaigns, createCampaign, updateCampaign, deleteCampaign,
  sendCampaignNow, cancelCampaign, previewAudience, getPushStats, PUSH_LANGS,
  type Campaign, type CampaignAudience, type CampaignSchedule, type PushStats,
  type PushTranslation, type AudienceType, type SubscriptionSeg, type ScheduleType,
} from '@/lib/notifications';
import type { UniversityTranslation } from '../../../../types/university';
import type { Faculty } from '../../../../types/faculty';
import type { Course } from '../../../../types/course';
import type { Semester } from '../../../../types/semester';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Черновик', cls: 'bg-gray-500/15 text-gray-500' },
  scheduled: { label: 'Запланирована', cls: 'bg-blue-500/15 text-blue-500' },
  sending: { label: 'Отправляется', cls: 'bg-amber-500/15 text-amber-500' },
  sent: { label: 'Отправлена', cls: 'bg-green-500/15 text-green-500' },
  cancelled: { label: 'Отменена', cls: 'bg-gray-500/15 text-gray-500' },
  failed: { label: 'Ошибка', cls: 'bg-red-500/15 text-red-500' },
};

const CRON_PRESETS = [
  { label: 'Каждый день в 9:00', expr: '0 9 * * *' },
  { label: 'Каждый пн в 9:00', expr: '0 9 * * 1' },
  { label: 'Каждую пятницу в 18:00', expr: '0 18 * * 5' },
  { label: '1-го числа месяца в 10:00', expr: '0 10 1 * *' },
];

const LANG_FETCH = 'ru';

function emptyTranslations(): Record<string, PushTranslation> {
  const m: Record<string, PushTranslation> = {};
  for (const l of PUSH_LANGS) m[l.code] = { lang_code: l.code, title: '', body: '', content: '' };
  return m;
}

type SelectedUser = { id: number; login: string; phone: string };

type FormState = {
  id?: number;
  translations: Record<string, PushTranslation>;
  activeLang: string;
  audienceType: AudienceType;
  universityId: number;
  facultyId: number;
  courseId: number;
  semesterId: number;
  selectedUsers: SelectedUser[];
  subscriptionSeg: SubscriptionSeg;
  scheduleType: ScheduleType;
  scheduledAt: string; // datetime-local value
  cronExpr: string;
  timezone: string;
  data: string;
};

function newForm(): FormState {
  return {
    translations: emptyTranslations(),
    activeLang: 'ru',
    audienceType: 'all',
    universityId: 0,
    facultyId: 0,
    courseId: 0,
    semesterId: 0,
    selectedUsers: [],
    subscriptionSeg: 'all',
    scheduleType: 'now',
    scheduledAt: '',
    cronExpr: '0 9 * * *',
    timezone: 'Asia/Dushanbe',
    data: '',
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function NotificationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(newForm());
  const [saving, setSaving] = useState(false);

  // Справочники для таргетинга.
  const [universities, setUniversities] = useState<UniversityTranslation[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [preview, setPreview] = useState<{ recipient_count: number; device_count: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [stats, setStats] = useState<PushStats | null>(null);

  // Поиск пользователей (для точечной рассылки).
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<SelectedUser[]>([]);
  const [userSearching, setUserSearching] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCampaigns(1, 50);
      setCampaigns(res.data || []);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getPushStats());
    } catch (e) {
      console.error('Не удалось загрузить статистику', e);
    }
  }, []);

  useEffect(() => { loadCampaigns(); loadStats(); }, [loadCampaigns, loadStats]);

  // Справочники (один раз). Загружаем независимо, чтобы сбой одного запроса
  // не оставлял пустыми остальные списки.
  useEffect(() => {
    api.getUniversityTranslations(LANG_FETCH, 1, 100)
      .then((u) => setUniversities(u.data || []))
      .catch((e) => console.error('universities load failed', e));
    getCourses(LANG_FETCH, 1, 100)
      .then((c) => setCourses(c.data || []))
      .catch((e) => console.error('courses load failed', e));
    getSemesters(1, 100)
      .then((s) => setSemesters(s.data || []))
      .catch((e) => console.error('semesters load failed', e));
  }, []);

  // Факультеты — при выборе университета.
  useEffect(() => {
    if (form.audienceType !== 'users' || form.universityId <= 0) {
      setFaculties([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getFaculties(form.universityId, LANG_FETCH, 1, 100);
        if (!cancelled) setFaculties(res.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [form.audienceType, form.universityId]);

  // Оценка охвата (дебаунс).
  const audiencePayload: CampaignAudience = useMemo(() => ({
    audience_type: form.audienceType,
    subscription_seg: form.audienceType === 'specific' ? 'all' : form.subscriptionSeg,
    university_id: form.audienceType === 'users' && form.universityId > 0 ? form.universityId : null,
    faculty_id: form.audienceType === 'users' && form.facultyId > 0 ? form.facultyId : null,
    course_id: form.audienceType === 'users' && form.courseId > 0 ? form.courseId : null,
    semester_id: form.audienceType === 'users' && form.semesterId > 0 ? form.semesterId : null,
    user_ids: form.audienceType === 'specific' ? form.selectedUsers.map((u) => u.id) : undefined,
  }), [form.audienceType, form.subscriptionSeg, form.universityId, form.facultyId, form.courseId, form.semesterId, form.selectedUsers]);

  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;
    setPreviewLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await previewAudience(audiencePayload);
        if (!cancelled) setPreview(res);
      } catch (e) {
        if (!cancelled) setPreview(null);
        console.error(e);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [audiencePayload, showForm]);

  // Поиск пользователей по логину (дебаунс).
  useEffect(() => {
    if (form.audienceType !== 'specific') return;
    const q = userQuery.trim();
    if (q === '') { setUserResults([]); return; }
    let cancelled = false;
    setUserSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await getUsers({ page: 1, limit: 20, role: 'user', login: q });
        if (!cancelled) {
          setUserResults((res.data || []).map((u) => ({ id: u.id, login: u.login, phone: u.phone })));
        }
      } catch (e) {
        console.error('user search failed', e);
        if (!cancelled) setUserResults([]);
      } finally {
        if (!cancelled) setUserSearching(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [userQuery, form.audienceType]);

  function addUser(u: SelectedUser) {
    setForm((f) => f.selectedUsers.some((x) => x.id === u.id) ? f : { ...f, selectedUsers: [...f.selectedUsers, u] });
  }
  function removeUser(id: number) {
    setForm((f) => ({ ...f, selectedUsers: f.selectedUsers.filter((x) => x.id !== id) }));
  }

  function openCreate() {
    setForm(newForm());
    setShowForm(true);
  }

  function openEdit(c: Campaign) {
    const tr = emptyTranslations();
    for (const t of c.translations) tr[t.lang_code] = { lang_code: t.lang_code, title: t.title, body: t.body, content: t.content || '' };
    setForm({
      id: c.id,
      translations: tr,
      activeLang: 'ru',
      audienceType: c.audience_type,
      universityId: c.university_id ?? 0,
      facultyId: c.faculty_id ?? 0,
      courseId: c.course_id ?? 0,
      semesterId: c.semester_id ?? 0,
      selectedUsers: [], // список конкретных юзеров при редактировании подгружать не будем — задаётся заново
      subscriptionSeg: c.subscription_seg,
      scheduleType: c.schedule_type,
      scheduledAt: c.scheduled_at ? toLocalInput(c.scheduled_at) : '',
      cronExpr: c.cron_expr || '0 9 * * *',
      timezone: c.timezone || 'Asia/Dushanbe',
      data: c.data || '',
    });
    setShowForm(true);
  }

  function setTr(code: string, field: 'title' | 'body' | 'content', value: string) {
    setForm((f) => ({
      ...f,
      translations: { ...f.translations, [code]: { ...f.translations[code], [field]: value } },
    }));
  }

  function buildPayload() {
    const translations: PushTranslation[] = Object.values(form.translations)
      .filter((t) => t.title.trim() !== '' && t.body.trim() !== '')
      .map((t) => ({
        lang_code: t.lang_code,
        title: t.title.trim(),
        body: t.body.trim(),
        content: (t.content || '').trim(),
      }));

    const schedule: CampaignSchedule = {
      schedule_type: form.scheduleType,
      timezone: form.timezone,
    };
    if (form.scheduleType === 'scheduled') {
      schedule.scheduled_at = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null;
    }
    if (form.scheduleType === 'recurring') {
      schedule.cron_expr = form.cronExpr.trim();
    }

    return {
      audience: audiencePayload,
      schedule,
      data: form.data.trim(),
      translations,
    };
  }

  async function handleSave() {
    const payload = buildPayload();
    if (payload.translations.length === 0) {
      alert('Заполните заголовок и текст хотя бы для одного языка.');
      return;
    }
    if (form.audienceType === 'specific' && form.selectedUsers.length === 0) {
      alert('Выберите хотя бы одного пользователя.');
      return;
    }
    if (payload.schedule.schedule_type === 'scheduled' && !payload.schedule.scheduled_at) {
      alert('Укажите дату и время отправки.');
      return;
    }
    if (payload.schedule.schedule_type === 'recurring' && !payload.schedule.cron_expr) {
      alert('Укажите cron-выражение.');
      return;
    }
    if (payload.data) {
      try { JSON.parse(payload.data); } catch { alert('Поле «данные» должно быть валидным JSON.'); return; }
    }

    setSaving(true);
    try {
      if (form.id) {
        await updateCampaign(form.id, payload);
      } else {
        await createCampaign(payload);
      }
      setShowForm(false);
      await loadCampaigns();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSend(c: Campaign) {
    if (!confirm('Отправить рассылку прямо сейчас?')) return;
    try { await sendCampaignNow(c.id); await loadCampaigns(); }
    catch (e) { alert((e as Error).message); }
  }

  async function handleCancel(c: Campaign) {
    if (!confirm('Остановить/отменить рассылку?')) return;
    try { await cancelCampaign(c.id); await loadCampaigns(); }
    catch (e) { alert((e as Error).message); }
  }

  async function handleDelete(c: Campaign) {
    if (!confirm('Удалить рассылку безвозвратно?')) return;
    try { await deleteCampaign(c.id); await loadCampaigns(); }
    catch (e) { alert((e as Error).message); }
  }

  const selectCls = 'w-full px-3 py-2 rounded-md border bg-transparent';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Уведомления</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { loadCampaigns(); loadStats(); }}><RefreshCw className="h-4 w-4 mr-2" />Обновить</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Создать рассылку</Button>
        </div>
      </div>

      {/* Статистика устройств */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Устройств с токеном', value: stats?.total_devices ?? '—', icon: <Users2 className="h-4 w-4" /> },
          { label: 'Пользователей', value: stats?.users_with_device ?? '—', icon: <Users2 className="h-4 w-4" /> },
          { label: 'Android', value: stats?.android_devices ?? '—', icon: <Bell className="h-4 w-4" /> },
          { label: 'iOS', value: stats?.ios_devices ?? '—', icon: <Bell className="h-4 w-4" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1">{s.icon}{s.label}</div>
              <div className="text-2xl font-semibold mt-1">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {stats && stats.total_devices === 0 && (
        <div className="text-sm rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-600 px-3 py-2">
          Ни одного устройства не зарегистрировано. Push-токены с приложения ещё не приходили — проверьте настройку FCM (Android) / APNs (iOS) и что приложение вызывает регистрацию токена после входа.
        </div>
      )}

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">{form.id ? 'Редактировать рассылку' : 'Новая рассылка'}</h2>

            {/* Тексты по языкам (табы) */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Текст уведомления (по языкам, ru — обязателен)</div>
              <div className="flex flex-wrap gap-1">
                {PUSH_LANGS.map((l) => {
                  const filled = (form.translations[l.code]?.title || '').trim() !== '';
                  return (
                    <button key={l.code} type="button"
                      className={`text-xs px-3 py-1.5 rounded-md border ${form.activeLang === l.code ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                      onClick={() => setForm((f) => ({ ...f, activeLang: l.code }))}>
                      {l.label}{filled ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>

              {(() => {
                const code = form.activeLang;
                return (
                  <div className="space-y-2">
                    <Input
                      placeholder="Заголовок (показывается в системном пуше)"
                      value={form.translations[code]?.title || ''}
                      onChange={(e) => setTr(code, 'title', e.target.value)}
                    />
                    <textarea
                      className="w-full px-3 py-2 rounded-md border bg-transparent min-h-[56px]"
                      placeholder="Короткий текст пуша (обязательно)"
                      value={form.translations[code]?.body || ''}
                      onChange={(e) => setTr(code, 'body', e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Описание (для ленты в приложении) — ссылки, форматирование, картинки:
                    </div>
                    <RichEditor
                      key={`${form.id ?? 'new'}-${code}`}
                      lang={code}
                      value={form.translations[code]?.content || ''}
                      onChange={(html) => setTr(code, 'content', html)}
                      placeholder="Полное сообщение (необязательно). Картинки загружаются в галерею."
                    />
                  </div>
                );
              })()}
            </div>

            {/* Аудитория */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Аудитория</div>
              <div className="flex gap-2">
                <Button type="button" variant={form.audienceType === 'all' ? 'default' : 'outline'} size="sm"
                  onClick={() => setForm((f) => ({ ...f, audienceType: 'all' }))}>
                  <Users2 className="h-4 w-4 mr-2" />Все пользователи
                </Button>
                <Button type="button" variant={form.audienceType === 'users' ? 'default' : 'outline'} size="sm"
                  onClick={() => setForm((f) => ({ ...f, audienceType: 'users' }))}>
                  По фильтру
                </Button>
                <Button type="button" variant={form.audienceType === 'specific' ? 'default' : 'outline'} size="sm"
                  onClick={() => setForm((f) => ({ ...f, audienceType: 'specific' }))}>
                  <UserPlus className="h-4 w-4 mr-2" />Выбрать пользователей
                </Button>
              </div>

              {form.audienceType === 'specific' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Поиск по логину…"
                      value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
                    {userSearching && <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
                  </div>
                  {userResults.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-auto divide-y">
                      {userResults.map((u) => (
                        <button key={u.id} type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent flex justify-between items-center"
                          onClick={() => addUser(u)}>
                          <span>{u.login}</span>
                          <span className="text-xs text-muted-foreground">{u.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {form.selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.selectedUsers.map((u) => (
                        <span key={u.id} className="inline-flex items-center gap-1 text-sm bg-primary/10 text-primary rounded-full px-3 py-1">
                          {u.login}
                          <button type="button" onClick={() => removeUser(u.id)}><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {form.audienceType === 'users' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm">Университет</label>
                    <select className={selectCls} value={form.universityId}
                      onChange={(e) => setForm((f) => ({ ...f, universityId: Number(e.target.value), facultyId: 0 }))}>
                      <option value={0}>Любой</option>
                      {universities.map((u) => (
                        <option key={u.university_id} value={u.university_id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Факультет</label>
                    <select className={selectCls} value={form.facultyId} disabled={form.universityId <= 0}
                      onChange={(e) => setForm((f) => ({ ...f, facultyId: Number(e.target.value) }))}>
                      <option value={0}>Любой</option>
                      {faculties.map((fac) => (
                        <option key={fac.id} value={fac.id}>{fac.translations?.[0]?.name || `Факультет ${fac.id}`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Курс</label>
                    <select className={selectCls} value={form.courseId}
                      onChange={(e) => setForm((f) => ({ ...f, courseId: Number(e.target.value) }))}>
                      <option value={0}>Любой</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.translations?.[0]?.name || `Курс ${c.number}`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Семестр</label>
                    <select className={selectCls} value={form.semesterId}
                      onChange={(e) => setForm((f) => ({ ...f, semesterId: Number(e.target.value) }))}>
                      <option value={0}>Любой</option>
                      {semesters.map((s) => (
                        <option key={s.ID} value={s.ID}>{`Семестр ${s.Number}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {form.audienceType !== 'specific' && (
                <div className="max-w-xs">
                  <label className="text-sm">Подписка</label>
                  <select className={selectCls} value={form.subscriptionSeg}
                    onChange={(e) => setForm((f) => ({ ...f, subscriptionSeg: e.target.value as SubscriptionSeg }))}>
                    <option value="all">Все</option>
                    <option value="active">Только с активной подпиской</option>
                    <option value="inactive">Только без активной подписки</option>
                  </select>
                </div>
              )}

              <div className="text-sm text-muted-foreground flex items-center gap-2">
                {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users2 className="h-4 w-4" />}
                Охват: <b>{preview?.recipient_count ?? '—'}</b> пользователей,
                <b>{preview?.device_count ?? '—'}</b> устройств
              </div>
            </div>

            {/* Расписание */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Расписание</div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={form.scheduleType === 'now' ? 'default' : 'outline'}
                  onClick={() => setForm((f) => ({ ...f, scheduleType: 'now' }))}>
                  <Zap className="h-4 w-4 mr-2" />Сейчас
                </Button>
                <Button type="button" size="sm" variant={form.scheduleType === 'scheduled' ? 'default' : 'outline'}
                  onClick={() => setForm((f) => ({ ...f, scheduleType: 'scheduled' }))}>
                  <Clock className="h-4 w-4 mr-2" />По дате
                </Button>
                <Button type="button" size="sm" variant={form.scheduleType === 'recurring' ? 'default' : 'outline'}
                  onClick={() => setForm((f) => ({ ...f, scheduleType: 'recurring' }))}>
                  <Repeat className="h-4 w-4 mr-2" />Повторяющаяся
                </Button>
              </div>

              {form.scheduleType === 'scheduled' && (
                <div className="max-w-xs">
                  <label className="text-sm">Дата и время</label>
                  <input type="datetime-local" className={selectCls} value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
              )}

              {form.scheduleType === 'recurring' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">Cron-выражение (мин час день месяц дн.недели)</label>
                      <Input value={form.cronExpr} placeholder="0 9 * * 1"
                        onChange={(e) => setForm((f) => ({ ...f, cronExpr: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm">Часовой пояс</label>
                      <Input value={form.timezone} placeholder="Asia/Dushanbe"
                        onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CRON_PRESETS.map((p) => (
                      <button key={p.expr} type="button"
                        className="text-xs px-2 py-1 rounded border hover:bg-accent"
                        onClick={() => setForm((f) => ({ ...f, cronExpr: p.expr }))}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Доп. данные */}
            <div>
              <label className="text-sm text-muted-foreground">Данные для перехода (JSON, необязательно)</label>
              <Input value={form.data} placeholder='{"screen":"Material","id":42}'
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {form.id ? 'Сохранить' : form.scheduleType === 'now' ? 'Создать и отправить' : 'Создать'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Пока нет рассылок</div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const st = STATUS_LABELS[c.status] || STATUS_LABELS.draft;
            const title = c.translations.find((t) => t.lang_code === 'ru')?.title
              || c.translations[0]?.title || '(без заголовка)';
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        <span className="font-medium truncate">{title}</span>
                        {c.schedule_type === 'recurring' && (
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Repeat className="h-3 w-3" />{c.cron_expr}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Аудитория: {c.audience_type === 'all' ? 'все' : c.audience_type === 'specific' ? 'выбранные' : 'по фильтру'}
                        {' · '}подписка: {c.subscription_seg}
                        {' · '}отправлено: {c.total_sent}{c.total_failed ? ` (ошибок ${c.total_failed})` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {c.schedule_type === 'now' ? 'Разовая' :
                          c.schedule_type === 'scheduled' ? `Запланирована: ${fmtDate(c.scheduled_at)}` :
                          `Следующая: ${fmtDate(c.next_run_at)}`}
                        {c.last_run_at ? ` · последняя: ${fmtDate(c.last_run_at)}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" title="Отправить сейчас" onClick={() => handleSend(c)}>
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Редактировать" onClick={() => openEdit(c)}>
                        <Clock className="h-4 w-4" />
                      </Button>
                      {(c.status === 'scheduled' || c.schedule_type === 'recurring') && (
                        <Button size="sm" variant="ghost" title="Остановить" onClick={() => handleCancel(c)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" title="Удалить" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ISO -> значение для <input type="datetime-local"> в локальном времени.
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
