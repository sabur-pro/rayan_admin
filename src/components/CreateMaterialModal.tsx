// src/components/CreateMaterialModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWithAuth, API_BASE_URL } from '@/lib/http';
import { X, Loader2 } from 'lucide-react';
import { getAllMaterialTypes } from '@/lib/material';
import type { MaterialType } from '../../types/material';

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialTypeId?: number; // Теперь опциональный
  subjectId: number;
  langCode: string;
  onMaterialCreated: () => void;
}

export default function CreateMaterialModal({
  isOpen,
  onClose,
  materialTypeId,
  subjectId,
  langCode,
  onMaterialCreated,
}: CreateMaterialModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState<number>(materialTypeId || 0);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем типы материалов если materialTypeId не передан
  useEffect(() => {
    if (isOpen && !materialTypeId) {
      setLoadingTypes(true);
      getAllMaterialTypes({ lang_code: langCode, page: 1, limit: 50 })
        .then((res) => {
          setMaterialTypes(res.data);
          if (res.data.length > 0) {
            setSelectedMaterialTypeId(res.data[0].material_type_id);
          }
        })
        .catch((err) => {
          setError(err.message || 'Ошибка при загрузке типов материалов');
        })
        .finally(() => setLoadingTypes(false));
    } else if (materialTypeId) {
      setSelectedMaterialTypeId(materialTypeId);
    }
  }, [isOpen, materialTypeId, langCode]);

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Введите название материала');
      return;
    }

    if (!selectedMaterialTypeId) {
      setError('Выберите тип материала');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = {
        material_type_id: selectedMaterialTypeId,
        subject_id: subjectId,
        translations: [
          {
            name: name.trim(),
            description: description.trim(),
            lang_code: langCode,
            status: status,
          },
        ],
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/material`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Ошибка при создании материала: ${response.status} ${errorText}`);
      }

      // Материал создан успешно
      onMaterialCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setStatus('draft');
    setSelectedMaterialTypeId(materialTypeId || 0);
    setMaterialTypes([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

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
            <CardTitle>Добавить материал</CardTitle>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              disabled={loading}
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

          <form onSubmit={handleCreateMaterial} className="space-y-4">
            {/* Селектор типа материала (если не передан явно) */}
            {!materialTypeId && (
              <div>
                <label htmlFor="materialType" className="block text-sm font-medium mb-2">
                  Тип материала <span className="text-destructive">*</span>
                </label>
                {loadingTypes ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Загрузка типов...</span>
                  </div>
                ) : (
                  <select
                    id="materialType"
                    value={selectedMaterialTypeId}
                    onChange={(e) => setSelectedMaterialTypeId(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={loading}
                  >
                    <option value={0}>Выберите тип материала</option>
                    {materialTypes.map((type) => (
                      <option key={type.material_type_id} value={type.material_type_id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликован</option>
              </select>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Создать материал'
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
