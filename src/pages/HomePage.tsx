import { AdoptionRail } from '@/components/home/AdoptionRail'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { CtaBanner } from '@/components/home/CtaBanner'
import { FeaturedNearby } from '@/components/home/FeaturedNearby'
import { Hero } from '@/components/home/Hero'
import { ProductRail } from '@/components/home/ProductRail'

/**
 * «فروشگاه» و «سرپرستی» عمداً پشت‌سرهم و هم‌وزن‌اند.
 *
 * The platform has two reasons to be visited and the page used to lead with
 * only one of them: a catalogue of goods. Adoption is the part with no
 * equivalent elsewhere and the one people pass on, so it sits directly beside
 * the product grid rather than below the fold or in the footer.
 */
export function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductRail />
      <AdoptionRail />
      <FeaturedNearby />
      <CtaBanner />
    </>
  )
}