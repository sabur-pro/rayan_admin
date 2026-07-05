// src/app/document-editor/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import QuillEditor from '@/components/QuillEditor';

/**
 * Standalone full-screen document editor route.
 *
 * Rendered under the root layout (NOT the dashboard layout), so QuillEditor's
 * `fixed inset-0` is positioned against the viewport instead of the dashboard's
 * `.glass` wrapper — whose `backdrop-filter` would otherwise become the containing
 * block for the fixed element, breaking both full-screen sizing and internal scroll.
 */
export default function DocumentEditorPage() {
  const router = useRouter();

  const handleClose = () => {
    // Return to wherever the user came from (usually the materials page, with its
    // query params preserved via history); fall back to the dashboard.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return <QuillEditor isOpen onClose={handleClose} />;
}
