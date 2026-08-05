/**
 * Chapter markers for the Quill editors.
 *
 * A book's table of contents lives in the database (see src/lib/chapter.ts),
 * but each chapter needs a *position* inside the document. That position is an
 * invisible inline embed the admin drops at the cursor:
 *
 *     { insert: { chapter: "ch_a1b2c3" } }
 *
 * which serializes to `<span data-chapter="ch_a1b2c3"></span>`. The mobile
 * reader's converter (rayan/src/utils/quillDeltaToHtml.ts) preserves that span,
 * and the reader engine locates it to resolve "go to chapter" against whatever
 * page geometry the device ends up with.
 *
 * Keeping the marker inline — rather than a block — matters: a chapter may
 * start mid-paragraph, and a block embed would split the paragraph in two.
 */

/** Delta shape of a chapter marker, for code that inspects document contents. */
export interface ChapterEmbed {
  chapter: string;
}

let registered = false;

/**
 * Registers the `chapter` inline embed. Safe to call repeatedly — Quill is
 * imported dynamically per editor mount, and re-registering a blot on an
 * already-patched Quill build throws.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerChapterBlot(Quill: any): void {
  if (registered) return;

  const Embed = Quill.import('blots/embed');

  class ChapterBlot extends Embed {
    static blotName = 'chapter';
    static tagName = 'span';
    static className = 'ql-chapter-marker';

    static create(anchor: string) {
      const node = super.create(anchor) as HTMLElement;
      node.setAttribute('data-chapter', anchor);
      // Editor-only affordance: the marker is invisible in the reader, but the
      // admin has to be able to see and delete it.
      node.setAttribute('contenteditable', 'false');
      node.setAttribute('title', 'Начало главы');
      return node;
    }

    static value(node: HTMLElement) {
      return node.getAttribute('data-chapter');
    }
  }

  Quill.register(ChapterBlot, true);
  registered = true;
}

/** Styles that make the otherwise-invisible marker visible while editing. */
export const CHAPTER_MARKER_STYLES = `
  .ql-editor .ql-chapter-marker {
    display: inline-block;
    width: 14px;
    height: 1em;
    vertical-align: text-bottom;
    background-color: rgba(232, 98, 42, 0.18);
    border-left: 2px solid #E8622A;
    border-radius: 2px;
    margin: 0 1px;
    cursor: pointer;
  }
  .ql-editor .ql-chapter-marker::after {
    content: '§';
    display: block;
    font-size: 0.7em;
    line-height: 1.4;
    text-align: center;
    color: #E8622A;
  }
`;

/**
 * Scans a Quill delta for chapter markers, in document order. Used to reconcile
 * the document against the chapter list — a chapter whose anchor is missing
 * from the document is unreachable and must be flagged to the admin.
 */
export function anchorsInDelta(delta: unknown): string[] {
  const ops = (delta as { ops?: { insert?: unknown }[] })?.ops;
  if (!Array.isArray(ops)) return [];

  const anchors: string[] = [];
  for (const op of ops) {
    const insert = op.insert;
    if (insert && typeof insert === 'object' && 'chapter' in insert) {
      const anchor = (insert as ChapterEmbed).chapter;
      if (typeof anchor === 'string') anchors.push(anchor);
    }
  }
  return anchors;
}
