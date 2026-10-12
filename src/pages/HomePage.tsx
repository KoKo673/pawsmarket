import { CategoryGrid } from '@/components/home/CategoryGrid'
import { CtaBanner } from '@/components/home/CtaBanner'
import { FeaturedNearby } from '@/components/home/FeaturedNearby'
import { Hero } from '@/components/home/Hero'
import { ProductRail } from '@/components/home/ProductRail'

export function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductRail />
      <FeaturedNearby />
      <CtaBanner />
    </>
  )
}