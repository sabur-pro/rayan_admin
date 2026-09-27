// src/app/dashboard/projects/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
  Save,
  Loader2,
  ImagePlus,
  ArrowLeft,
  ArrowRight,
  Star,
  Link2,
  X,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectImage,
} from '@/lib/project';
import type { Project, ProjectInput } from '../../../../types/project';

const EMPTY: ProjectInput = { title: '', description: '', images: [], links: [] };

const toInput = (p: Project): ProjectInput => ({
  title: p.title,
  description: p.description,
  images: [...(p.images ?? [])],
  links: [...(p.links ?? [])],
});

const isValidUrl = (value: string) => /^https?:\/\/\S+\.\S+/i.test(value.trim());

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Projects shown in the app under Profile → «Проекты».
 *
 * The app renders exactly these fields (ProjectDetailsScreen): a horizontal
 * strip of images, the title, the description as plain text with line breaks,
 * and a list of links. The preview on the right mirrors that layout, so what is
 * edited here is what students see.
 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  /** null = nothing open, 'new' = creating, number = editing that id. */
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<ProjectInput>(EMPTY);
  const [original, setOriginal] = useState<ProjectInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(original), [form, original]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getProjects(1, 100);
      setProjects(res.data ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const confirmDiscard = () => !dirty || window.confirm('Есть несохранённые изменения. Отменить их?');

  const openProject = (p: Project) => {
    if (editingId === p.id || !confirmDiscard()) return;
    const input = toInput(p);
    setEditingId(p.id);
    setForm(input);
    setOriginal(input);
    setError(null);
    setImageUrlInput('');
    setLinkInput('');
  };

  const openNew = () => {
    if (!confirmDiscard()) return;
    setEditingId('new');
    setForm(EMPTY);
    setOriginal(EMPTY);
    setError(null);
    setImageUrlInput('');
    setLinkInput('');
  };

  const close = () => {
    if (!confirmDiscard()) return;
    setEditingId(null);
    setForm(EMPTY);
    setOriginal(EMPTY);
    setError(null);
  };

  const patch = (p: Partial<ProjectInput>) => setForm((prev) => ({ ...prev, ...p }));

  // --- images -------------------------------------------------------------

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) {
      setError('Можно загружать только картинки (jpg, png, webp, gif)');
      return;
    }
    setError(null);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const url = await uploadProjectImage(file);
        setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!isValidUrl(url)) {
      setError('Введите корректную ссылку на картинку (https://...)');
      return;
    }
    patch({ images: [...form.images, url] });
    setImageUrlInput('');
    setError(null);
  };

  // --- links --------------------------------------------------------------

  const addLink = () => {
    const url = linkInput.trim();
    if (!isValidUrl(url)) {
      setError('Ссылка должна начинаться с http:// или https://');
      return;
    }
    if (form.links.includes(url)) {
      setError('Такая ссылка уже добавлена');
      return;
    }
    patch({ links: [...form.links, url] });
    setLinkInput('');
    setError(null);
  };

  // --- save / delete ------------------------------------------------------

  const validationError = (): string | null => {
    if (!form.title.trim()) return 'Укажите название проекта';
    if (!form.description.trim()) return 'Добавьте описание проекта';
    const badLink = form.links.find((l) => !isValidUrl(l));
    if (badLink) return `Некорректная ссылка: ${badLink}`;
    return null;
  };

  const save = async () => {
    const problem = validationError();
    if (problem) {
      setError(problem);
      return;
    }
    const payload: ProjectInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      images: form.images,
      links: form.links.map((l) => l.trim()),
    };
    setSaving(true);
    setError(null);
    try {
      if (editingId === 'new') {
        await createProject(payload);
        // The create endpoint returns no id; the newest project is first.
        const res = await getProjects(1, 100);
        const list = res.data ?? [];
        setProjects(list);
        const created = list[0];
        if (created) {
          setEditingId(created.id);
          const input = toInput(created);
          setForm(input);
          setOriginal(input);
        }
        setNotice('Проект создан');
      } else if (typeof editingId === 'number') {
        await updateProject(editingId, payload);
        setProjects((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
        setForm(payload);
        setOriginal(payload);
        setNotice('Изменения сохранены');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (typeof editingId !== 'number') return;
    if (!window.confirm(`Удалить проект «${form.title || original.title}»? Это действие необратимо.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProject(editingId);
      setProjects((prev) => prev.filter((p) => p.id !== editingId));
      setEditingId(null);
      setForm(EMPTY);
      setOriginal(EMPTY);
      setNotice('Проект удалён');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [projects, query]);

  // --- render -------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Проекты</h1>
          <p className="text-muted-foreground">
            Раздел «Проекты» в приложении (Профиль → Проекты): картинки, описание и ссылки
          </p>
        </div>
        <button
          onClick={openNew}
          className="btn-primary px-4 py-2 rounded-lg shadow-md flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Новый проект
        </button>
      </div>

      {notice && (
        <div className="rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-2 text-sm">
          ✓ {notice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
        {/* ---- list ---- */}
        <section className="rounded-xl glass border shadow-sm p-3 space-y-3 xl:sticky xl:top-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск проектов…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {loading && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
              Загрузка…
            </div>
          )}
          {loadError && (
            <div className="text-sm text-red-600 dark:text-red-400 p-2">
              {loadError}{' '}
              <button onClick={load} className="underline">Повторить</button>
            </div>
          )}
          {!loading && !loadError && filtered.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {projects.length === 0 ? 'Проектов пока нет' : 'Ничего не найдено'}
            </div>
          )}

          <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((p) => {
              const cover = p.images?.[0];
              const active = editingId === p.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => openProject(p)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors border ${
                      active ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <FolderKanban className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{p.title || 'Без названия'}</div>
                      <div className="text-xs text-muted-foreground">
                        {(p.images?.length ?? 0)} фото · {(p.links?.length ?? 0)} ссылок
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- editor ---- */}
        {editingId === null ? (
          <section className="rounded-xl glass border shadow-sm p-10 text-center text-muted-foreground">
            <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-60" />
            Выберите проект слева или создайте новый
          </section>
        ) : (
          <div className="grid grid-cols-1 2xl:grid-cols-[1fr_340px] gap-6 items-start">
            <section className="rounded-xl glass border shadow-sm p-5 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  {editingId === 'new' ? 'Новый проект' : `Проект #${editingId}`}
                  {dirty && <span className="ml-2 text-xs font-normal text-amber-600">• не сохранено</span>}
                </h2>
                <button onClick={close} className="p-2 rounded-md hover:bg-muted" title="Закрыть">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Название *</label>
                <input
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  maxLength={255}
                  placeholder="Например: Школа молодого хирурга"
                  className="w-full px-3 py-2 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="text-xs text-muted-foreground text-right">{form.title.length}/255</div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Описание *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  rows={10}
                  placeholder="Расскажите о проекте. Переносы строк сохраняются в приложении."
                  className="w-full px-3 py-2 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-primary/40 resize-y leading-relaxed"
                />
                <div className="text-xs text-muted-foreground text-right">{form.description.length} символов</div>
              </div>

              {/* Images */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Картинки ({form.images.length})</label>
                  <span className="text-xs text-muted-foreground">Первая — обложка в списке</span>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/60'
                  }`}
                >
                  {uploading > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                      Загрузка… ({uploading})
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <ImagePlus className="h-6 w-6 mx-auto mb-1" />
                      Перетащите картинки сюда или нажмите, чтобы выбрать (можно несколько)
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.length) uploadFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                    placeholder="…или вставьте ссылку на картинку"
                    className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button onClick={addImageUrl} className="btn-outline px-3 py-2 rounded-lg text-sm">
                    Добавить
                  </button>
                </div>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {form.images.map((src, i) => (
                      <div key={`${src}-${i}`} className="group relative rounded-lg overflow-hidden border bg-muted aspect-[4/3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                            Обложка
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1 bg-black/55 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <button
                              title="Левее"
                              disabled={i === 0}
                              onClick={() => patch({ images: move(form.images, i, i - 1) })}
                              className="p-1 rounded text-white hover:bg-white/20 disabled:opacity-30"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="Правее"
                              disabled={i === form.images.length - 1}
                              onClick={() => patch({ images: move(form.images, i, i + 1) })}
                              className="p-1 rounded text-white hover:bg-white/20 disabled:opacity-30"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            {i !== 0 && (
                              <button
                                title="Сделать обложкой"
                                onClick={() => patch({ images: move(form.images, i, 0) })}
                                className="p-1 rounded text-white hover:bg-white/20"
                              >
                                <Star className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <button
                            title="Убрать"
                            onClick={() => patch({ images: form.images.filter((_, j) => j !== i) })}
                            className="p-1 rounded text-white hover:bg-red-500/80"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Ссылки ({form.links.length})</label>
                <div className="flex gap-2">
                  <input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                    placeholder="https://instagram.com/…"
                    className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button onClick={addLink} className="btn-outline px-3 py-2 rounded-lg text-sm flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Добавить
                  </button>
                </div>
                {form.links.length > 0 && (
                  <ul className="space-y-2">
                    {form.links.map((link, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <input
                          value={link}
                          onChange={(e) =>
                            patch({ links: form.links.map((l, j) => (j === i ? e.target.value : l)) })
                          }
                          className={`flex-1 min-w-0 px-2 py-1.5 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/40 ${
                            isValidUrl(link) ? '' : 'border-red-500'
                          }`}
                        />
                        <a href={link} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-muted" title="Открыть">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          disabled={i === 0}
                          onClick={() => patch({ links: move(form.links, i, i - 1) })}
                          className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
                          title="Выше"
                        >
                          <ArrowLeft className="h-4 w-4 rotate-90" />
                        </button>
                        <button
                          disabled={i === form.links.length - 1}
                          onClick={() => patch({ links: move(form.links, i, i + 1) })}
                          className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
                          title="Ниже"
                        >
                          <ArrowRight className="h-4 w-4 rotate-90" />
                        </button>
                        <button
                          onClick={() => patch({ links: form.links.filter((_, j) => j !== i) })}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-600"
                          title="Убрать"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                {typeof editingId === 'number' ? (
                  <button
                    onClick={remove}
                    disabled={deleting || saving}
                    className="px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-500/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Удалить проект
                  </button>
                ) : <span />}
                <div className="flex gap-2">
                  {dirty && (
                    <button
                      onClick={() => { setForm(original); setError(null); }}
                      disabled={saving}
                      className="btn-outline px-4 py-2 rounded-lg text-sm"
                    >
                      Отменить изменения
                    </button>
                  )}
                  <button
                    onClick={save}
                    disabled={saving || uploading > 0 || (!dirty && editingId !== 'new')}
                    className="btn-primary px-4 py-2 rounded-lg shadow-md text-sm flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingId === 'new' ? 'Создать' : 'Сохранить'}
                  </button>
                </div>
              </div>
            </section>

            <ProjectPreview project={form} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Mirrors the app's ProjectDetailsScreen layout. */
function ProjectPreview({ project }: { project: ProjectInput }) {
  return (
    <aside className="2xl:sticky 2xl:top-4">
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <Smartphone className="h-3.5 w-3.5" /> Так увидят в приложении
      </div>
      <div className="mx-auto w-full max-w-[340px] rounded-[2rem] border-[6px] border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 overflow-hidden shadow-xl">
        <div className="h-[600px] overflow-y-auto">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            <span className="truncate">{project.title || 'Название проекта'}</span>
          </div>
          {project.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 snap-x">
              {project.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-44 w-64 flex-shrink-0 rounded-xl object-cover snap-start bg-neutral-200"
                />
              ))}
            </div>
          )}
          <div className="px-4 space-y-4 pb-6">
            <h3 className="text-xl font-bold leading-tight">{project.title || 'Название проекта'}</h3>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Описание</div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {project.description || 'Описание проекта появится здесь.'}
              </p>
            </div>
            {project.links.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Ссылки</div>
                <div className="space-y-2">
                  {project.links.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm text-sky-600 dark:text-sky-400">
                      <Link2 className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
