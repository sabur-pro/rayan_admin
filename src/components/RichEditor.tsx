// src/components/RichEditor.tsx
// Компактный rich-text редактор (Quill) для текста уведомления.
// Картинки не встраиваются как base64, а загружаются на сервер (галерея),
// в контент вставляется только URL — чтобы не раздувать размер.
'use client';

import React, { useEffect, useRef } from 'react';
import 'react-quill/dist/quill.snow.css';
import { API_BASE_URL } from '@/lib/http';
import { uploadFile } from '@/lib/files';

interface QuillLike {
  root: HTMLElement;
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  insertEmbed: (index: number, type: string, value: string) => void;
  setSelection: (index: number, length: number) => void;
  clipboard: { dangerouslyPasteHTML: (html: string) => void };
  on: (event: string, cb: () => void) => void;
}

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  lang: string;
  placeholder?: string;
}

function fileUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

export default function RichEditor({ value, onChange, lang, placeholder }: RichEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillLike | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const Quill = (await import('quill')).default;
      if (cancelled || !hostRef.current || quillRef.current) return;

      const imageHandler = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const uploaded = await uploadFile(file, langRef.current || 'ru');
            const url = fileUrl(uploaded.path);
            const q = quillRef.current!;
            const range = q.getSelection(true) || { index: 0, length: 0 };
            q.insertEmbed(range.index, 'image', url);
            q.setSelection(range.index + 1, 0);
          } catch (e) {
            alert((e as Error).message);
          }
        };
        input.click();
      };

      const q = new Quill(hostRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Текст сообщения…',
        modules: {
          toolbar: {
            container: [
              ['bold', 'italic', 'underline'],
              [{ header: [1, 2, 3, false] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link', 'image'],
              ['clean'],
            ],
            handlers: { image: imageHandler },
          },
        },
      }) as unknown as QuillLike;

      quillRef.current = q;
      if (value) q.clipboard.dangerouslyPasteHTML(value);
      q.on('text-change', () => {
        const html = q.root.innerHTML;
        onChangeRef.current(html === '<p><br></p>' ? '' : html);
      });
    })();
    return () => { cancelled = true; };
    // Инициализируем один раз на маунт (переключение языка -> новый key -> ремаунт).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rich-editor bg-background rounded-md border">
      <div ref={hostRef} style={{ minHeight: 140 }} />
    </div>
  );
}
