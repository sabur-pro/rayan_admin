// src/components/FileGallery.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { uploadFile, fetchSuspendedFiles, type UploadedFile } from '@/lib/files';

interface FileGalleryProps {
  lang: string;
  onSelectFile?: (url: string) => void;
}

const AVAILABLE_LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'tj', name: 'Таджикский' },
  { code: 'uz', name: 'Узбекский' },
  { code: 'kz', name: 'Казахский' },
  { code: 'kg', name: 'Киргизский' },
];

export default function FileGallery({ lang: initialLang, onSelectFile }: FileGalleryProps) {
  const [lang, setLang] = useState(initialLang);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);

  const loadFiles = useCallback(
    async (pageNum: number, append = false) => {
      if (loadingMore.current) return;

      if (!append) {
        setLoading(true);
      }
      loadingMore.current = true;
      setError(null);

      try {
        const res = await fetchSuspendedFiles(lang, pageNum, 10);

        if (append) {
          setFiles((prev) => [...prev, ...res.data]);
        } else {
          setFiles(res.data);
        }

        setHasMore(
          res.data.length === 10 && 
          res.pagination.page * res.pagination.limit < res.pagination.total_count
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Ошибка при загрузке файлов');
      } finally {
        setLoading(false);
        loadingMore.current = false;
      }
    },
    [lang]
  );

  useEffect(() => {
    setFiles([]);
    setPage(1);
    setHasMore(true);
    loadFiles(1, false);
  }, [lang, loadFiles]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore.current) {
          setPage((prev) => {
            const nextPage = prev + 1;
            loadFiles(nextPage, true);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadFiles]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedFile = await uploadFile(file, lang);
      setFiles([uploadedFile, ...files]);
      alert('Файл успешно загружен!');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка при загрузке файла');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleCopyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      alert('Не удалось скопировать путь');
    }
  };

  const handleImageClick = (path: string) => {
    if (onSelectFile) {
      onSelectFile(path);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Header with language selector and upload button */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Галерея файлов</h3>
            <p className="text-xs text-muted-foreground">Загрузите и управляйте изображениями</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background text-sm shadow-sm hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {AVAILABLE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleFileSelect}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 mx-4 mt-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm shadow-sm animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Files grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-6 rounded-full bg-muted/50 mb-4">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">Нет файлов</p>
            <p className="text-sm text-muted-foreground">Загрузите первое изображение!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={`${file.path}-${index}`}
                className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="aspect-square relative cursor-pointer overflow-hidden bg-muted"
                  onClick={() => handleImageClick(file.path)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.path}
                    alt={file.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {onSelectFile && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="text-white font-semibold text-sm px-4 py-2 bg-primary rounded-full shadow-lg">Вставить изображение</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gradient-to-b from-card to-muted/30">
                  <p className="text-xs text-muted-foreground truncate mb-2 font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <button
                    onClick={() => handleCopyPath(file.path)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-accent hover:bg-primary hover:text-primary-foreground rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    {copiedPath === file.path ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Копировать
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !error && (
          <div ref={observerTarget} className="text-center py-6">
            {loadingMore.current && (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-muted-foreground text-sm">Загрузка ещё...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
