/**
 * Font-size support for the Quill editors (document-editor + /edit route).
 *
 * Quill ships with only 3 size steps (small / normal / large / huge via the class attributor).
 * Here we register the STYLE-based size attributor with `whitelist = null`, which:
 *   - accepts ANY inline font-size (so the custom size input can set arbitrary px), and
 *   - emits `style="font-size: NNpx"` in the Delta, which the mobile app's
 *     quillDeltaToHtml converter renders (see rayan/src/utils/quillDeltaToHtml.ts).
 * The toolbar dropdown below offers a wide set of common sizes.
 */

// Common quick-pick sizes shown in the toolbar dropdown (16px = the empty "normal" option).
export const QUILL_SIZE_WHITELIST = [
  '10px', '12px', '14px', '18px', '20px', '24px', '28px', '32px', '48px',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerQuillSizes(Quill: any): void {
  const SizeStyle = Quill.import('attributors/style/size');
  // null = allow any font-size value (enables the custom size input)
  SizeStyle.whitelist = null;
  Quill.register(SizeStyle, true);
}

// Toolbar markup for the size picker. The empty <option selected> is the default (normal) size.
export const QUILL_SIZE_TOOLBAR_HTML = `
  <span class="ql-formats">
    <select class="ql-size">
      <option value="10px">10</option>
      <option value="12px">12</option>
      <option value="14px">14</option>
      <option selected></option>
      <option value="18px">18</option>
      <option value="20px">20</option>
      <option value="24px">24</option>
      <option value="28px">28</option>
      <option value="32px">32</option>
      <option value="48px">48</option>
    </select>
  </span>
`;
