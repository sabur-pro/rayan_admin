// src/components/ChapterManager.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  CornerDownRight,
  AlertTriangle,
  Crosshair,
} from 'lucide-react';
import {
  Chapter,
  createChapter,
  deleteChapter,
  flattenChapters,
  getChapters,
  reorderChapters,
  updateChapter,
} from '@/lib/chapter';

export interface ChapterManagerProps {
  materialId: number;
  langCode: string;
  /** Path of the book document these chapters belong to. */
  docPath: string;
  /**
   * Anchors actually present in the open document. When provided, chapters
   * whose marker is missing are flagged — they would be unreachable in the app.
   * Omitted when the manager runs outside the editor (e.g. in the material
   * modal), where the document contents are not loaded.
   */
  anchorsInDocument?: string[];
  /**
   * Inserts a marker at the editor's cursor. When absent, the manager can still
   * rename and reorder chapters but cannot create new ones, since a chapter
   * without a marker in the document could never be opened.
   */
  onInsertMarker?: (anchor: string) => void;
  /** Moves the editor's cursor to an existing marker. */
  onFocusMarker?: (anchor: string) => void;
  className?: string;
}

/**
 * Editor for a book's table of contents.
 *
 * Creating a chapter does two things at once: it stores the chapter and drops
 * an invisible marker at the cursor. Those halves must stay together — a
 * chapter with no marker is invisible to readers, and a marker with no chapter
 * is dead weight in the document — so the panel reports any mismatch instead of
 * letting it pass silently.
 */
