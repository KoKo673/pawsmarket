import { AdoptionRail } from '@/components/home/AdoptionRail'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { CtaBanner } from '@/components/home/CtaBanner'
import { FeaturedNearby } from '@/components/home/FeaturedNearby'
import { Hero } from '@/components/home/Hero'
import { ProductRail } from '@/components/home/ProductRail'

/**
 * ترتیب بخش‌ها — خدمات و سرپرستی اول.
 *
 * The page used to lead with the product grid. That put the two things
 * nobody else here offers — a clinic that actually answers a booking
 * request, and an animal that needs a home — below a catalogue of goods
 * the visitor can buy on a hundred other sites.
 *
 * The measured reason is content, not taste: the live catalogue holds 251
 * products but only 5 animals, so the animal rail was four cats drawing on
 * four photographs and repeated within one screen. The service tiles are
 * backed by 569 real centres and stay varied as the catalogue grows.
 *
 *   ۱. دسته‌بندی‌ها — خدمات first, because CATEGORY_GROUPS is ordered that way
 *   ۲. سرپرستی     — adoption, the part people pass on to each other
 *   ۳. محصولات     — the storefront, which needs no introduction
 */
export function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <AdoptionRail />
      <ProductRail />
      <FeaturedNearby />
      <CtaBanner />
    </>
  )
}
