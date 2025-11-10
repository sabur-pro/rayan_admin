// src/app/dashboard/materials/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMaterials } from '@/lib/material';
import type { Material } from '../../../../types/material';
import { FileText, Download, ExternalLink, Calendar, Plus, Edit } from 'lucide-react';
import FileViewer from '@/components/FileViewer';
import CreateMaterialModal from '@/components/CreateMaterialModal';
import EditMaterialModal from '@/components/EditMaterialModal';
import QuillEditor from '@/components/QuillEditor';

export default function MaterialsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const course_id = Number(searchParams.get('course_id'));
  const semester_id = Number(searchParams.get('semester_id'));
  const subject_id = Number(searchParams.get('subject_id'));
  const material_type_id = Number(searchParams.get('material_type_id'));
  const lang_code = searchParams.get('lang_code') || 'ru';
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isMarkdownEditorOpen, setIsMarkdownEditorOpen] = useState(false);

  const loadMaterials = React.useCallback(() => {
    if (!course_id || !semester_id || !subject_id || !material_type_id) {
      setError('Некорректные параметры запроса');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    getMaterials({
      lang_code,
      course_id,
      semester_id,
      subject_id,
      material_type_id,
      page: 1,
      limit: 10,
    })
      .then((res) => setMaterials(res.data))
      .catch((e) => setError(e.message || 'Ошибка при загрузке материалов'))
      .finally(() => setLoading(false));
  }, [course_id, semester_id, subject_id, material_type_id, lang_code]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material);
  };

  const handleCloseViewer = () => {
    setSelectedMaterial(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <button 
            className="btn-outline px-3 py-1 rounded hover:bg-accent transition-colors" 
            onClick={() => router.back()}
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-bold">Материалы</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить материал
          </button>
          <button
            onClick={() => setIsMarkdownEditorOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Создать документ MD
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Загрузка...</p>
          </div>
        )}
        
        {error && (
          <div className="col-span-full text-center text-destructive bg-destructive/10 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        {materials.map((material) => {
          const translation = material.translations.find(t => t.lang_code === lang_code) || material.translations[0];
          const subjectName = material.subjects[0]?.translations.find(t => t.lang_code === lang_code)?.name || 'Не указан';
          
          return (
            <Card
              key={material.id}
              className="card-hover animate-in border-2 transition-all hover:shadow-lg h-full"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg flex-1">
                    {translation?.name || 'Без названия'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMaterial(material);
                      }}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <button
                onClick={() => handleMaterialClick(material)}
                className="w-full text-left focus:outline-none"
                type="button"
              >
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {translation?.description || 'Нет описания'}
                  </p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      <span>Тип: {material.material_type.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(material.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">Предмет:</span>
                      <span className="line-clamp-1">{subjectName}</span>
                    </div>
                  </div>

                  {translation?.paths && translation.paths.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Файлов: {translation.paths.length}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-accent">
                          {translation.status}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </button>
            </Card>
          );
        })}
        
        {!loading && !error && materials.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Материалы не найдены</p>
          </div>
        )}
      </div>

      {/* Модальное окно для просмотра материала */}
      {selectedMaterial && (
        <MaterialViewer 
          material={selectedMaterial} 
          langCode={lang_code}
          onClose={handleCloseViewer} 
        />
      )}

      {/* Модальное окно для создания материала */}
      <CreateMaterialModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        materialTypeId={material_type_id}
        subjectId={subject_id}
        langCode={lang_code}
        onMaterialCreated={loadMaterials}
      />

      {/* Модальное окно для редактирования материала */}
      <EditMaterialModal
        isOpen={!!editingMaterial}
        onClose={() => setEditingMaterial(null)}
        material={editingMaterial}
        langCode={lang_code}
        onMaterialUpdated={loadMaterials}
      />

      {/* Quill редактор для создания документа Markdown */}
      <QuillEditor
        isOpen={isMarkdownEditorOpen}
        onClose={() => setIsMarkdownEditorOpen(false)}
      />
    </div>
  );
}

// Компонент для просмотра материала
interface MaterialViewerProps {
  material: Material;
  langCode: string;
  onClose: () => void;
}

function MaterialViewer({ material, langCode, onClose }: MaterialViewerProps) {
  const translation = material.translations.find(t => t.lang_code === langCode) || material.translations[0];
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  
  if (!translation?.paths || translation.paths.length === 0) {
    return null;
  }

  const currentPath = translation.paths[selectedPathIndex];

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{translation.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{translation.description}</p>
          </div>
          <button 
            onClick={onClose}
            className="ml-4 p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Навигация по файлам */}
        {translation.paths.length > 1 && (
          <div className="p-3 border-b bg-accent/5">
            <div className="flex items-center gap-2 overflow-x-auto">
              {translation.paths.map((path, index) => {
                const ext = path.split('.').pop()?.toLowerCase() || '';
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedPathIndex(index)}
                    className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
                      selectedPathIndex === index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent hover:bg-accent/80'
                    }`}
                  >
                    Файл {index + 1} (.{ext})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Контент */}
        <div className="flex-1 overflow-auto p-4">
          <FileViewer 
            filePath={currentPath} 
            fileName={translation.name}
          />
        </div>

        {/* Футер с действиями */}
        <div className="p-4 border-t bg-accent/5 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Курс:</span> {material.course.number} • 
            <span className="font-medium ml-2">Семестр:</span> {material.semester.number}
          </div>
          <div className="flex gap-2">
            <a
              href={currentPath}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Скачать
            </a>
            <a
              href={currentPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Открыть в новой вкладке
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
