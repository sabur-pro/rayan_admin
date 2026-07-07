// src/components/AudioTimecodeManager.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Plus, Trash2, Clock, Play, Pencil, Check, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/http';
import { isVideoFile } from '@/lib/fileUtils';
import {
  AudioTimecode,
  getAudioTimecodes,
  createAudioTimecode,
  updateAudioTimecode,
  deleteAudioTimecode,
  parseTimecode,
  formatTimecode,
} from '@/lib/audioTimecode';

interface AudioTimecodeManagerProps {
  materialId: number;
  langCode: string;
  audioPath: string; // full or relative path
}

/** Ensure the audio URL is absolute for the <audio> element. */
function toAudioUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const rel = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${rel}`;
}

export default function AudioTimecodeManager({
  materialId,
  langCode,
  audioPath,
}: AudioTimecodeManagerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const isVideo = isVideoFile(audioPath);

  const [timecodes, setTimecodes] = useState<AudioTimecode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [timeInput, setTimeInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editComment, setEditComment] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAudioTimecodes(materialId, langCode, audioPath)
      .then(setTimecodes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки таймкодов'))
      .finally(() => setLoading(false));
  }, [materialId, langCode, audioPath]);

  useEffect(() => {
    load();
  }, [load]);

  const captureCurrentTime = () => {
    if (mediaRef.current) {
      setTimeInput(formatTimecode(mediaRef.current.currentTime));
    }
  };

  const seekTo = (seconds: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = seconds;
      mediaRef.current.play().catch(() => {});
    }
  };

  const handleAdd = async () => {
    const seconds = parseTimecode(timeInput);
    if (seconds === null) {
      setError('Неверный формат времени. Используйте "1:05" или "83".');
      return;
    }
    if (!labelInput.trim()) {
      setError('Введите подпись таймкода');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAudioTimecode({
        material_id: materialId,
        lang_code: langCode,
        audio_path: audioPath,
        seconds,
        label: labelInput.trim(),
        comment: commentInput.trim(),
      });
      setTimeInput('');
      setLabelInput('');
      setCommentInput('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания таймкода');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tc: AudioTimecode) => {
    setEditingId(tc.id);
    setEditTime(formatTimecode(tc.seconds));
    setEditLabel(tc.label);
    setEditComment(tc.comment || '');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    const seconds = parseTimecode(editTime);
    if (seconds === null) {
      setError('Неверный формат времени.');
      return;
    }
    if (!editLabel.trim()) {
      setError('Подпись не может быть пустой');
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await updateAudioTimecode(id, {
        seconds,
        label: editLabel.trim(),
        comment: editComment.trim(),
      });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка обновления');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот таймкод?')) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteAudioTimecode(id);
      setTimecodes((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-lg border bg-accent/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">{isVideo ? 'Таймкоды видео' : 'Таймкоды аудио'}</h4>
        <span className="text-xs text-muted-foreground truncate">
          {audioPath.split('/').pop()}
        </span>
      </div>

      {/* Плеер: смотрим/слушаем и ловим текущее время */}
      {isVideo ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={toAudioUrl(audioPath)}
          controls
          className="w-full max-h-72 rounded-lg bg-black"
          preload="metadata"
        />
      ) : (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={toAudioUrl(audioPath)}
          controls
          className="w-full"
          preload="metadata"
        />
      )}

      {error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Список таймкодов */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Загрузка...
        </div>
      ) : timecodes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Пока нет таймкодов для этого аудио.</p>
      ) : (
        <div className="space-y-2">
          {timecodes.map((tc) => (
            <div key={tc.id} className="rounded-lg border bg-background p-2">
              {editingId === tc.id ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-24 px-2 py-1 border rounded bg-background text-sm"
                      placeholder="1:05"
                    />
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded bg-background text-sm"
                      placeholder="Подпись"
                    />
                  </div>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    className="w-full px-2 py-1 border rounded bg-background text-sm min-h-[50px]"
                    placeholder="Комментарий (необязательно)"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="p-1.5 rounded bg-accent hover:bg-accent/70"
                      title="Отмена"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(tc.id)}
                      disabled={busyId === tc.id}
                      className="p-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      title="Сохранить"
                    >
                      {busyId === tc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => seekTo(tc.seconds)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono font-semibold hover:bg-primary/20 flex-shrink-0"
                    title="Перейти к моменту"
                  >
                    <Play className="w-3 h-3" />
                    {formatTimecode(tc.seconds)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tc.label}</p>
                    {tc.comment && (
                      <p className="text-xs text-muted-foreground">{tc.comment}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(tc)}
                    className="p-1 rounded hover:bg-accent flex-shrink-0"
                    title="Редактировать"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tc.id)}
                    disabled={busyId === tc.id}
                    className="p-1 rounded hover:bg-destructive/20 flex-shrink-0"
                    title="Удалить"
                  >
                    {busyId === tc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Форма добавления */}
      <div className="pt-3 border-t space-y-2">
        <div className="flex gap-2">
          <input
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="w-24 px-2 py-1.5 border rounded bg-background text-sm"
            placeholder="1:05"
          />
          <button
            type="button"
            onClick={captureCurrentTime}
            className="px-2 py-1.5 rounded bg-accent hover:bg-accent/70 text-xs whitespace-nowrap"
            title="Взять текущее время из плеера"
          >
            ⏱ Текущее
          </button>
          <input
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            className="flex-1 px-2 py-1.5 border rounded bg-background text-sm"
            placeholder="Подпись (напр. «Введение»)"
          />
        </div>
        <textarea
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className="w-full px-2 py-1.5 border rounded bg-background text-sm min-h-[50px]"
          placeholder="Комментарий к таймкоду (необязательно)"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Добавить таймкод
        </button>
      </div>
    </div>
  );
}
