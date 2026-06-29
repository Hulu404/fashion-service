import Masthead from '../components/Masthead'
import Hero from '../components/Hero'
import FeaturedCard from '../components/FeaturedCard'
import TrendCard from '../components/TrendCard'
import { createClient } from '../lib/supabaseServer'

export default async function Page() {
  const supabase = createClient()
  const { data: trends } = supabase
    ? await supabase.from('trends').select('*').order('number', { ascending: true }).limit(6)
    : { data: null }

  const hasTrends = Array.isArray(trends) && trends.length > 0

  return (
    <main className="p-4 max-w-md mx-auto min-h-screen phone-shell lg:max-w-[1000px] lg:px-[var(--gut)] lg:py-10">
      <Masthead />
      <Hero />

      <section className="mt-6 lg:mt-12">
        <h3 className="text-sm text-stone font-semibold">Показы недели</h3>
        {hasTrends ? (
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
            {trends!.map((t: any) => (
              <TrendCard key={t.id} trend={t} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft font-light leading-relaxed">
            Подборка показов появится позже. А пока соберите свой образ.
          </p>
        )}
      </section>

      <section className="mt-8 lg:mt-10">
        <FeaturedCard />
      </section>
    </main>
  )
}
