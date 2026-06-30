import Masthead from '../components/Masthead'
import Hero from '../components/Hero'
import FeaturedCard from '../components/FeaturedCard'
import TrendsSection from '../components/TrendsSection'
import { createClient } from '../lib/supabaseServer'

export default async function Page() {
  const supabase = createClient()
  const { data: trends } = supabase
    ? await supabase.from('trends').select('*').order('number', { ascending: true }).limit(6)
    : { data: null }

  const hasTrends = Array.isArray(trends) && trends.length > 0

  return (
    <main className="p-4 max-w-md mx-auto min-h-screen phone-shell lg:max-w-[1320px] lg:px-[var(--gut)] lg:py-10">
      <Masthead />
      <Hero />

      <section className="mt-6 lg:mt-12">
        <h3 className="text-sm text-stone font-semibold">Shows of the week</h3>
        {hasTrends ? (
          <TrendsSection trends={trends as any} />
        ) : (
          <p className="mt-3 text-sm text-ink-soft font-light leading-relaxed">
            The show selection will appear later. In the meantime, build your own look.
          </p>
        )}
      </section>

      <section className="mt-8 lg:mt-10">
        <FeaturedCard />
      </section>
    </main>
  )
}
