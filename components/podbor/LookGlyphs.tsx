/**
 * Hidden SVG <symbol> definitions for the look item glyphs, ported verbatim
 * from the prototype (eclat-prototype.html). Render once per results screen;
 * reference a glyph with <use href="#g-<icon>" />.
 */
export default function LookGlyphs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="g-coat" viewBox="0 0 24 24">
          <path d="M8 3l4 2 4-2 3 3-2 2v11H7V8L5 6l3-3z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M12 5v14" stroke="currentColor" strokeWidth="1.1" />
        </symbol>
        <symbol id="g-jacket" viewBox="0 0 24 24">
          <path d="M9 3l3 2 3-2 4 3-2 3v10h-4M9 3L5 6l2 3v10h4M12 5v14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </symbol>
        <symbol id="g-top" viewBox="0 0 24 24">
          <path d="M8 4l4 2 4-2 3 2-2 4v9H7v-9L5 6l3-2z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </symbol>
        <symbol id="g-shirt" viewBox="0 0 24 24">
          <path d="M8 4l4 3 4-3 3 2-2 3v9H7v-9L5 6l3-2z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M10 4l2 3 2-3" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </symbol>
        <symbol id="g-pants" viewBox="0 0 24 24">
          <path d="M7 3h10l-1 8-1 10h-3l-1-9-1 9H6l-1-10 1-8z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </symbol>
        <symbol id="g-skirt" viewBox="0 0 24 24">
          <path d="M8 4h8l3 11-1 1c-3 1-9 1-12 0l-1-1 3-11z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </symbol>
        <symbol id="g-shoe" viewBox="0 0 24 24">
          <path d="M3 13c3 0 4-4 6-4s2 3 5 3 6 1 6 3v2H3v-4z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </symbol>
        <symbol id="g-bag" viewBox="0 0 24 24">
          <path d="M6 9h12l-1 11H7L6 9z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </symbol>
        <symbol id="g-belt" viewBox="0 0 24 24">
          <path d="M3 10h18v4H3z" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <rect x="10" y="9" width="4" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </symbol>
        <symbol id="g-dress" viewBox="0 0 24 24">
          <path d="M9 3l3 2 3-2 1 4-2 2 3 10c-3 1-7 1-10 0l3-10-2-2 1-4z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </symbol>
      </defs>
    </svg>
  )
}
