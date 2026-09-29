import { CategoryGrid } from '@/components/home/CategoryGrid'
import { CtaBanner } from '@/components/home/CtaBanner'
import { FeaturedNearby } from '@/components/home/FeaturedNearby'
import { Hero } from '@/components/home/Hero'

export function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <FeaturedNearby />
      <CtaBanner />
    </>
  )
}
