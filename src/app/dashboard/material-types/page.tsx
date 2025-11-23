// src/app/dashboard/material-types/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMaterialTypes } from '@/lib/material';
import type { MaterialType } from '../../../../types/material';
import { FileText, BookOpen, FileImage, Video, Plus } from 'lucide-react';
import CreateMaterialModal from '@/components/CreateMaterialModal';

// Иконки для разных типов материалов
const getIconForMaterialType = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('конспект') || lowerName.includes('lecture')) {
    return <FileText className="w-6 h-6" />;
  }
  if (lowerName.includes('лекция') || lowerName.includes('презентация')) {
    return <BookOpen className="w-6 h-6" />;
  }
  if (lowerName.includes('изображ') || lowerName.includes('image')) {
    return <FileImage className="w-6 h-6" />;
  }
  if (lowerName.includes('видео') || lowerName.includes('video')) {
    return <Video className="w-6 h-6" />;
  }
  return <FileText className="w-6 h-6" />;
};

export default function MaterialTypesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const faculty_id = Number(searchParams.get('faculty_id'));
  const course_id = Number(searchParams.get('course_id'));
  const semester_id = Number(searchParams.get('semester_id'));
  const subject_id = Number(searchParams.get('subject_id'));
  const lang_code = searchParams.get('lang_code') || 'ru';
  
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadMaterialTypes = React.useCallback(() => {
    if (!subject_id) {
      setError('Некорректные параметры запроса');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    getMaterialTypes({
      lang_code,
      subject_id,
      page: 1,
      limit: 50,
    })
      .then((res) => setMaterialTypes(res.data))
      .catch((e) => setError(e.message || 'Ошибка при загрузке типов материалов'))
      .finally(() => setLoading(false));
  }, [subject_id, lang_code]);

  useEffect(() => {
    loadMaterialTypes();
  }, [loadMaterialTypes]);

  const handleMaterialTypeClick = (materialTypeId: number) => {
    const params = new URLSearchParams({
      faculty_id: faculty_id.toString(),
      course_id: course_id.toString(),
      semester_id: semester_id.toString(),
      subject_id: subject_id.toString(),
      material_type_id: materialTypeId.toString(),
      lang_code,
    });
    router.push(`/dashboard/materials?${params.toString()}`);
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
          <h1 className="text-2xl font-bold">Типы материалов</h1>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить материал
        </button>
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
        
        {materialTypes.map((materialType) => (
          <button 
            key={materialType.material_type_id}
            onClick={() => handleMaterialTypeClick(materialType.material_type_id)}
            className="cursor-pointer w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
            type="button"
          >
            <Card className="card-hover animate-in border-2 transition-all hover:shadow-lg hover:scale-105 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getIconForMaterialType(materialType.name)}
                  </div>
                  <CardTitle className="text-lg">{materialType.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                  {materialType.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-accent">
                    {materialType.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {materialType.lang_code.toUpperCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
        
        {!loading && !error && materialTypes.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-4">Типы материалов не найдены</p>
            <p className="text-sm mb-6">Создайте первый материал для этого предмета</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Добавить материал
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно для создания материала */}
      <CreateMaterialModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        subjectId={subject_id}
        langCode={lang_code}
        onMaterialCreated={loadMaterialTypes}
      />
    </div>
  );
}
