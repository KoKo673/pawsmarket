import { asset } from '@/lib/utils'

/**
 * عکس واقعی هر محصول — کلید: نام دقیق محصول همان‌طور که در کاتالوگ
 * (Digikala + ترب) ثبت شده است.
 *
 * منبع: عکس همان محصول در بازارگاه واقعی، دانلود و بررسی‌شده
 * (scripts/download_product_images.py) و به‌صورت محلی سرو می‌شود.
 * اولویت نمایش: ۱) تصویر رکورد ۲) این نقشه ۳) تصویر پیش‌فرض دسته‌بندی.
 * تولید خودکار: scripts/seed_real_shops.py — دستی ویرایش نکنید.
 */
export const PRODUCT_IMAGES: Record<string, string> = {
  "بستنی گربه پرسا مدل Creamy با طعم شیر وزن 20 گرم": asset("images/products/real/155cf5af906059d6.jpg"),
  "تشویقی پرندگان مدل 001 وزن 60 گرم": asset("images/products/real/4451bfb02471710b.jpg"),
  "غذای خشک پرنده الی مدل Golden Pelet وزن 165 گرم بسته 3 عددی": asset("images/products/real/10ed50a262c92ee5.jpg"),
  "غذای عروس هلندی مدل پلت میوه ای وزن 200 گرم": asset("images/products/real/3ba67740dc979ef1.jpg"),
  "غذای قناری و بلبل مدلM وزن 250 گرم": asset("images/products/real/2eb0a9c726f5d7db.jpg"),
  "غذای قناری وبلبل مدل M وزن 500 گرم": asset("images/products/real/2eb0a9c726f5d7db.jpg"),
  "غذای قناری کد A35 وزن 500 گرم": asset("images/products/real/904cefb2d4dc64d0.jpg"),
  "غذای مخصوص قناری مدل SM وزن 250 گرم": asset("images/products/real/2eb0a9c726f5d7db.jpg"),
  "غذای پرنده مدل ارزن خوشه ای بسته شش عددی": asset("images/products/real/7037907c3434fefa.jpg"),
  "غذای پرنده مدل ارزن خوشه ای کد 20104 بسته 5 عددی": asset("images/products/real/227548668100c449.jpg"),
  "غذای پرنده مدل کرم میلورم خشک کد 070 وزن 70 گرم": asset("images/products/real/a79fd3374c5cdf69.jpg"),
  "قرص ضد انگل سگ و گربه اندوپت مدل B122 وزن 1 گرم": asset("images/products/real/3580810d4fe2ee6e.jpg"),
}
