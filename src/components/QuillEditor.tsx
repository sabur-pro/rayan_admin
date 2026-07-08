// src/components/QuillEditor.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Upload, ImagePlus } from 'lucide-react';
import TurndownService from 'turndown';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';
import FileGallery from '@/components/FileGallery';
import {
  DocThemeSwitcher,
  DocEditorThemeStyles,
  getDocThemeStyle,
  useDocThemePreference,
} from '@/lib/docTheme';
import {
  registerQuillSizes,
  QUILL_SIZE_TOOLBAR_HTML,
} from '@/lib/quillSize';

interface QuillEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuillRange { index: number; length: number }

interface QuillInstance {
  getContents: () => unknown;
  setContents: (delta: unknown) => void;
  clipboard: {
    dangerouslyPasteHTML: (html: string) => void;
  };
  getSelection?: (value?: boolean) => QuillRange | null;
  insertEmbed?: (index: number, type: string, url: string, source: string) => void;
  format?: (name: string, value: unknown) => void;
  setSelection?: (index: number, length: number) => void;
  focus?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on?: (event: string, handler: (...args: any[]) => void) => void;
}

export default function QuillEditor({ isOpen, onClose }: QuillEditorProps) {
  const [fileName, setFileName] = useState('document.md');
  const [showGallery, setShowGallery] = useState(false);
  const [previewTheme, changeTheme] = useDocThemePreference();
  const [customSize, setCustomSize] = useState('');
  const editorHostRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const lastRangeRef = useRef<QuillRange | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when editor is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Quill editor initialization
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    (async () => {
      const Quill = (await import('quill')).default;

      // Регистрируем размеры шрифта (px + произвольные значения)
      registerQuillSizes(Quill);

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
          ${QUILL_SIZE_TOOLBAR_HTML}
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

      if (editorHostRef.current && isMounted) {
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

        // Добавляем обработчик paste для корректной вставки текста
        q.root.addEventListener('paste', (e: ClipboardEvent) => {
          const clipboardData = e.clipboardData;
          if (!clipboardData) return;

          // Получаем HTML и plain text из буфера обмена
          const html = clipboardData.getData('text/html');
          const text = clipboardData.getData('text/plain');

          // Если есть контент, обрабатываем вставку
          if (html || text) {
            e.preventDefault();

            const selection = q.getSelection(true);
            const index = selection ? selection.index : 0;

            if (html) {
              // Вставляем HTML-контент через clipboard API Quill
              // Создаем временный элемент для очистки HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              // Убираем нежелательные стили
              const elements = tempDiv.querySelectorAll('*');
              elements.forEach((el) => {
                if (el instanceof HTMLElement) {
                  el.style.removeProperty('width');
                  el.style.removeProperty('max-width');
                  el.style.removeProperty('min-width');
                }
              });
              q.clipboard.dangerouslyPasteHTML(index, tempDiv.innerHTML);
            } else if (text) {
              // Очищаем текст от лишних переносов и вставляем
              const cleanedText = text
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
              q.insertText(index, cleanedText);
            }
          }
        });

        // Set initial content
        q.clipboard.dangerouslyPasteHTML('<h1>Новый документ</h1><p>Начните создание вашего документа здесь...</p>');

        quillRef.current = q as QuillInstance;

        // Remember the last editor selection so the custom size input (which steals focus)
        // can restore it before applying a size.
        (q as QuillInstance).on?.('selection-change', (range: QuillRange | null) => {
          if (range) lastRangeRef.current = range;
        });
      }
    })();
    return () => {
      isMounted = false;
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

  // Apply an arbitrary font size (in px) to the current selection / cursor
  const applyCustomSize = () => {
    const q = quillRef.current;
    const n = parseInt(customSize.trim(), 10);
    if (!q || isNaN(n) || n < 6 || n > 400) return;
    q.focus?.();
    const range = lastRangeRef.current;
    if (range) q.setSelection?.(range.index, range.length);
    q.format?.('size', `${n}px`);
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

  const docStyle = getDocThemeStyle(previewTheme);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col" style={{ zIndex: 99999 }}>
      <div className="w-full h-full bg-background flex flex-col">
        {/* Верхняя панель */}
        <div className="border-b bg-background px-3 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold">Создать документ</h2>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary w-36 md:max-w-xs"
              placeholder="Имя файла"
            />
            {/* Custom font-size: type any px value and apply to the selection */}
            <div className="flex items-center gap-1" title="Свой размер шрифта (px)">
              <span className="text-xs text-muted-foreground">Размер</span>
              <input
                type="number"
                min={6}
                max={400}
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyCustomSize(); }}
                className="w-16 px-2 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="px"
              />
              <button
                onClick={applyCustomSize}
                className="px-3 py-2 text-sm font-medium bg-accent hover:bg-accent/80 rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <DocThemeSwitcher value={previewTheme} onChange={changeTheme} />
            <button
              onClick={() => setShowGallery(!showGallery)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors font-medium ${showGallery
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent hover:bg-accent/80'
                }`}
              title="Галерея файлов"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="hidden sm:inline">Галерея</span>
            </button>
            <button
              onClick={handleUploadDelta}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              title="Загрузить Quill JSON"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Загрузить JSON</span>
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
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors font-medium text-sm"
              title="Скачать как Quill Delta (.json)"
            >
              Quill JSON
            </button>
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors font-medium text-sm"
              title="Скачать как HTML"
            >
              HTML
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              title="Скачать как Markdown (.md)"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Скачать MD</span>
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors ml-auto md:ml-0"
              title="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main content area with editor and gallery */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Редактор Quill */}
          <div className="flex-1 overflow-hidden flex flex-col quill-fullscreen" style={docStyle}>
            <div ref={toolbarRef} className="ql-toolbar ql-snow"></div>
            <div ref={editorHostRef} className="ql-container ql-snow" style={{ flex: 1 }}></div>
          </div>

          {/* File Gallery Sidebar — full width on mobile, fixed sidebar on desktop */}
          {showGallery && (
            <div className="w-full md:w-96 h-1/2 md:h-auto border-t md:border-t-0 md:border-l bg-background flex flex-col shrink-0">
              <FileGallery lang="ru" onSelectFile={handleSelectFile} />
            </div>
          )}
        </div>
      </div>

      <DocEditorThemeStyles />
    </div>
  );
}