export default function ChapterManager({
  materialId,
  langCode,
  docPath,
  anchorsInDocument,
  onInsertMarker,
  onFocusMarker,
  className = '',
}: ChapterManagerProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Create form. parentId targets a subchapter at the chosen parent.
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newParentId, setNewParentId] = useState<number | ''>('');

  // Inline edit.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getChapters(materialId, langCode, docPath)
      .then(setChapters)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки глав'))
      .finally(() => setLoading(false));
  }, [materialId, langCode, docPath]);

  useEffect(() => {
    load();
  }, [load]);

  const flat = flattenChapters(chapters);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Введите название главы');
      return;
    }
    if (!onInsertMarker) {
      setError('Создание главы доступно только в редакторе документа');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      // Position after the last sibling, so a new chapter lands at the end of
      // its level rather than jumping to the top of the list.
      const siblings = newParentId
        ? flat.filter((item) => item.chapter.parent_id === newParentId)
        : chapters;
      const position = siblings.length;

      const chapter = await createChapter({
        material_id: materialId,
        lang_code: langCode,
        doc_path: docPath,
        parent_id: newParentId === '' ? undefined : Number(newParentId),
        name: newName.trim(),
        description: newDescription.trim(),
        position,
      });

      // The server minted the anchor; put its marker where the cursor is.
      onInsertMarker(chapter.anchor);

      setNewName('');
      setNewDescription('');
      setNewParentId('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать главу');
    } finally {
      setCreating(false);
    }
  };

  const beginEdit = (chapter: Chapter) => {
    setEditingId(chapter.id);
    setEditName(chapter.name);
    setEditDescription(chapter.description || '');
  };

  const handleSaveEdit = async (chapter: Chapter) => {
    if (!editName.trim()) return;
    setBusyId(chapter.id);
    setError(null);
    try {
      await updateChapter(chapter.id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить главу');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (chapter: Chapter) => {
    const childCount = flattenChapters(chapter.children || []).length;
    const warning = childCount
      ? `Удалить главу «${chapter.name}» и ${childCount} подглав(ы)?`
      : `Удалить главу «${chapter.name}»?`;
    if (!confirm(warning)) return;

    setBusyId(chapter.id);
    setError(null);
    try {
      await deleteChapter(chapter.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить главу');
    } finally {
      setBusyId(null);
    }
  };

  /** Swaps a chapter with its neighbouring sibling. */
  const handleMove = async (chapter: Chapter, direction: -1 | 1) => {
    const siblings = chapter.parent_id
      ? flat.filter((item) => item.chapter.parent_id === chapter.parent_id).map((item) => item.chapter)
      : chapters;

    const index = siblings.findIndex((item) => item.id === chapter.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) return;

    setBusyId(chapter.id);
    setError(null);
    try {
      const reordered = [...siblings];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      await reorderChapters(
        reordered.map((item, position) => ({
          id: item.id,
          parent_id: item.parent_id,
          position,
        }))
      );
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось изменить порядок');
    } finally {
      setBusyId(null);
    }
  };

  const orphanedAnchors =
    anchorsInDocument?.filter(
      (anchor) => !flat.some((item) => item.chapter.anchor === anchor)
    ) ?? [];

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold">Главы книги</h3>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <div className="mx-4 mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
          {error}
        </div>
      )}

      {orphanedAnchors.length > 0 && (
        <div className="mx-4 mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-700 dark:text-amber-400 text-xs flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            В документе {orphanedAnchors.length} маркер(ов) без главы. Удалите их из
            текста или создайте соответствующие главы.
          </span>
        </div>
      )}

      {/* Chapter list */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-2 min-h-0">
        {flat.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Глав пока нет. Поставьте курсор в нужное место документа и добавьте главу.
          </p>
        )}

        {flat.map(({ chapter, depth }) => {
          const missingMarker =
            anchorsInDocument !== undefined && !anchorsInDocument.includes(chapter.anchor);
          const editing = editingId === chapter.id;

          return (
            <div
              key={chapter.id}
              className="rounded-lg border bg-accent/30 p-2"
              style={{ marginLeft: depth * 16 }}
            >
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Название главы"
                    autoFocus
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Описание (необязательно)"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(chapter)}
                      disabled={busyId === chapter.id}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      {busyId === chapter.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent"
                    >
                      <X className="w-3 h-3" />
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  {depth > 0 && (
                    <CornerDownRight className="w-3.5 h-3.5 mt-1 text-muted-foreground shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{chapter.name}</span>
                      {missingMarker && (
                        <span
                          title="Маркер главы отсутствует в документе — глава недоступна в приложении"
                          className="shrink-0"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>
                    {chapter.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {chapter.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {onFocusMarker && !missingMarker && (
                      <button
                        onClick={() => onFocusMarker(chapter.anchor)}
                        className="p-1 hover:bg-accent rounded"
                        title="Показать в документе"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleMove(chapter, -1)}
                      disabled={busyId === chapter.id}
                      className="p-1 hover:bg-accent rounded disabled:opacity-40"
                      title="Выше"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(chapter, 1)}
                      disabled={busyId === chapter.id}
                      className="p-1 hover:bg-accent rounded disabled:opacity-40"
                      title="Ниже"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => beginEdit(chapter)}
                      className="p-1 hover:bg-accent rounded"
                      title="Редактировать"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(chapter)}
                      disabled={busyId === chapter.id}
                      className="p-1 hover:bg-destructive/20 rounded disabled:opacity-40"
                      title="Удалить"
                    >
                      {busyId === chapter.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create form */}
      {onInsertMarker ? (
        <div className="border-t p-4 space-y-2 shrink-0">
          <p className="text-xs text-muted-foreground">
            Глава начнётся там, где сейчас стоит курсор в документе.
          </p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Название главы"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Описание (необязательно)"
            rows={2}
          />
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-2 py-1.5 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Глава верхнего уровня</option>
            {flat.map(({ chapter, depth }) => (
              <option key={chapter.id} value={chapter.id}>
                {'— '.repeat(depth)}Подглава: {chapter.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Добавить главу
          </button>
        </div>
      ) : (
        <div className="border-t p-4 shrink-0">
          <p className="text-xs text-muted-foreground">
            Чтобы добавить главу, откройте документ в редакторе — маркер главы
            ставится по позиции курсора.
          </p>
        </div>
      )}
    </div>
  );
}
