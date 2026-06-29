'use client'

import { useEffect, useState } from 'react'

const WORDS = ['Анализируем запрос', 'Читаем палитру', 'Подбираем вещи', 'Собираем образы']

/**
 * Full-screen loader shown while looks are generated. Cycles the captions like
 * the prototype; it does not own timing of the request — it advances on its own
 * and holds on the last word until the parent swaps it out for the results.
 */
export default function Loader() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  // Advance one caption every ~900ms with a brief fade; hold on the last word
  // until the parent swaps the loader out for the results.
  useEffect(() => {
    if (index >= WORDS.length - 1) return
    const advance = setTimeout(() => {
      setVisible(false)
      const swap = setTimeout(() => {
        setIndex((i) => Math.min(i + 1, WORDS.length - 1))
        setVisible(true)
      }, 180)
      return () => clearTimeout(swap)
    }, 900)
    return () => clearTimeout(advance)
  }, [index])

  return (
    <main className="max-w-md mx-auto min-h-screen bg-oat flex items-center justify-center px-8 pb-24">
      <div className="loader">
        <div className="ring" />
        <div className="lw" style={{ opacity: visible ? 1 : 0 }}>
          {WORDS[index]}
        </div>
        <div className="sub">ÉCLAT собирает образы</div>
      </div>
    </main>
  )
}
