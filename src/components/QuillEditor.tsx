// src/components/QuillEditor.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Upload, ImagePlus, FunctionSquare } from 'lucide-react';
import TurndownService from 'turndown';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';
import FileGallery from '@/components/FileGallery';

interface QuillEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuillInstance {
  getContents: () => unknown;
  setContents: (delta: unknown) => void;
  clipboard: {
    dangerouslyPasteHTML: (html: string) => void;
  };
  getSelection?: (value: boolean) => { index: number } | null;
  insertEmbed?: (index: number, type: string, url: string, source: string) => void;
}

export default function QuillEditor({ isOpen, onClose }: QuillEditorProps) {
  const [fileName, setFileName] = useState('document.md');
  const [showGallery, setShowGallery] = useState(false);
  const editorHostRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    (async () => {
      const Quill = (await import('quill')).default;

      // Импортируем KaTeX для формул
      const katex = (await import('katex')).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).katex = katex;
      
      // Build toolbar container if not present
      const toolbarContainer = toolbarRef.current!;
      if (toolbarContainer && toolbarContainer.childElementCount === 0) {
        // Quill toolbar expects specific button/select markup
        toolbarContainer.innerHTML = `
          <span class="ql-formats">
            <select class="ql-header">
              <option value="1"></option>
              <option value="2"></option>
              <option value="3"></option>
              <option selected></option>
            </select>
          </span>
          <span class="ql-formats">
            <button class="ql-bold"></button>
            <button class="ql-italic"></button>
            <button class="ql-underline"></button>
            <button class="ql-strike"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-list" value="ordered"></button>
            <button class="ql-list" value="bullet"></button>
          </span>
          <span class="ql-formats">
            <select class="ql-align"></select>
          </span>
          <span class="ql-formats">
            <button class="ql-link"></button>
            <button class="ql-image"></button>
          </span>
          <span class="ql-formats">
            <select class="ql-color"></select>
            <select class="ql-background"></select>
          </span>
          <span class="ql-formats">
            <button class="ql-blockquote"></button>
            <button class="ql-code-block"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-formula" title="Вставить формулу">∑</button>
          </span>
          <span class="ql-formats">
            <button class="ql-clean"></button>
          </span>
        `;
      }

      if (editorHostRef.current && mounted) {
        // Функция очистки текста от лишних пустых строк и фиксированной ширины
        const cleanPastedText = (node: Node, delta: { ops: Array<{ insert?: string; attributes?: Record<string, unknown> }> }) => {
          if (node instanceof HTMLElement) {
            // Убираем inline стили, которые могут влиять на ширину
            node.style.removeProperty('width');
            node.style.removeProperty('max-width');
            node.style.removeProperty('min-width');
          }
          
          // Обрабатываем текст: убираем множественные переносы строк
          if (delta.ops) {
            delta.ops = delta.ops.map((op) => {
              if (typeof op.insert === 'string') {
                // Заменяем множественные пустые строки на одну
                let text = op.insert;
                // Убираем множественные переносы строк (более 2 подряд)
                text = text.replace(/\n{3,}/g, '\n\n');
                // Убираем пробелы в конце строк
                text = text.replace(/[ \t]+\n/g, '\n');
                // Убираем пробелы в начале строк (кроме первой)
                text = text.replace(/\n[ \t]+/g, '\n');
                return { ...op, insert: text };
              }
              return op;
            });
          }
          return delta;
        };

        const q = new Quill(editorHostRef.current, {
          theme: 'snow',
          placeholder: 'Начните печатать...',
          modules: {
            formula: true, // Включаем модуль формул
            toolbar: {
              container: toolbarContainer,
              handlers: {
                image: function (this: { quill: { getSelection: (value: boolean) => { index: number }; insertEmbed: (index: number, type: string, url: string, source: string) => void } }) {
                  const url = window.prompt('Введите URL изображения:');
                  if (url) {
                    const range = this.quill.getSelection(true);
                    this.quill.insertEmbed(range.index, 'image', url, 'user');
                    // Optional: prompt for width (%) to control size
                    const width = window.prompt('Ширина изображения (например, 50% или 300px):');
                    if (width) {
                      // Quill renders <img>, set style on the inserted image
                      setTimeout(() => {
                        const imgs = editorHostRef.current!.getElementsByTagName('img');
                        const lastImg = imgs[imgs.length - 1];
                        if (lastImg) lastImg.style.width = width;
                      }, 0);
                    }
                  }
                },
                formula: function (this: { quill: { getSelection: (value: boolean) => { index: number }; insertEmbed: (index: number, type: string, value: string, source: string) => void } }) {
                  const formula = window.prompt('Введите формулу LaTeX (например: x^2 + y^2 = z^2):');
                  if (formula) {
                    const range = this.quill.getSelection(true);
                    this.quill.insertEmbed(range.index, 'formula', formula, 'user');
                  }
                },
              },
            },
            clipboard: {
              matchVisual: false, // Отключаем визуальное соответствие
              matchers: [
                // Очистка текста при вставке
                [Node.ELEMENT_NODE, cleanPastedText],
              ],
            },
          },
        });

        // Добавляем обработчик paste для дополнительной очистки
        q.root.addEventListener('paste', (e: ClipboardEvent) => {
          const clipboardData = e.clipboardData;
          if (clipboardData) {
            const text = clipboardData.getData('text/plain');
            if (text) {
              // Очищаем текст от лишних переносов
              const cleanedText = text
                .replace(/\r\n/g, '\n') // Windows переносы
                .replace(/\r/g, '\n') // Mac переносы
                .replace(/\n{3,}/g, '\n\n') // Множественные переносы
                .replace(/[ \t]+\n/g, '\n') // Пробелы в конце строк
                .replace(/\n[ \t]+/g, '\n'); // Пробелы в начале строк
              
              // Если текст был изменен, отменяем стандартную вставку
              if (cleanedText !== text) {
                e.preventDefault();
                const selection = q.getSelection();
                if (selection) {
                  q.insertText(selection.index, cleanedText);
                }
              }
            }
          }
        });

        // Set initial content
        q.clipboard.dangerouslyPasteHTML('<h1>Новый документ</h1><p>Начните создание вашего документа здесь...</p>');

        quillRef.current = q as QuillInstance;
      }
    })();
    return () => {
      mounted = false;
      quillRef.current = null;
    };
  }, [isOpen]);

  const handleDownload = () => {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Улучшенная конвертация зачеркнутого текста
    turndownService.addRule('strikethrough', {
      filter: ['del', 's'],
      replacement: (content: string) => `~~${content}~~`,
    });

    const html = editorHostRef.current?.querySelector('.ql-editor')?.innerHTML || '';
    const markdown = turndownService.turndown(html);
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

  // Скачать как Quill Delta (рекомендуемый формат Quill для сохранения со всем форматированием)
  const handleDownloadDelta = () => {
    const delta = quillRef.current?.getContents() || {};
    const blob = new Blob([JSON.stringify(delta, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const base = fileName.replace(/\.md$/i, '');
    link.download = `${base || 'document'}.quill.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Скачать как HTML
  const handleDownloadHTML = () => {
    const html = editorHostRef.current?.querySelector('.ql-editor')?.innerHTML || '';
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const base = fileName.replace(/\.md$/i, '');
    link.download = `${base || 'document'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Загрузить Quill Delta из JSON файла
  const handleUploadDelta = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const delta = JSON.parse(content);
        
        if (quillRef.current && delta.ops) {
          // Загружаем Delta в Quill
          quillRef.current.setContents(delta);
          
          // Обновляем имя файла
          const baseName = file.name.replace('.quill.json', '').replace('.json', '');
          setFileName(baseName);
        } else {
          alert('Неверный формат файла. Ожидается Quill Delta JSON.');
        }
      } catch (error) {
        console.error('Ошибка при загрузке файла:', error);
        alert('Не удалось загрузить файл. Проверьте формат JSON.');
      }
    };
    reader.readAsText(file);
    
    // Сбросить input для возможности повторной загрузки того же файла
    event.target.value = '';
  };

  const handleSelectFile = (url: string) => {
    if (quillRef.current) {
      const quill = quillRef.current;
      const range = quill.getSelection?.(true) || { index: 0 };
      quill.insertEmbed?.(range.index, 'image', url, 'user');
    }
  };

  const handleClose = () => {
    const html = editorHostRef.current?.querySelector('.ql-editor')?.innerHTML || '';
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    if (textContent && !/Новый документ\s*Начните создание вашего документа здесь\.\.\./.test(textContent)) {
      if (confirm('У вас есть несохраненные изменения. Вы уверены?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex flex-col">
      <div className="w-full h-full bg-background flex flex-col">
        {/* Верхняя панель */}
        <div className="border-b bg-background px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-2xl font-bold">Создать документ</h2>
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
              onClick={() => setShowGallery(!showGallery)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                showGallery
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent hover:bg-accent/80'
              }`}
              title="Галерея файлов"
            >
              <ImagePlus className="w-5 h-5" />
              Галерея
            </button>
            <button 
              onClick={handleUploadDelta} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              title="Загрузить Quill JSON"
            >
              <Upload className="w-5 h-5" />
              Загрузить JSON
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json,.quill.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={handleDownloadDelta} 
              className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors font-medium"
              title="Скачать как Quill Delta (.json)"
            >
              Quill JSON
            </button>
            <button 
              onClick={handleDownloadHTML} 
              className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors font-medium"
              title="Скачать как HTML"
            >
              HTML
            </button>
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

        {/* Main content area with editor and gallery */}
        <div className="flex-1 overflow-hidden flex">
          {/* Редактор Quill */}
          <div className="flex-1 overflow-hidden flex flex-col quill-fullscreen">
            <div ref={toolbarRef} className="ql-toolbar ql-snow"></div>
            <div ref={editorHostRef} className="ql-container ql-snow" style={{ flex: 1 }}></div>
          </div>

          {/* File Gallery Sidebar */}
          {showGallery && (
            <div className="w-96 border-l bg-background flex flex-col">
              <FileGallery lang="ru" onSelectFile={handleSelectFile} />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .quill-fullscreen {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .quill-fullscreen .ql-container {
          flex: 1;
          overflow-y: auto;
          font-size: 16px;
        }

        .quill-fullscreen .ql-editor {
          min-height: 100%;
          padding: 40px;
          font-size: 16px;
          line-height: 1.6;
        }

        .quill-fullscreen .ql-editor h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .quill-fullscreen .ql-editor h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .quill-fullscreen .ql-editor h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .quill-fullscreen .ql-editor p {
          margin-bottom: 1rem;
        }

        .quill-fullscreen .ql-editor ul,
        .quill-fullscreen .ql-editor ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .quill-fullscreen .ql-editor li {
          margin-bottom: 0.5rem;
        }

        .quill-fullscreen .ql-editor img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1.5rem 0;
          border-radius: 8px;
          cursor: pointer;
        }

        .quill-fullscreen .ql-editor img:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .quill-fullscreen .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #6b7280;
        }

        .quill-fullscreen .ql-editor pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .quill-fullscreen .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 12px;
        }

        .quill-fullscreen .ql-toolbar .ql-stroke {
          stroke: #374151;
        }

        .quill-fullscreen .ql-toolbar .ql-fill {
          fill: #374151;
        }

        .quill-fullscreen .ql-toolbar button:hover {
          background-color: #e5e7eb;
          border-radius: 4px;
        }

        .quill-fullscreen .ql-toolbar button.ql-active {
          background-color: #3b82f6;
          color: white;
          border-radius: 4px;
        }

        .quill-fullscreen .ql-toolbar button.ql-active .ql-stroke {
          stroke: white;
        }

        .quill-fullscreen .ql-toolbar button.ql-active .ql-fill {
          fill: white;
        }

        /* Стили для формул */
        .quill-fullscreen .ql-editor .ql-formula {
          display: inline-block;
          padding: 4px 8px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 4px;
          margin: 0 4px;
          cursor: pointer;
        }

        .quill-fullscreen .ql-editor .ql-formula:hover {
          background: #e0f2fe;
        }

        .quill-fullscreen .ql-toolbar .ql-formula {
          font-size: 16px;
          font-weight: bold;
        }

        /* Tooltip для кнопки формулы */
        .quill-fullscreen .ql-toolbar .ql-formula::after {
          content: none;
        }
      `}</style>
    </div>
  );
}
