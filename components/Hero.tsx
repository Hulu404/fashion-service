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
        <span className="eyebrow">Коллекция</span>
        <h1>Новый взгляд — на каждый день</h1>
        <p>AI подбирает образы по вашему фото и настроению — и объясняет, почему они работают.</p>
        <div className="hero-cta">
          <a className="btn" href="/podbor">
            Подобрать образ
          </a>
          <a className="linklike" href="/podbor">
            или загрузить фото
          </a>
        </div>
      </div>
    </section>
  )
}
