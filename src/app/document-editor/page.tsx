// src/app/document-editor/page.tsx
'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuillEditor, { QuillEditorMaterial } from '@/components/QuillEditor';

/**
 * Standalone full-screen document editor route.
 *
 * Rendered under the root layout (NOT the dashboard layout), so QuillEditor's
 * `fixed inset-0` is positioned against the viewport instead of the dashboard's
 * `.glass` wrapper — whose `backdrop-filter` would otherwise become the containing
 * block for the fixed element, breaking both full-screen sizing and internal scroll.
 *
 * With `material_id`, `lang_code` and `doc` in the query string the editor opens
 * an existing book: it loads that document, manages its chapters and saves back
 * to the material. Without them it is the standalone editor that downloads a file.
 */
function DocumentEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const materialId = Number(searchParams.get('material_id'));
  const langCode = searchParams.get('lang_code');
  const docPath = searchParams.get('doc');

  // Memoised so the editor sees a stable identity: it keys its Quill instance
  // off this, and a new object each render would remount the editor.
  const material: QuillEditorMaterial | undefined = useMemo(
    () =>
      materialId && langCode && docPath ? { materialId, langCode, docPath } : undefined,
    [materialId, langCode, docPath]
  );

  const handleClose = () => {
    // Return to wherever the user came from (usually the materials page, with its
    // query params preserved via history); fall back to the dashboard.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return <QuillEditor isOpen onClose={handleClose} material={material} />;
}

export default function DocumentEditorPage() {
  // useSearchParams requires a Suspense boundary during static rendering.
  return (
    <Suspense fallback={null}>
      <DocumentEditorContent />
    </Suspense>
  );
}
