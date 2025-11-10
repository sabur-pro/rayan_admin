// src/components/FileViewer.tsx
'use client';

import React from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  FileImage, 
  FileVideo,
  FileCode,
  File
} from 'lucide-react';

interface FileViewerProps {
  filePath: string;
  fileName?: string;
  className?: string;
}

/**
 * Универсальный компонент для просмотра файлов различных форматов
 */
export default function FileViewer({ filePath, fileName, className = '' }: FileViewerProps) {
  const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';
  const displayName = fileName || filePath.split('/').pop() || 'Файл';

  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';
  const isVideo = ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileExtension);
  const isAudio = ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(fileExtension);
  const isText = ['txt', 'md', 'json', 'xml', 'csv'].includes(fileExtension);
  const isCode = ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'html', 'css', 'scss'].includes(fileExtension);
  const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);

  const getFileIcon = () => {
    if (isImage) return <FileImage className="w-16 h-16" />;
    if (isVideo) return <FileVideo className="w-16 h-16" />;
    if (isCode) return <FileCode className="w-16 h-16" />;
    return <File className="w-16 h-16" />;
  };

  return (
    <div className={`file-viewer ${className}`}>
      {/* Изображения */}
      {isImage && (
        <div className="flex items-center justify-center min-h-[400px] bg-accent/5 rounded-lg p-4">
          <img 
            src={filePath} 
            alt={displayName}
            className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="text-center text-muted-foreground">
                    <p>Не удалось загрузить изображение</p>
                  </div>
                `;
              }
            }}
          />
        </div>
      )}
      
      {/* PDF документы */}
      {isPdf && (
        <div className="rounded-lg overflow-hidden border">
          <iframe
            src={filePath}
            className="w-full min-h-[700px]"
            title={displayName}
          />
        </div>
      )}

      {/* Видео */}
      {isVideo && (
        <div className="rounded-lg overflow-hidden border bg-black">
          <video
            controls
            className="w-full max-h-[600px]"
            src={filePath}
          >
            Ваш браузер не поддерживает видео тег.
          </video>
        </div>
      )}

      {/* Аудио */}
      {isAudio && (
        <div className="p-8 bg-accent/5 rounded-lg text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-4">{displayName}</p>
          <audio
            controls
            className="w-full max-w-md mx-auto"
            src={filePath}
          >
            Ваш браузер не поддерживает аудио тег.
          </audio>
        </div>
      )}

      {/* Текстовые файлы и код */}
      {(isText || isCode) && (
        <div className="rounded-lg border bg-white dark:bg-gray-900">
          <iframe
            src={filePath}
            className="w-full min-h-[600px] rounded-lg"
            title={displayName}
          />
        </div>
      )}

      {/* Office документы */}
      {isOfficeDoc && (
        <div className="text-center py-12 bg-accent/5 rounded-lg">
          {getFileIcon()}
          <div className="mt-4 mx-auto opacity-50" />
          <p className="text-lg mb-2 mt-4">{displayName}</p>
          <p className="text-sm text-muted-foreground mb-6">
            Документ Office (.{fileExtension})
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href={filePath}
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="w-5 h-5" />
              Скачать файл
            </a>
            <a
              href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(filePath)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/80 rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Открыть в Office Online
            </a>
          </div>
        </div>
      )}

      {/* Неизвестный формат */}
      {!isImage && !isPdf && !isVideo && !isAudio && !isText && !isCode && !isOfficeDoc && (
        <div className="text-center py-12 bg-accent/5 rounded-lg">
          {getFileIcon()}
          <div className="mt-4 mx-auto opacity-50" />
          <p className="text-lg mb-2 mt-4">{displayName}</p>
          <p className="text-sm text-muted-foreground mb-6">
            Формат файла: .{fileExtension}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Предварительный просмотр недоступен для данного типа файла
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href={filePath}
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="w-5 h-5" />
              Скачать файл
            </a>
            <a
              href={filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/80 rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Открыть в новой вкладке
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Вспомогательная функция для получения типа файла
 */
export function getFileType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  
  const types: Record<string, string> = {
    // Изображения
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', 
    bmp: 'image', webp: 'image', svg: 'image', ico: 'image',
    
    // Документы
    pdf: 'pdf',
    doc: 'document', docx: 'document',
    xls: 'spreadsheet', xlsx: 'spreadsheet',
    ppt: 'presentation', pptx: 'presentation',
    
    // Видео
    mp4: 'video', webm: 'video', ogg: 'video', mov: 'video', avi: 'video',
    
    // Аудио
    mp3: 'audio', wav: 'audio', aac: 'audio', m4a: 'audio',
    
    // Текст и код
    txt: 'text', md: 'text', json: 'text', xml: 'text', csv: 'text',
    js: 'code', ts: 'code', tsx: 'code', jsx: 'code', py: 'code',
    java: 'code', cpp: 'code', c: 'code', cs: 'code', php: 'code',
    html: 'code', css: 'code', scss: 'code',
  };
  
  return types[extension] || 'unknown';
}

/**
 * Получить иконку для типа файла
 */
export function getFileTypeIcon(filePath: string, className: string = 'w-5 h-5') {
  const type = getFileType(filePath);
  
  switch (type) {
    case 'image': return <FileImage className={className} />;
    case 'video': return <FileVideo className={className} />;
    case 'code': return <FileCode className={className} />;
    case 'text': return <FileText className={className} />;
    default: return <File className={className} />;
  }
}
