// src/components/EditMaterialModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import { X, Loader2, Upload, FileText, Trash2 } from 'lucide-react';
import type { Material } from '../../types/material';

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  langCode: string;
  onMaterialUpdated: () => void;
}

export default function EditMaterialModal({
  isOpen,
  onClose,
  material,
  langCode,
  onMaterialUpdated,
}: EditMaterialModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translation = material?.translations.find((t) => t.lang_code === langCode) || material?.translations[0];

  useEffect(() => {
    if (translation) {
      setName(translation.name || '');
      setDescription(translation.description || '');
      setStatus(translation.status === 'published' ? 'published' : 'draft');
    }
  }, [translation]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !material) {
      setError('Введите название материала');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        status: status,
      };

      const response = await fetchWithAuth(
        `${API_BASE_URL}/material/translation/${material.id}?lang_code=${langCode}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Ошибка при обновлении материала: ${response.status} ${errorText}`);
      }

      // Обновление прошло успешно
      onMaterialUpdated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFiles = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (files.length === 0) {
      setError('Выберите файлы для загрузки');
      return;
    }
    
    if (!material) return;

    setUploadingFiles(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('material_id', material.id.toString());
      formData.append('lang_code', langCode);

      // Добавляем все файлы
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetchWithAuth(`${API_BASE_URL}/material/translation/files`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Ошибка при загрузке файлов: ${response.status} ${errorText}`);
      }

      // Успешно загружено
      setFiles([]);
      onMaterialUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке файлов');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setStatus('draft');
    setFiles([]);
    setError(null);
    onClose();
  };

  if (!isOpen || !material) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Редактировать материал</CardTitle>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              disabled={loading || uploadingFiles}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdateMaterial} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Название материала <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите название"
                required
                disabled={loading || uploadingFiles}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Описание
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                placeholder="Введите описание материала"
                disabled={loading || uploadingFiles}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Статус
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading || uploadingFiles}
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликован</option>
              </select>
            </div>

            {/* Существующие файлы */}
            {translation?.paths && translation.paths.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Текущие файлы ({translation.paths.length})
                </label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {translation.paths.map((path: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg text-sm"
                    >
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="truncate flex-1">{path.split('/').pop()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                disabled={loading || uploadingFiles}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading || uploadingFiles}
              >
                {loading || uploadingFiles ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadingFiles ? 'Загрузка файлов...' : 'Сохранение...'}
                  </>
                ) : (
                  'Сохранить изменения'
                )}
              </button>
            </div>
          </form>

          {/* Секция загрузки файлов */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Загрузка файлов</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="files" className="block text-sm font-medium mb-2">
                  Выберите файлы для загрузки
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-accent/5">
                  <input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading || uploadingFiles}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.json"
                  />
                  <label
                    htmlFor="files"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-10 h-10 text-primary" />
                    <span className="text-sm font-medium">
                      Нажмите для выбора файлов
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Поддерживаются изображения, документы, PDF и другие форматы
                    </span>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">
                        Выбрано файлов: {files.length}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFiles([])}
                        className="text-xs text-destructive hover:underline"
                        disabled={loading || uploadingFiles}
                      >
                        Очистить все
                      </button>
                    </div>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mx-3 flex-shrink-0">
                          {formatFileSize(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="p-1 hover:bg-destructive/20 rounded flex-shrink-0"
                          disabled={loading || uploadingFiles}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => handleUploadFiles()}
                      className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={loading || uploadingFiles || files.length === 0}
                    >
                      {uploadingFiles ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Загрузка файлов...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Загрузить файлы
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
