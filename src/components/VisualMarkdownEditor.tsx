// src/components/VisualMarkdownEditor.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Download } from 'lucide-react';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface VisualMarkdownEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VisualMarkdownEditor({ isOpen, onClose }: VisualMarkdownEditorProps) {
  const [fileName, setFileName] = useState('document.md');
  const [markdown, setMarkdown] = useState('# Новый документ\n\nНачните создание вашего документа здесь...');

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (markdown !== '# Новый документ\n\nНачните создание вашего документа здесь...') {
      if (confirm('У вас есть несохраненные изменения. Вы уверены?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col" onClick={handleClose}>
      <div className="w-full h-full bg-background" onClick={(e) => e.stopPropagation()}>
        {/* Верхняя панель */}
        <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-2xl font-bold">Редактор Markdown</h2>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary max-w-xs"
              placeholder="Имя файла"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownload} 
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Скачать MD
            </button>
            <button 
              onClick={handleClose} 
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Редактор на весь экран */}
        <div className="h-[calc(100vh-80px)] overflow-hidden">
          <MDEditor
            value={markdown}
            onChange={(val) => setMarkdown(val || '')}
            height="100%"
            preview="live"
            hideToolbar={false}
            enableScroll={true}
            visibleDragbar={true}
          />
        </div>
      </div>
    </div>
  );
}
