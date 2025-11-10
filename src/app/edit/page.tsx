// src/app/edit/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Upload, Home } from 'lucide-react';
import 'react-quill/dist/quill.snow.css';
import { useRouter } from 'next/navigation';

interface QuillInstance {
  getContents: () => unknown;
  setContents: (delta: unknown) => void;
  clipboard: {
    dangerouslyPasteHTML: (html: string) => void;
  };
}

export default function PublicEditorPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState('document.json');
  const editorHostRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const Quill = (await import('quill')).default;

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
            <button class="ql-clean"></button>
          </span>
        `;
      }

      if (editorHostRef.current && mounted) {
        const q = new Quill(editorHostRef.current, {
          theme: 'snow',
          placeholder: 'Начните печатать...',
          modules: {
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
              },
            },
          },
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
  }, []);

  // Скачать как JSON
  const handleDownloadDelta = () => {
    const delta = quillRef.current?.getContents() || {};
    const blob = new Blob([JSON.stringify(delta, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const base = fileName.replace(/\.json$/i, '');
    link.download = `${base || 'document'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Загрузить JSON файл
  const handleUploadJSON = () => {
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
          const baseName = file.name.replace('.json', '');
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

  const handleClose = () => {
    const html = editorHostRef.current?.querySelector('.ql-editor')?.innerHTML || '';
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    if (textContent && !/Новый документ\s*Начните создание вашего документа здесь\.\.\./.test(textContent)) {
      if (confirm('У вас есть несохраненные изменения. Вы уверены, что хотите вернуться на главную?')) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
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
              onClick={handleUploadJSON} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              title="Загрузить JSON"
            >
              <Upload className="w-5 h-5" />
              Загрузить JSON
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={handleDownloadDelta} 
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              title="Скачать как JSON"
            >
              <Download className="w-5 h-5" />
              Скачать JSON
            </button>
            <button 
              onClick={handleClose} 
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              title="Вернуться на главную"
            >
              <Home className="w-5 h-5" />
              На главную
            </button>
          </div>
        </div>

        {/* Редактор Quill на весь экран */}
        <div className="flex-1 overflow-hidden flex flex-col quill-fullscreen">
          <div ref={toolbarRef} className="ql-toolbar ql-snow"></div>
          <div ref={editorHostRef} className="ql-container ql-snow" style={{ flex: 1 }}></div>
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
      `}</style>
    </div>
  );
}

