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
  'غذای خشک سگ توله — ۳ کیلوگرم': asset('images/products/dog-food.jpg'),
  'کنسرو گوشت گربه — ۴۰۰ گرم': asset('images/products/cat-wet-food.jpg'),
  'تشویقی جویدنی طبیعی': asset('images/products/dog-treat.jpg'),
  'توپ جغجغه‌دار سگ': asset('images/products/dog-treat.jpg'),
  // قلاده/باکس/خرگوش هنوز عکس اختصاصیِ تأییدشده ندارند — تا آماده‌شدنِ
  // تصویر درست، نزدیک‌ترین عکسِ مرتبط و تأییدشده نشان داده می‌شود
  // (تصویر نامربوط بهتر از تصویر شکسته نیست، ولی این مورد موقتی است).
  'قلاده و بند چرمی سگ': asset('images/products/dog-treat.jpg'),
  'باکس حمل حیوان — سایز متوسط': asset('images/products/dog-bed.jpg'),
  'تخت طبی سگ — سایز متوسط': asset('images/products/dog-bed.jpg'),
  'اسکرچر و جای خواب گربه': asset('images/products/cat-scratcher.jpg'),
  'خاک بستر گربه — ۱۰ لیتر': asset('images/products/cat-litter.jpg'),
  // دانه‌ی پرنده، قفس و شامپو هنوز عکس تأییدشده‌ی خودشان را ندارند؛
  // فعلاً نزدیک‌ترین تصویر مرتبط نشان داده می‌شود تا عکس نامرتبط نباشد.
  'غذای خرگوش — ۲ کیلوگرم': asset('images/products/cat-food.jpg'),
  'دانه فنچ و قناری — ۹۰۰ گرم': asset('images/products/bird-toy.jpg'),
  'دانه ملکه پرنده — ۱ کیلوگرم': asset('images/products/bird-toy.jpg'),
  'قفس پرنده — سایز متوسط': asset('images/products/bird-toy.jpg'),
  'اسباب‌بازی پرنده': asset('images/products/bird-toy.jpg'),
  'آکواریوم سفره‌ای — ۶۰ سانتی': asset('images/products/aquarium.jpg'),
  'شیر خشک توله سگ — ۳۰۰ گرم': asset('images/products/dog-food.jpg'),
  'مکمل مفصل سگ — ۶۰ عدد': asset('images/products/dog-supplement.jpg'),
  'قطره ضدانگل گربه — ۳ میلی‌لیتر': asset('images/products/pet-brush.jpg'),
  'خمیر مکمل گربه — ۱۲۰ گرم': asset('images/products/cat-food.jpg'),
  'غذای درمانی کلیه گربه — ۲ کیلوگرم': asset('images/products/cat-wet-food.jpg'),
  'شامپوی دارویی ضدقارچ': asset('images/products/dog-bath.jpg'),
  'شامپوی خشک سگ': asset('images/products/dog-bath.jpg'),
  'برس ضد ریزش مو': asset('images/products/pet-brush.jpg'),
  'حوله حمام پت': asset('images/products/dog-towel.jpg'),
}
