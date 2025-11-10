// src/components/WysiwygEditor.tsx
'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import TurndownService from 'turndown';
import { 
  X, Download, Upload, Bold, Italic, List, ListOrdered,
  Heading1, Heading2, Heading3, Image as ImageIcon, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, Plus, Trash2
} from 'lucide-react';

interface WysiwygEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WysiwygEditor({ isOpen, onClose }: WysiwygEditorProps) {
  const [fileName, setFileName] = useState('document.md');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '<h1>Новый документ</h1><p>Начните создание вашего документа здесь...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-6',
      },
    },
  });

  const handleDownload = () => {
    if (!editor) return;
    
    const html = editor.getHTML();
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    
    // Настройка конвертации таблиц
    turndownService.addRule('table', {
      filter: 'table',
      replacement: function (content: string) {
        return '\n\n' + content + '\n\n';
      }
    });
    
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

  // Скачать как JSON (TipTap формат)
  const handleDownloadJSON = () => {
    if (!editor) return;
    
    const json = editor.getJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const base = fileName.replace(/\.md$/i, '');
    link.download = `${base || 'document'}.tiptap.json`;
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
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        
        // Загружаем JSON в TipTap
        editor.commands.setContent(json);
        
        // Обновляем имя файла
        const baseName = file.name.replace('.tiptap.json', '').replace('.json', '');
        setFileName(baseName);
      } catch (error) {
        console.error('Ошибка при загрузке файла:', error);
        alert('Не удалось загрузить файл. Проверьте формат JSON.');
      }
    };
    reader.readAsText(file);
    
    // Сбросить input
    event.target.value = '';
  };

  const addImage = () => {
    const url = prompt('Введите URL изображения:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  const addTableRow = () => {
    if (editor) {
      editor.chain().focus().addRowAfter().run();
    }
  };

  const addTableColumn = () => {
    if (editor) {
      editor.chain().focus().addColumnAfter().run();
    }
  };

  const deleteTableRow = () => {
    if (editor) {
      editor.chain().focus().deleteRow().run();
    }
  };

  const deleteTableColumn = () => {
    if (editor) {
      editor.chain().focus().deleteColumn().run();
    }
  };

  const handleClose = () => {
    if (editor && editor.getText().trim()) {
      if (confirm('У вас есть несохраненные изменения. Вы уверены?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen || !editor) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col">
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
              title="Загрузить TipTap JSON"
            >
              <Upload className="w-5 h-5" />
              Загрузить JSON
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json,.tiptap.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={handleDownloadJSON} 
              className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors font-medium"
              title="Скачать как TipTap JSON"
            >
              TipTap JSON
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

        {/* Панель инструментов */}
        <div className="border-b bg-accent/20 px-4 py-3 flex items-center gap-2 overflow-x-auto shrink-0">
          {/* Заголовки */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : ''}`}
            title="Заголовок 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : ''}`}
            title="Заголовок 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : ''}`}
            title="Заголовок 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Форматирование текста */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`toolbar-btn ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : ''}`}
            title="Жирный"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`toolbar-btn ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : ''}`}
            title="Курсив"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Выравнивание */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary text-primary-foreground' : ''}`}
            title="По левому краю"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary text-primary-foreground' : ''}`}
            title="По центру"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'bg-primary text-primary-foreground' : ''}`}
            title="По правому краю"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Списки */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : ''}`}
            title="Маркированный список"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : ''}`}
            title="Нумерованный список"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Изображения и таблицы */}
          <button
            onClick={addImage}
            className="toolbar-btn"
            title="Добавить изображение"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={insertTable}
            className="toolbar-btn"
            title="Вставить таблицу"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Управление таблицей */}
          <button
            onClick={addTableRow}
            className="toolbar-btn text-xs px-2"
            title="Добавить строку"
          >
            <Plus className="w-3 h-3 mr-1" />
            Строка
          </button>
          <button
            onClick={addTableColumn}
            className="toolbar-btn text-xs px-2"
            title="Добавить столбец"
          >
            <Plus className="w-3 h-3 mr-1" />
            Столбец
          </button>
          <button
            onClick={deleteTableRow}
            className="toolbar-btn text-xs px-2"
            title="Удалить строку"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Строка
          </button>
          <button
            onClick={deleteTableColumn}
            className="toolbar-btn text-xs px-2"
            title="Удалить столбец"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Столбец
          </button>
        </div>

        {/* Редактор */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-5xl mx-auto py-8">
            <EditorContent editor={editor} className="wysiwyg-editor" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .toolbar-btn {
          @apply p-2 rounded hover:bg-accent transition-colors flex items-center justify-center;
        }

        .wysiwyg-editor .ProseMirror {
          min-height: 60vh;
        }

        .wysiwyg-editor .ProseMirror:focus {
          outline: none;
        }

        .wysiwyg-editor h1 {
          @apply text-4xl font-bold mt-8 mb-4;
        }

        .wysiwyg-editor h2 {
          @apply text-3xl font-bold mt-6 mb-3;
        }

        .wysiwyg-editor h3 {
          @apply text-2xl font-bold mt-4 mb-2;
        }

        .wysiwyg-editor p {
          @apply my-3;
        }

        .wysiwyg-editor ul,
        .wysiwyg-editor ol {
          @apply my-3 ml-6;
        }

        .wysiwyg-editor ul {
          @apply list-disc;
        }

        .wysiwyg-editor ol {
          @apply list-decimal;
        }

        .wysiwyg-editor li {
          @apply my-1;
        }

        .wysiwyg-editor strong {
          @apply font-bold;
        }

        .wysiwyg-editor em {
          @apply italic;
        }

        .wysiwyg-editor .editor-image {
          @apply max-w-full h-auto rounded-lg my-4 cursor-pointer;
          resize: both;
          overflow: auto;
        }

        .wysiwyg-editor .editor-image:hover {
          @apply ring-2 ring-primary;
        }

        .wysiwyg-editor .editor-table {
          @apply border-collapse w-full my-4;
        }

        .wysiwyg-editor .editor-table th,
        .wysiwyg-editor .editor-table td {
          @apply border border-border px-4 py-2;
        }

        .wysiwyg-editor .editor-table th {
          @apply bg-accent font-semibold text-left;
        }

        .wysiwyg-editor .editor-table td {
          @apply bg-background;
        }

        .wysiwyg-editor .selectedCell {
          @apply bg-primary/10;
        }
      `}</style>
    </div>
  );
}
