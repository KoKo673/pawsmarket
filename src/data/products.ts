import { asset } from '@/lib/utils'

/**
 * عکس اختصاصی هر محصول — کلید: «نام دقیق محصول» همان‌طور که در
 * PRODUCT_TEMPLATES (scripts/seed_real_shops.py) ساخته می‌شود.
 *
 * منبع تصاویر: Wikimedia Commons / Openverse (دانلود و بازبینی بصری
 * شده‌اند — scripts/fetch_product_images.py). اولویت نمایش:
 *   ۱) تصویر خود رکورد (اگر بک‌اند ستون images داشت)
 *   ۲) این نقشه (عکس واقعی همان محصول)
 *   ۳) تصویر پیش‌فرض دسته‌بندی
 */
export const PRODUCT_IMAGES: Record<string, string> = {
  'غذای خشک سگ بالغ — ۱۲ کیلوگرم': asset('images/products/dog-food.jpg'),
  'غذای خشک گربه — ۲ کیلوگرم': asset('images/products/cat-food.jpg'),
  'تشویقی جویدنی طبیعی': asset('images/products/dog-treat.jpg'),
  'تخت طبی سگ — سایز متوسط': asset('images/products/dog-bed.jpg'),
  'خاک بستر گربه — ۱۰ لیتر': asset('images/products/cat-litter.jpg'),
  'دانه ملکه پرنده — ۱ کیلوگرم': asset('images/products/bird-seed.jpg'),
  'قفس پرنده — سایز متوسط': asset('images/products/bird-cage.jpg'),
  'اسباب‌بازی پرنده': asset('images/products/bird-toy.jpg'),
  'مکمل مفصل سگ — ۶۰ عدد': asset('images/products/dog-supplement.jpg'),
  'غذای درمانی کلیه گربه — ۲ کیلوگرم': asset('images/products/cat-diet.jpg'),
  'شامپوی دارویی ضدقارچ': asset('images/products/pet-shampoo.jpg'),
  'شامپوی خشک سگ': asset('images/products/dog-bath.jpg'),
  'برس ضد ریزش مو': asset('images/products/pet-brush.jpg'),
  'حوله حمام پت': asset('images/products/dog-towel.jpg'),
}
