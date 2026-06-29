export default function Hero(){
  return (
    <section className="bg-white rounded-e p-5">
      <div className="text-xs text-stone uppercase">Коллекция</div>
      <h1 className="mt-2 text-3xl font-[var(--font-bodoni)]">Новый взгляд — на каждый день</h1>
      <p className="mt-2 text-sm text-ink-soft">AI подбирает образы по вашему фото и настроению.</p>
      <div className="mt-4 flex gap-3 items-center">
        <a className="bg-ink text-white px-4 py-2 rounded button-shadow" href="/podbor">Подобрать образ</a>
        <a className="text-sm text-ink-soft underline" href="/podbor">Загрузить фото</a>
      </div>
    </section>
  )
}
