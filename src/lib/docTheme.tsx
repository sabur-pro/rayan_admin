'use client';

import React from 'react';
import { Sun, Moon, BookOpen } from 'lucide-react';

/**
 * Documents created in the admin editors are later rendered inside the mobile app, which
 * supports three themes (light / dark / reading). These palettes mirror the app's
 * rayan/src/theme/colors.ts exactly, so authors preview a document precisely as students
 * will see it in each mode. Shared by both editor surfaces: QuillEditor and the /edit route.
 */
export type PreviewTheme = 'light' | 'dark' | 'reading';

export const APP_THEMES: Record<PreviewTheme, {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  code: string;
}> = {
  light: {
    background: '#ffffff', surface: '#f8fafc', text: '#0f172a',
    textSecondary: '#475569', border: '#e2e8f0', primary: '#22c55e', code: '#f1f5f9',
  },
  dark: {
    background: '#0a0a0a', surface: '#1a1815', text: '#f5f5f4',
    textSecondary: '#c7c3ba', border: '#3a3528', primary: '#10b981', code: '#252218',
  },
  reading: {
    background: '#f5f1e8', surface: '#faf8f3', text: '#2d2a25',
    textSecondary: '#5a5550', border: '#d4cfc4', primary: '#8b7355', code: '#ebe7dc',
  },
};

export const THEME_STORAGE_KEY = 'docEditorPreviewTheme';

const THEME_OPTIONS: { key: PreviewTheme; Icon: typeof Sun; label: string }[] = [
  { key: 'light', Icon: Sun, label: 'Светлая' },
  { key: 'dark', Icon: Moon, label: 'Тёмная' },
  { key: 'reading', Icon: BookOpen, label: 'Чтение' },
];

/** Builds the CSS custom properties consumed by the .quill-fullscreen styles below. */
export function getDocThemeStyle(theme: PreviewTheme): React.CSSProperties {
  const tc = APP_THEMES[theme];
  return {
    '--doc-bg': tc.background,
    '--doc-surface': tc.surface,
    '--doc-text': tc.text,
    '--doc-text-secondary': tc.textSecondary,
    '--doc-border': tc.border,
    '--doc-primary': tc.primary,
    '--doc-code': tc.code,
  } as React.CSSProperties;
}

/** State + localStorage persistence for the chosen preview theme. */
export function useDocThemePreference(): [PreviewTheme, (t: PreviewTheme) => void] {
  const [previewTheme, setPreviewTheme] = React.useState<PreviewTheme>('light');

  React.useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'reading') {
      setPreviewTheme(saved);
    }
  }, []);

  const changeTheme = (theme: PreviewTheme) => {
    setPreviewTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  return [previewTheme, changeTheme];
}

/** Segmented light / dark / reading switcher for the editor header. */
export function DocThemeSwitcher({
  value,
  onChange,
}: {
  value: PreviewTheme;
  onChange: (t: PreviewTheme) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-accent">
      {THEME_OPTIONS.map(({ key, Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          title={`Предпросмотр: ${label}`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${value === key
            ? 'bg-primary text-primary-foreground shadow'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Global styles for the full-screen Quill editor surface. All colors are driven by the
 * --doc-* CSS variables set on .quill-fullscreen (see getDocThemeStyle), so switching the
 * preview theme instantly recolors the whole document surface.
 */
export function DocEditorThemeStyles() {
  return (
    <style jsx global>{`
      .quill-fullscreen {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--doc-bg);
        transition: background-color 0.2s ease;
      }

      .quill-fullscreen .ql-container {
        flex: 1;
        overflow-y: auto;
        font-size: 16px;
        background: var(--doc-bg);
        border: none;
      }

      .quill-fullscreen .ql-editor {
        min-height: 100%;
        padding: 40px;
        font-size: 16px;
        line-height: 1.6;
        color: var(--doc-text);
      }

      .quill-fullscreen .ql-editor.ql-blank::before {
        color: var(--doc-text-secondary);
        font-style: normal;
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

      .quill-fullscreen .ql-editor a {
        color: var(--doc-primary);
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
        border-left: 4px solid var(--doc-primary);
        padding-left: 1rem;
        margin: 1.5rem 0;
        font-style: italic;
        color: var(--doc-text-secondary);
      }

      .quill-fullscreen .ql-editor pre {
        background-color: var(--doc-code);
        color: var(--doc-text);
        padding: 1rem;
        border-radius: 6px;
        overflow-x: auto;
        margin: 1rem 0;
      }

      .quill-fullscreen .ql-toolbar {
        border: none;
        border-bottom: 1px solid var(--doc-border);
        background: var(--doc-surface);
        padding: 12px;
      }

      .quill-fullscreen .ql-toolbar .ql-stroke {
        stroke: var(--doc-text);
      }

      .quill-fullscreen .ql-toolbar .ql-fill {
        fill: var(--doc-text);
      }

      .quill-fullscreen .ql-toolbar .ql-picker,
      .quill-fullscreen .ql-toolbar .ql-picker-label,
      .quill-fullscreen .ql-toolbar button {
        color: var(--doc-text);
      }

      .quill-fullscreen .ql-toolbar button:hover,
      .quill-fullscreen .ql-toolbar .ql-picker-label:hover {
        background-color: var(--doc-border);
        border-radius: 4px;
      }

      .quill-fullscreen .ql-toolbar button:hover .ql-stroke {
        stroke: var(--doc-primary);
      }

      .quill-fullscreen .ql-toolbar button:hover .ql-fill {
        fill: var(--doc-primary);
      }

      .quill-fullscreen .ql-toolbar button.ql-active,
      .quill-fullscreen .ql-toolbar .ql-picker-label.ql-active {
        background-color: var(--doc-primary);
        border-radius: 4px;
      }

      .quill-fullscreen .ql-toolbar button.ql-active .ql-stroke {
        stroke: #fff;
      }

      .quill-fullscreen .ql-toolbar button.ql-active .ql-fill {
        fill: #fff;
      }

      .quill-fullscreen .ql-toolbar .ql-picker-options {
        background: var(--doc-surface);
        border-color: var(--doc-border);
        color: var(--doc-text);
      }

      .quill-fullscreen .ql-editor .ql-formula {
        display: inline-block;
        padding: 4px 8px;
        background: var(--doc-surface);
        border: 1px solid var(--doc-border);
        border-radius: 4px;
        margin: 0 4px;
        cursor: pointer;
      }

      .quill-fullscreen .ql-toolbar .ql-formula {
        font-size: 16px;
        font-weight: bold;
      }

      .quill-fullscreen .ql-toolbar .ql-formula::after {
        content: none;
      }

      .quill-fullscreen .katex {
        color: var(--doc-text) !important;
      }

      .quill-fullscreen .katex .katex-html,
      .quill-fullscreen .katex .base,
      .quill-fullscreen .katex .strut,
      .quill-fullscreen .katex .mord,
      .quill-fullscreen .katex .mbin,
      .quill-fullscreen .katex .mrel,
      .quill-fullscreen .katex .mop,
      .quill-fullscreen .katex .mpunct,
      .quill-fullscreen .katex .mopen,
      .quill-fullscreen .katex .mclose,
      .quill-fullscreen .katex .minner,
      .quill-fullscreen .katex .mfrac,
      .quill-fullscreen .katex .mspace {
        color: inherit;
      }
    `}</style>
  );
}
