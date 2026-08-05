// src/components/QuillEditor.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Download, Upload, ImagePlus, Save, Loader2, ListTree } from 'lucide-react';
import TurndownService from 'turndown';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';
import FileGallery from '@/components/FileGallery';
import ChapterManager from '@/components/ChapterManager';
import { API_BASE_URL, fetchWithAuth } from '@/lib/http';
import { rebindDocument } from '@/lib/chapter';
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
import {
  registerChapterBlot,
  CHAPTER_MARKER_STYLES,
  anchorsInDelta,
} from '@/lib/quillChapter';

/**
 * Material context. When all three are supplied the editor works *on* a book
 * that already exists: it loads that document, manages its chapters and saves
 * back to the material. Without them it stays the standalone
 * download-a-file editor it has always been.
 */
export interface QuillEditorMaterial {
  materialId: number;
  langCode: string;
  /** URL of the book document being edited. */
  docPath: string;
}

interface QuillEditorProps {
  isOpen: boolean;
  onClose: () => void;
  material?: QuillEditorMaterial;
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
  root?: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on?: (event: string, handler: (...args: any[]) => void) => void;
}

export default function QuillEditor({ isOpen, onClose, material }: QuillEditorProps) {
  const [fileName, setFileName] = useState('document.md');
  const [showGallery, setShowGallery] = useState(false);
  const [previewTheme, changeTheme] = useDocThemePreference();
  const [customSize, setCustomSize] = useState('');
  const editorHostRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const lastRangeRef = useRef<QuillRange | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Book mode: chapter panel, load-from-material, save-to-material.
  const [showChapters, setShowChapters] = useState(Boolean(material));
  const [documentAnchors, setDocumentAnchors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  /**
   * Path the chapters are currently filed under. Saving replaces the file and
   * yields a new path, so this advances after each successful save and is what
   * subsequent saves rebind *from*.
   */
  const [docPath, setDocPath] = useState(material?.docPath ?? '');

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

  // Quill editor initialization.
  //
  // Depends on the material's *fields*, not the object: callers build the
  // material inline from query params, so a new object identity arrives on
  // every render. Depending on the object tore the editor down and rebuilt it
  // after each setState — including the ones this effect itself triggers on
  // load — so the document never survived long enough to appear.
  const materialId = material?.materialId;
  const materialLangCode = material?.langCode;
  const materialDocPath = material?.docPath;

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    (async () => {
      const Quill = (await import('quill')).default;

      // Регистрируем размеры шрифта (px + произвольные значения)
      registerQuillSizes(Quill);

      // Инлайновый маркер начала главы (см. src/lib/quillChapter.ts)
      registerChapterBlot(Quill);

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

        // Quill mounts its editor *inside* the host. If this effect re-runs for
        // a real reason (a different document), the previous editor is still in
        // the DOM and a second instance would nest inside it — so start clean.
        editorHostRef.current.innerHTML = '';

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

        quillRef.current = q as QuillInstance;

        if (materialDocPath) {
          // Editing an existing book: pull the stored document in rather than
          // starting from the "new document" placeholder.
          try {
            // Uploaded files are served behind auth, so the document has to be
            // requested with the admin's token like every other API call.
            const response = await fetchWithAuth(materialDocPath, { method: 'GET' });
            if (!response.ok) {
              throw new Error(`${response.status} ${await response.text().catch(() => '')}`);
            }
            const raw = await response.text();
            if (!isMounted) return;

            if (/\.md(\?|$)/i.test(materialDocPath)) {
              // Markdown is rendered into the editor; it round-trips back out
              // through the existing turndown export.
              q.clipboard.dangerouslyPasteHTML(raw);
            } else {
              const delta = JSON.parse(raw);
              if (delta?.ops) {
                q.setContents(delta);
                setDocumentAnchors(anchorsInDelta(delta));
              }
            }
            setFileName(materialDocPath.split('/').pop() || 'document');
          } catch (err) {
            console.error('Не удалось загрузить документ материала:', err);
            if (isMounted) {
              setSaveError(
                `Не удалось загрузить документ материала: ${err instanceof Error ? err.message : ''}`
              );
            }
          }
        } else {
          // Set initial content
          q.clipboard.dangerouslyPasteHTML('<h1>Новый документ</h1><p>Начните создание вашего документа здесь...</p>');
        }

        // Keep the chapter panel's "marker present?" checks in step with edits.
        (q as QuillInstance).on?.('text-change', () => {
          setDocumentAnchors(anchorsInDelta(q.getContents()));
        });

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
  }, [isOpen, materialId, materialLangCode, materialDocPath]);

  /** Drops a chapter marker at the cursor and leaves the caret after it. */
  const insertChapterMarker = useCallback((anchor: string) => {
    const quill = quillRef.current;
    if (!quill) return;
    const range = lastRangeRef.current || quill.getSelection?.(true) || { index: 0, length: 0 };
    quill.insertEmbed?.(range.index, 'chapter', anchor, 'user');
    quill.setSelection?.(range.index + 1, 0);
    setDocumentAnchors(anchorsInDelta(quill.getContents()));
  }, []);

  /** Scrolls the editor to an existing marker so the admin can see where it sits. */
  const focusChapterMarker = useCallback((anchor: string) => {
    const node = editorHostRef.current?.querySelector(`[data-chapter="${anchor}"]`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  /**
   * Writes the document back to the material.
   *
   * The API replaces a file by storing new content under a fresh name, so the
   * document's path changes on every save. The reader's chapters, bookmarks,
   * quotes and progress are all keyed by that path — hence the rebind call
   * immediately after, which moves them onto the new path. If the rebind fails
   * the admin is told loudly: the file saved, but the book just lost its
   * table of contents.
   */
  const handleSaveToMaterial = async () => {
    const quill = quillRef.current;
    if (!quill || !material) return;

    setSaving(true);
    setSaveError(null);
    try {
      const isMarkdown = /\.md(\?|$)/i.test(docPath);
      let blob: Blob;
      let uploadName: string;

      if (isMarkdown) {
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
        });
        turndownService.addRule('strikethrough', {
          filter: ['del', 's'],
          replacement: (content: string) => `~~${content}~~`,
        });
        // Chapter markers must survive the HTML → Markdown trip, otherwise the
        // table of contents loses every position on save.
        turndownService.addRule('chapterMarker', {
          filter: (node: HTMLElement) => node.hasAttribute?.('data-chapter'),
          replacement: (_content: string, node: Node) =>
            `<span data-chapter="${(node as HTMLElement).getAttribute('data-chapter')}"></span>`,
        });

        const html = editorHostRef.current?.querySelector('.ql-editor')?.innerHTML || '';
        blob = new Blob([turndownService.turndown(html)], { type: 'text/markdown;charset=utf-8' });
        uploadName = docPath.split('/').pop() || 'document.md';
      } else {
        const delta = quill.getContents();
        blob = new Blob([JSON.stringify(delta)], { type: 'application/json;charset=utf-8' });
        uploadName = docPath.split('/').pop() || 'document.json';
      }

      const relativeOldPath = docPath.replace(`${API_BASE_URL}/`, '');

      const formData = new FormData();
      formData.append('material_id', String(material.materialId));
      formData.append('lang_code', material.langCode);
      formData.append('paths', relativeOldPath);
      formData.append('files', blob, uploadName);

      const response = await fetchWithAuth(`${API_BASE_URL}/material/translation/files`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Ошибка сохранения: ${response.status} ${text}`);
      }

      const saved = await response.json();
      const newPath: string = Array.isArray(saved) ? saved[0] : saved?.[0] ?? '';
      if (!newPath) {
        throw new Error('Сервер не вернул путь сохранённого файла');
      }

      await rebindDocument(material.materialId, material.langCode, docPath, newPath);
      setDocPath(newPath);
      setSavedAt(new Date().toLocaleTimeString('ru-RU'));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Не удалось сохранить документ');
    } finally {
      setSaving(false);
    }
  };

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
            <h2 className="text-lg md:text-2xl font-bold">
              {material ? 'Редактировать книгу' : 'Создать документ'}
            </h2>
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
            {material && (
              <>
                <button
                  onClick={() => setShowChapters(!showChapters)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors font-medium ${showChapters
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent hover:bg-accent/80'
                    }`}
                  title="Главы книги"
                >
                  <ListTree className="w-5 h-5" />
                  <span className="hidden sm:inline">Главы</span>
                </button>
                <button
                  onClick={handleSaveToMaterial}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  title="Сохранить документ в материал"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </span>
                </button>
              </>
            )}
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

        {(saveError || savedAt) && (
          <div
            className={`px-3 md:px-6 py-2 text-sm shrink-0 ${saveError
              ? 'bg-destructive/10 text-destructive border-b border-destructive/20'
              : 'bg-green-600/10 text-green-700 dark:text-green-400 border-b border-green-600/20'
              }`}
          >
            {saveError || `Документ сохранён в ${savedAt}`}
          </div>
        )}

        {/* Main content area with editor and gallery */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Редактор Quill */}
          <div className="flex-1 overflow-hidden flex flex-col quill-fullscreen" style={docStyle}>
            <div ref={toolbarRef} className="ql-toolbar ql-snow"></div>
            <div ref={editorHostRef} className="ql-container ql-snow" style={{ flex: 1 }}></div>
          </div>

          {/* Chapter sidebar — only meaningful when editing an actual book. */}
          {material && showChapters && (
            <div className="w-full md:w-96 h-1/2 md:h-auto border-t md:border-t-0 md:border-l bg-background flex flex-col shrink-0">
              <ChapterManager
                key={docPath}
                materialId={material.materialId}
                langCode={material.langCode}
                docPath={docPath}
                anchorsInDocument={documentAnchors}
                onInsertMarker={insertChapterMarker}
                onFocusMarker={focusChapterMarker}
                className="h-full"
              />
            </div>
          )}

          {/* File Gallery Sidebar — full width on mobile, fixed sidebar on desktop */}
          {showGallery && (
            <div className="w-full md:w-96 h-1/2 md:h-auto border-t md:border-t-0 md:border-l bg-background flex flex-col shrink-0">
              <FileGallery lang="ru" onSelectFile={handleSelectFile} />
            </div>
          )}
        </div>
      </div>

      <DocEditorThemeStyles />
      <style jsx global>{CHAPTER_MARKER_STYLES}</style>
    </div>
  );
}
