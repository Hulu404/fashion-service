export default function Hero() {
  return (
    <section className="hero">
      {/* Colour art field — top banner on mobile, right column on desktop */}
      <div className="hero-art" aria-hidden="true">
        <svg className="glyph" viewBox="0 0 24 24">
          <path
            d="M8 3l4 2 4-2 3 3-2 2v11H7V8L5 6l3-3z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path d="M12 5v14" stroke="currentColor" strokeWidth="0.9" />
        </svg>
      </div>

      <div className="hero-copy">
        <span className="eyebrow">Collection</span>
        <h1>A fresh look — for every day</h1>
        <p>AI builds outfits from your photo and mood — and explains why they work.</p>
        <div className="hero-cta">
          <a className="btn" href="/podbor">
            Build an outfit
          </a>
          <a className="linklike" href="/podbor">
            or upload a photo
          </a>
        </div>
      </div>
    </section>
  )
}
