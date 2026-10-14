/**
 * فیلدهای سنگین فروشگاه — فقط برای برگه‌ی جزئیات.
 *
 * `description` و `website` اینجا هستند نه در shops.ts: لیست هیچ‌کدام را
 * نمی‌خواند، و با هم ۴۷٪ حجم فایل اصلی بودند. جستجوی متنی هم دیگر به
 * توضیحات تکیه نمی‌کند (برچسب دسته و حوزه‌ها جایش را گرفته‌اند).
 * تولید خودکار: scripts/seed_real_shops.py — دستی ویرایش نکنید.
 */
export interface ShopDetail {
  description?: string
  website?: string
}

export const SHOP_DETAIL: Record<string, ShopDetail> = {
  "پانسیون قلعه حیوانات": {
    description: "«پانسیون قلعه حیوانات» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D9%82%D9%84%D8%B9%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJBSmDdgABjj8R-6RKRxF18jM",
  },
  "بستری و پانسیون حیوانات وت نست": {
    description: "«بستری و پانسیون حیوانات وت نست» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
  },
  "پانسیون دامپزشکی پناه": {
    description: "«پانسیون دامپزشکی پناه» — پانسیون و نگهداری حیوانات در خیابان کوثر سوم، کوچه باگهر، تهران، ستارخان؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
  },
  "پانسیون خانگی مریم": {
    description: "«پانسیون خانگی مریم» — پانسیون و نگهداری حیوانات در منطقه ۲؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D9%85%D8%B1%DB%8C%D9%85&query_place_id=ChIJ9diKHQABjj8RvhAoNyze7fw",
  },
  "پانسیون حیوانات خانه دوم": {
    description: "«پانسیون حیوانات خانه دوم» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D9%88%D9%85&query_place_id=ChIJC_qGD6kHjj8R2bXu7OoqTEY",
  },
  "آرایشگاه حیوانات خانگی غزل": {
    description: "«آرایشگاه حیوانات خانگی غزل» — پانسیون و نگهداری حیوانات در منطقه ۶؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D8%BA%D8%B2%D9%84&query_place_id=ChIJSYszRQABjj8RqtRW1bQ-hSo",
  },
  "پت شاپ ۱۱۵": {
    description: "«پت شاپ ۱۱۵» — پانسیون و نگهداری حیوانات در منطقه ۲؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DB%B1%DB%B1%DB%B5&query_place_id=ChIJ2xyPbQAHjj8R4vY_qretExY",
  },
  "لندینگ پت": {
    description: "«لندینگ پت» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%84%D9%86%D8%AF%DB%8C%D9%86%DA%AF%20%D9%BE%D8%AA&query_place_id=ChIJZzqqE4YHjj8RgiEpmy15OAc",
  },
  "پانسیون گربه آنجلا": {
    description: "«پانسیون گربه آنجلا» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%DA%AF%D8%B1%D8%A8%D9%87%20%D8%A2%D9%86%D8%AC%D9%84%D8%A7&query_place_id=ChIJDxZEVQADjj8R09g68XMTsmw",
  },
  "مععععععجییییید": {
    description: "«مععععععجییییید» — پانسیون و نگهداری حیوانات در منطقه ۲؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B9%D8%B9%D8%B9%D8%B9%D8%B9%D8%B9%D8%AC%DB%8C%DB%8C%DB%8C%DB%8C%DB%8C%D8%AF&query_place_id=ChIJvw-uSwAHjj8RS1A_sdtYop8",
  },
  "آرایش حیوانات یاشار": {
    description: "«آرایش حیوانات یاشار» — پانسیون و نگهداری حیوانات در خیابان ۲۲بهمن، کلینیک پت مدیکال؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%DB%8C%D8%A7%D8%B4%D8%A7%D8%B1&query_place_id=ChIJzVBbTAD9jT8RUyJmKHxSBS4",
  },
  "پانسیون گربه شریعتی": {
    description: "«پانسیون گربه شریعتی» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%DA%AF%D8%B1%D8%A8%D9%87%20%D8%B4%D8%B1%DB%8C%D8%B9%D8%AA%DB%8C&query_place_id=ChIJ85xCNQAFjj8R0jbwivSyua8",
  },
  "پانسیون گربه": {
    description: "«پانسیون گربه» — پانسیون و نگهداری حیوانات در خیابان ایوان مداین، پلاک ۶، تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
  },
  "پانسیون خانگی سگ و گربه لیموپت": {
    description: "«پانسیون خانگی سگ و گربه لیموپت» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
  },
  "پانسیون گربه نکو": {
    description: "«پانسیون گربه نکو» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%DA%AF%D8%B1%D8%A8%D9%87%20%D9%86%DA%A9%D9%88&query_place_id=ChIJW4gOYgAHjj8R-xb8RVtXKVs",
  },
  "پانسیون گربه سایمون کت": {
    description: "«پانسیون گربه سایمون کت» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%DA%AF%D8%B1%D8%A8%D9%87%20%D8%B3%D8%A7%DB%8C%D9%85%D9%88%D9%86%20%DA%A9%D8%AA&query_place_id=ChIJSZomYQD9jT8R8YlPqNuJAks",
  },
  "پانسیون حیوانات کلبه سبز": {
    description: "«پانسیون حیوانات کلبه سبز» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%DA%A9%D9%84%D8%A8%D9%87%20%D8%B3%D8%A8%D8%B2&query_place_id=ChIJxeFd6EEFjj8RcgCeRepSNDw",
  },
  "پانسیون سگ کوکولند": {
    description: "«پانسیون سگ کوکولند» — پانسیون و نگهداری حیوانات در منطقه ۲؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D8%B3%DA%AF%20%DA%A9%D9%88%DA%A9%D9%88%D9%84%D9%86%D8%AF&query_place_id=ChIJzfhSHQAHjj8RLDup6dmL_qY",
  },
  "پانسیون سگ مرتضی شکری": {
    description: "«پانسیون سگ مرتضی شکری» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D8%B3%DA%AF%20%D9%85%D8%B1%D8%AA%D8%B6%DB%8C%20%D8%B4%DA%A9%D8%B1%DB%8C&query_place_id=ChIJ5d7JJADjjT8RaQ2I0XxE19k",
  },
  "پانسیون لاله": {
    description: "«پانسیون لاله» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
  },
  "پانسیون گربه هتل میو": {
    description: "«پانسیون گربه هتل میو» — پانسیون و نگهداری حیوانات در تهران؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%DA%AF%D8%B1%D8%A8%D9%87%20%D9%87%D8%AA%D9%84%20%D9%85%DB%8C%D9%88&query_place_id=ChIJ66u1muADjj8RcvFrAH9R6VU",
  },
  "پانسیون آریا": {
    description: "«پانسیون آریا» — پانسیون و نگهداری حیوانات در منطقه ۱؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D8%A2%D8%B1%DB%8C%D8%A7&query_place_id=ChIJBUrBTWkFjj8RtgguUckLU3E",
  },
  "مجموعه پت استار": {
    description: "«مجموعه پت استار» — پانسیون و نگهداری حیوانات در منطقه ۱؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%AC%D9%85%D9%88%D8%B9%D9%87%20%D9%BE%D8%AA%20%D8%A7%D8%B3%D8%AA%D8%A7%D8%B1&query_place_id=ChIJLUnoYQAFjj8RgOl3cGKcS_k",
  },
  "پانسیون پرندگان نیلوفر": {
    description: "«پانسیون پرندگان نیلوفر» — پانسیون و نگهداری حیوانات در منطقه ۴؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D9%86%DB%8C%D9%84%D9%88%D9%81%D8%B1&query_place_id=ChIJNUtsbAAdjj8RsRKcnw3dlI4",
  },
  "هتل کانیس": {
    description: "«هتل کانیس» — پانسیون و نگهداری حیوانات در خیابان تقی کریمی، کوچه یاس  ۱۵، باغستان؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن.",
    website: "https://hotelcanis.ir/",
  },
  "پانکی اسپا": {
    description: "«پانکی اسپا» — آرایشگاه و استایل حیوانات خانگی در منطقه ۱۱؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D9%83%D9%8A%20%D8%A7%D8%B3%D9%BE%D8%A7&query_place_id=ChIJA4jM5KMBjj8RR0Rs0ecRaMg",
  },
  "آرایشگاه حیوانات چیکوپت": {
    description: "«آرایشگاه حیوانات چیکوپت» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%DA%86%DB%8C%DA%A9%D9%88%D9%BE%D8%AA&query_place_id=ChIJoXqPXwABjj8RMuzfPP4tm4E",
  },
  "آرایشگاه حیوانات خانگی ژیوان": {
    description: "«آرایشگاه حیوانات خانگی ژیوان» — آرایشگاه و استایل حیوانات خانگی در خیابان ولیعصر-بالاتر از چهارراه عباس آباد-جنب کوچه پردیس-واحد۱۰-طبقه همکف، پلاک ۲۰۹۳، تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
  },
  "آرایشگاه حیوانات خانگی اصلاح حیوانات": {
    description: "«آرایشگاه حیوانات خانگی اصلاح حیوانات» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D8%A7%D8%B5%D9%84%D8%A7%D8%AD%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJB0yTZAD_kT8RzvVGB6EmN6A",
  },
  "پت شاپ دلسا": {
    description: "«پت شاپ دلسا» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
  },
  "آرایشگاه حیوانات خانگی بیطار": {
    description: "«آرایشگاه حیوانات خانگی بیطار» — آرایشگاه و استایل حیوانات خانگی در منطقه ۷؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D8%A8%DB%8C%D8%B7%D8%A7%D8%B1&query_place_id=ChIJ_SOW8R8Djj8R20mM_k_rDFQ",
  },
  "آرایشگاه حیوانات خانگی شادی گرومینگ": {
    description: "«آرایشگاه حیوانات خانگی شادی گرومینگ» — آرایشگاه و استایل حیوانات خانگی در خیابان پارک، شهر تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
  },
  "آرایشگاه حیوانات فرامرز": {
    description: "«آرایشگاه حیوانات فرامرز» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%81%D8%B1%D8%A7%D9%85%D8%B1%D8%B2&query_place_id=ChIJEZgFCAD9jT8RLmpomjmLkmg",
  },
  "آرایشگاه حیوانات خانگی ادیس گروم": {
    description: "«آرایشگاه حیوانات خانگی ادیس گروم» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D8%A7%D8%AF%DB%8C%D8%B3%20%DA%AF%D8%B1%D9%88%D9%85&query_place_id=ChIJj7TwUwADjj8RKfu_kUurxsQ",
  },
  "آرایشگاه حیوانات خانگی سمیرا": {
    description: "«آرایشگاه حیوانات خانگی سمیرا» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D8%B3%D9%85%DB%8C%D8%B1%D8%A7&query_place_id=ChIJHxAt2PIHjj8RFg7IjxGzYR4",
  },
  "ارایشگاه حیوانات نور چشمی": {
    description: "«ارایشگاه حیوانات نور چشمی» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%86%D9%88%D8%B1%20%DA%86%D8%B4%D9%85%DB%8C&query_place_id=ChIJP-GMFwAFjj8RNEfJ3p8L6Vg",
  },
  "آرایشگاه حیوانات خانگی ویدپت": {
    description: "«آرایشگاه حیوانات خانگی ویدپت» — آرایشگاه و استایل حیوانات خانگی در خیابان نادری، تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=VIDPET%20%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D9%88%DB%8C%D8%AF%D9%BE%D8%AA&query_place_id=ChIJ21OTihf9jT8Rk_UEqkJcuY8",
  },
  "آرایشگاه حیوانات رسول فرجی": {
    description: "«آرایشگاه حیوانات رسول فرجی» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%B1%D8%B3%D9%88%D9%84%20%D9%81%D8%B1%D8%AC%DB%8C&query_place_id=ChIJlUJRTo0Hjj8Rg99LRd7fhUw",
  },
  "آرایشگاه حیوانات": {
    description: "«آرایشگاه حیوانات» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJ53GSspD9jT8RDWIYfDX6qEg",
  },
  "پت لند خدمات تخصصی آرایش حیوانات خانگی": {
    description: "«پت لند خدمات تخصصی آرایش حیوانات خانگی» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D9%84%D9%86%D8%AF%2099%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C&query_place_id=ChIJHSRyDsb9jT8RqHz_xI_xg7A",
  },
  "آرایشگاه حیوانات خانگی ( گرومینگ ) لیام": {
    description: "«آرایشگاه حیوانات خانگی ( گرومینگ ) لیام» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20(%20%DA%AF%D8%B1%D9%88%D9%85%DB%8C%D9%86%DA%AF%20)%20%D9%84%DB%8C%D8%A7%D9%85&query_place_id=ChIJ7WMHNgADjj8Rs_CMBL47vWo",
  },
  "آرایشگاه حیوانات خانگی": {
    description: "«آرایشگاه حیوانات خانگی» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C&query_place_id=ChIJdQz_JwADjj8Rs7sOom5V8wA",
  },
  "آرایشگاه حیوانات ماهی گلی": {
    description: "«آرایشگاه حیوانات ماهی گلی» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%85%D8%A7%D9%87%DB%8C%20%DA%AF%D9%84%DB%8C&query_place_id=ChIJGfBzIgADjj8RRmO7YnLPTmg",
  },
  "آرایشگاه قیچی پرنده": {
    description: "«آرایشگاه قیچی پرنده» — آرایشگاه و استایل حیوانات خانگی در خیابان مرکز خرید احتشامیه طبقه همکف، تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://instagram.com/flying.scissors?utm_medium=copy_link",
  },
  "اصلاح و شستشو حیوانات گرومینگ درین": {
    description: "«اصلاح و شستشو حیوانات گرومینگ درین» — آرایشگاه و استایل حیوانات خانگی در منطقه ۸؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%D8%B5%D9%84%D8%A7%D8%AD%20%D9%88%20%D8%B4%D8%B3%D8%AA%D8%B4%D9%88%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%DA%AF%D8%B1%D9%88%D9%85%DB%8C%D9%86%DA%AF%20%D8%AF%D8%B1%DB%8C%D9%86&query_place_id=ChIJybcXfQADjj8RPDb5OU3Ic7E",
  },
  "سالن اصلاح شستشوگرومینگ حیوانات درین": {
    description: "«سالن اصلاح شستشوگرومینگ حیوانات درین» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
  },
  "آرایشگاه حیوانات نانا (یکتا گرومر)": {
    description: "«آرایشگاه حیوانات نانا (یکتا گرومر)» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%86%D8%A7%D9%86%D8%A7%20(%DB%8C%DA%A9%D8%AA%D8%A7%20%DA%AF%D8%B1%D9%88%D9%85%D8%B1)&query_place_id=ChIJIZGNYM0V7T8RCsp6MRkv_-0",
  },
  "پرهام گرومر": {
    description: "«پرهام گرومر» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=Parham%20Groomer%20%D9%BE%D8%B1%D9%87%D8%A7%D9%85%20%DA%AF%D8%B1%D9%88%D9%85%D8%B1&query_place_id=ChIJGaQgetcFjj8R5eqbBSH24vA",
  },
  "پت استایلیست": {
    description: "«پت استایلیست» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%A7%D8%B3%D8%AA%D8%A7%DB%8C%D9%84%DB%8C%D8%B3%D8%AA&query_place_id=ChIJazEPHgAdjj8R9z3yRIDhCks",
  },
  "آرایشگاه حیوانات خانگی پت گالری": {
    description: "«آرایشگاه حیوانات خانگی پت گالری» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D9%BE%D8%AA%20%DA%AF%D8%A7%D9%84%D8%B1%DB%8C&query_place_id=ChIJ1wiwUwAFjj8Rn9sEl6dQV3Q",
  },
  "آرایشگاه حیوانات پوپو": {
    description: "«آرایشگاه حیوانات پوپو» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%BE%D9%88%D9%BE%D9%88&query_place_id=ChIJ7RAENKIFjj8RKbemSReo8g0",
  },
  "اصلاح و شستشوی حیوانات هانا": {
    description: "«اصلاح و شستشوی حیوانات هانا» — آرایشگاه و استایل حیوانات خانگی در تهران؛ حمام، اصلاح مو و کوتاه‌کردن ناخن.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%D8%B5%D9%84%D8%A7%D8%AD%20%D9%88%20%D8%B4%D8%B3%D8%AA%D8%B4%D9%88%DB%8C%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%87%D8%A7%D9%86%D8%A7&query_place_id=ChIJv-hoegDljT8RKogY-TFeQO8",
  },
  "میعاد گاه پیشو ها": {
    description: "«میعاد گاه پیشو ها» — پناهگاه حیوانات در منطقه ۷؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%DB%8C%D8%B9%D8%A7%D8%AF%20%DA%AF%D8%A7%D9%87%20%D9%BE%DB%8C%D8%B4%D9%88%20%D9%87%D8%A7&query_place_id=ChIJXQz-GAADjj8RKndOHn-6Y68",
  },
  "پت شاپ دهکده حیوانات": {
    description: "«پت شاپ دهکده حیوانات» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D9%87%DA%A9%D8%AF%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJdahBRwD9jT8RDkciXMXhidA",
  },
  "پتشاپ دهکده حیوانات": {
    description: "«پتشاپ دهکده حیوانات» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D8%B4%D8%A7%D9%BE%20%D8%AF%D9%87%DA%A9%D8%AF%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJd36kZAAHjT8RRg3d6O-WMoI",
  },
  "پت شاپ خانه حیوانات": {
    description: "«پت شاپ خانه حیوانات» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AE%D8%A7%D9%86%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJ9Sy6aQADjj8RqvYj5QD8mLg",
  },
  "مرکز توانبخشی حیوانات": {
    description: "«مرکز توانبخشی حیوانات» — پناهگاه حیوانات در ایوانک، منطقه ۲، تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B1%DA%A9%D8%B2%20%D8%AA%D9%88%D8%A7%D9%86%D8%A8%D8%AE%D8%B4%DB%8C%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJc1q1mtz9jT8RsTN-vqVIcfg",
  },
  "پت شاپ لکسی": {
    description: "«پت شاپ لکسی» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%DA%A9%D8%B3%DB%8C&query_place_id=ChIJz-MQfAD_jT8RLcNeQCFMvzY",
  },
  "پت شاپ شهرزاد": {
    description: "«پت شاپ شهرزاد» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B4%D9%87%D8%B1%D8%B2%D8%A7%D8%AF&query_place_id=ChIJCZkJXgAFjj8RURjB3XnR7zc",
  },
  "پانسیون آنیل": {
    description: "«پانسیون آنیل» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%D8%A2%D9%86%DB%8C%D9%84&query_place_id=ChIJVSfRuIEDjj8RJJzU4_HOrrQ",
  },
  "پت اسکایلوس خشایار هداوندی فرد (پناهگاه نیستیم)": {
    description: "«پت اسکایلوس خشایار هداوندی فرد (پناهگاه نیستیم)» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%A7%D8%B3%DA%A9%D8%A7%DB%8C%D9%84%D9%88%D8%B3%20%D8%AE%D8%B4%D8%A7%DB%8C%D8%A7%D8%B1%20%D9%87%D8%AF%D8%A7%D9%88%D9%86%D8%AF%DB%8C%20%D9%81%D8%B1%D8%AF%20(%D9%BE%D9%86%D8%A7%D9%87%DA%AF%D8%A7%D9%87%20%D9%86%DB%8C%D8%B3%D8%AA%DB%8C%D9%85)&query_place_id=ChIJURA2nr_9jT8RRLIHsr4Cub8",
  },
  "پت شاپ سیمو": {
    description: "«پت شاپ سیمو» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B3%DB%8C%D9%85%D9%88&query_place_id=ChIJV742RgADjj8RCI8uOMcqolA",
  },
  "پت شاپ پت سانی": {
    description: "«پت شاپ پت سانی» — پناهگاه حیوانات در منطقه ۳؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D8%B3%D8%A7%D9%86%DB%8C&query_place_id=ChIJa_B_uSoFjj8RXILhbF0hPl4",
  },
  "باغچه سجاد محمدی": {
    description: "«باغچه سجاد محمدی» — پناهگاه حیوانات در جاده نظامی جنب پمپ بنزین نظامی، جاده ورامین؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%D8%A7%D8%BA%DA%86%D9%87%20%D8%B3%D8%AC%D8%A7%D8%AF%20%D9%85%D8%AD%D9%85%D8%AF%DB%8C&query_place_id=ChIJjVDMaAD7kT8RT9eXQO_MFQk",
  },
  "دهکده مهربانی حیوانات چیتگر": {
    description: "«دهکده مهربانی حیوانات چیتگر» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
  },
  "پرورشگاه سگ": {
    description: "«پرورشگاه سگ» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%88%D8%B1%D8%B4%DA%AF%D8%A7%D9%87%20%D8%B3%DA%AF&query_place_id=ChIJbSSJKCHljT8RGSzDLG4cDFQ",
  },
  "پناهگاه حیوانات سوهانک": {
    description: "«پناهگاه حیوانات سوهانک» — پناهگاه حیوانات در تهران؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی.",
  },
  "پت شاپ اسنپ": {
    description: "«پت شاپ اسنپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%B3%D9%86%D9%BE&query_place_id=ChIJeZRGOjEBjj8RqTPHi1zOtWo",
  },
  "مینگو پت شاپ": {
    description: "مینگو پت‌شاپ — غذای خشک، کنسرو و پوچ سگ و گربه، تشویقی، باکس حمل و لوازم جانبی؛ سفارش غذای فله‌ای (به‌جز روزهای تعطیل ۹ تا ۱۹).",
    website: "https://mingo.pet",
  },
  "بورس قناری تهران (آراز)": {
    description: "«بورس قناری تهران (آراز)» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
  },
  "فروشگاه خزنده ایران": {
    description: "«فروشگاه خزنده ایران» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۰.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AE%D8%B2%D9%86%D8%AF%D9%87%20%D8%A7%DB%8C%D8%B1%D8%A7%D9%86&query_place_id=ChIJyYbbDe4Bjj8RqmmgDbojwUI",
  },
  "نمایشگاه قناری آراز": {
    description: "«نمایشگاه قناری آراز» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در خیابان نواب جنوب به شمال، نرسیده به آذربایجان، پلاک ۵۰۷، تهران.",
  },
  "بورس قناری تهران(پت شاپ آراز)": {
    description: "«بورس قناری تهران(پت شاپ آراز)» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در خیابان شکوفه، بورس قناری تهران  جنوب به شمال، بعد از.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%D9%88%D8%B1%D8%B3%20%D9%82%D9%86%D8%A7%D8%B1%DB%8C%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86(%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D8%B1%D8%A7%D8%B2)&query_place_id=ChIJ12L4HAABjj8RmIJUtX6_PtI",
  },
  "پت شاپ شاتوت": {
    description: "«پت شاپ شاتوت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B4%D8%A7%D8%AA%D9%88%D8%AA&query_place_id=ChIJbf9laRcBjj8RafWwpGqcxHc",
  },
  "پتشاپ بزرگ پت فودز": {
    description: "«پتشاپ بزرگ پت فودز» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بین تهران، خ نواب صفوی، کوچه فرهنگیان و مرتضوی)، جنب تیپاکس نواب پلاک ۶۹ واحد ۳، طبقه اول.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D8%B4%D8%A7%D9%BE%20%D8%A8%D8%B2%D8%B1%DA%AF%20%D9%BE%D8%AA%20%D9%81%D9%88%D8%AF%D8%B2&query_place_id=ChIJQ-eE5VoBjj8RIgvEx96rBUU",
  },
  "فروشگاه پرندگان وحدت": {
    description: "«فروشگاه پرندگان وحدت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D9%88%D8%AD%D8%AF%D8%AA&query_place_id=ChIJFxFbV_kBjj8RhAVY2QuK6no",
  },
  "فروشگاه ایران فیش اسپا": {
    description: "«فروشگاه ایران فیش اسپا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D8%A7%DB%8C%D8%B1%D8%A7%D9%86%20%D9%81%DB%8C%D8%B4%20%D8%A7%D8%B3%D9%BE%D8%A7&query_place_id=ChIJ32WMdFcAjj8RIgfrZ2GaDW0",
  },
  "پیکوپت": {
    description: "«پیکوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "ایران دیسکس": {
    description: "«ایران دیسکس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۰.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%DB%8C%D8%B1%D8%A7%D9%86%20%D8%AF%DB%8C%D8%B3%DA%A9%D8%B3&query_place_id=ChIJjUExE1cAjj8RKzyjSmfXDVI",
  },
  "پت شاپ کایرا": {
    description: "«پت شاپ کایرا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D8%A7%DB%8C%D8%B1%D8%A7&query_place_id=ChIJ_7vQTAABjj8RQu7jmBxxkgQ",
  },
  "زیستیران": {
    description: "«زیستیران» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B2%DB%8C%D8%B3%D8%AA%DB%8C%D8%B1%D8%A7%D9%86&query_place_id=ChIJmcdwY-UAjj8RR-no3MYWWJY",
  },
  "پت شاپ مریخ": {
    description: "«پت شاپ مریخ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D8%B1%DB%8C%D8%AE&query_place_id=ChIJs-CSWwABjj8Rr-72iMaCTWk",
  },
  "پرنده فروشی پارادایس": {
    description: "«پرنده فروشی پارادایس» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
  },
  "فروشگاه ماهی های آکواریومی ماهیران": {
    description: "«فروشگاه ماهی های آکواریومی ماهیران» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در خیابان مرتضوی، روبروی کوچه وثوق  ۳۱۰ یا ۱۸۰، شهر تهران.",
  },
  "خرگوش دو زبانه": {
    description: "«خرگوش دو زبانه» — عرضه‌ی غذای خرگوش، لوازم جوندگان در تهران.",
  },
  "شهر پرنده": {
    description: "«شهر پرنده» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
  },
  "پت شاپ و فودکورت پت نواب": {
    description: "«پت شاپ و فودکورت پت نواب» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%20%D9%81%D9%88%D8%AF%DA%A9%D9%88%D8%B1%D8%AA%20%D9%BE%D8%AA%20%D9%86%D9%88%D8%A7%D8%A8&query_place_id=ChIJLf1GdQABjj8RWRHSkzr54Xc",
  },
  "مترو پت شاپ نواب": {
    description: "«مترو پت شاپ نواب» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%AA%D8%B1%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%86%D9%88%D8%A7%D8%A8&query_place_id=ChIJK-krCgABjj8ROnRSoW9ePaE",
  },
  "پت شاپ برتر": {
    description: "«پت شاپ برتر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D8%B1%D8%AA%D8%B1&query_place_id=ChIJ-2h2d9cBjj8R_nKcvHlAyA0",
  },
  "پت شاپ اینترنتی غزال": {
    description: "«پت شاپ اینترنتی غزال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D8%BA%D8%B2%D8%A7%D9%84&query_place_id=ChIJdY9KMjABjj8RKw8cAsdAuX8",
  },
  "پت شاپ پتکال": {
    description: "«پت شاپ پتکال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%DA%A9%D8%A7%D9%84&query_place_id=ChIJxRDYc7oBjj8RkpTVxZ0nqAw",
  },
  "لوازم دامپروری و پت شاپ ایران دام": {
    description: "«لوازم دامپروری و پت شاپ ایران دام» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%84%D9%88%D8%A7%D8%B2%D9%85%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B1%D9%88%D8%B1%DB%8C%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D8%B1%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85&query_place_id=ChIJPR0k25sBjj8RM-6D_dSaOYI",
  },
  "پت شاپ مانیا": {
    description: "«پت شاپ مانیا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://maniapetshop98.com/",
  },
  "پت شاپ امین": {
    description: "«پت شاپ امین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، خیابان آزادی، خیابان اسکندری شمالی، پایین تر از چهارراه فرصت، جنب اداره پست، پلاک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D9%85%DB%8C%D9%86&query_place_id=ChIJ9eYoaCQBjj8RiWN7trF07oc",
  },
  "پت شاپ محمد": {
    description: "«پت شاپ محمد» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان احمد اسکندری شمالی، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D8%AD%D9%85%D8%AF&query_place_id=ChIJJQSst9oBjj8RQDrVE0kuTZc",
  },
  "پت شاپ حامد": {
    description: "«پت شاپ حامد» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AD%D8%A7%D9%85%D8%AF&query_place_id=ChIJZeIcYgABjj8R-NkSb_bVXbY",
  },
  "(پت شاپ پت مال)": {
    description: "«(پت شاپ پت مال)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=PetMall%20(%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%85%D8%A7%D9%84)&query_place_id=ChIJOW4Uk58Bjj8R0EUHzrHJQLA",
  },
  "پت شاپ پریسا": {
    description: "«پت شاپ پریسا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پتشاپ پارادایس": {
    description: "«پتشاپ پارادایس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D8%B1%D8%A7%D8%AF%D8%A7%DB%8C%D8%B3&query_place_id=ChIJfTIi7b8Bjj8RBoo3Uc36f0c",
  },
  "پت شاپ آنلاین زیست پت": {
    description: "«پت شاپ آنلاین زیست پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86%20%D8%B2%DB%8C%D8%B3%D8%AA%20%D9%BE%D8%AA&query_place_id=ChIJZdxI-yABjj8RDUD_ULmdr_I",
  },
  "پت شاپ رخ": {
    description: "«پت شاپ رخ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ آریل": {
    description: "«پت شاپ آریل» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D8%B1%DB%8C%D9%84&query_place_id=ChIJT8ZDbhQBjj8RcJkWcZMb5pg",
  },
  "پت شاپ وینا": {
    description: "«پت شاپ وینا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان امیرلو، نبش کوچه محمدی، میدان توحید.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%DB%8C%D9%86%D8%A7&query_place_id=ChIJnxKUZwABjj8RbanwT6cgRS8",
  },
  "دیجی پت": {
    description: "«دیجی پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%DB%8C%D8%AC%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJ62JsiDwBjj8RWoqfsyBw8sI",
  },
  "پت شاپ لاوینا": {
    description: "«پت شاپ لاوینا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان احمد اسکندری شمالی، تهران.",
  },
  "پت شاپ کالینا": {
    description: "«پت شاپ کالینا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%83%D8%A7%D9%84%D9%8A%D9%86%D8%A7&query_place_id=ChIJ1ZvNNAABjj8RUb1dgVJRphs",
  },
  "پت شاپ اینترنتی آرکوپت": {
    description: "«پت شاپ اینترنتی آرکوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D8%A2%D8%B1%DA%A9%D9%88%D9%BE%D8%AA&query_place_id=ChIJf8fOfAABjj8RPBD9uRLXrLs",
  },
  "قلاده داگ مارت": {
    description: "«قلاده داگ مارت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%82%D9%84%D8%A7%D8%AF%D9%87%20%D8%AF%D8%A7%DA%AF%20%D9%85%D8%A7%D8%B1%D8%AA&query_place_id=ChIJZ4TVBAABjj8RFdLEXQrOoPA",
  },
  "پت شاپ هانا": {
    description: "«پت شاپ هانا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۰.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%D8%A7%D9%86%D8%A7&query_place_id=ChIJSVjxYgABjj8Rw0eGoEVzksI",
  },
  "آرون پت شاپ": {
    description: "«آرون پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D9%88%D9%86%20%D9%BE%D8%AA%E2%80%8C%D8%B4%D8%A7%D9%BE&query_place_id=ChIJJf6bDQABjj8Rv2ldQOOZIGY",
  },
  "پت شاپ زوپت": {
    description: "«پت شاپ زوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B2%D9%88%D9%BE%D8%AA%20%7C%20Zopet&query_place_id=ChIJVfbTVQABjj8Rbrt3ntUYSuU",
  },
  "پت شاپ سینا": {
    description: "«پت شاپ سینا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B3%DB%8C%D9%86%D8%A7&query_place_id=ChIJ6RxrvaUBjj8R59aQfwHbVs8",
  },
  "لوازم یدکی افرودی": {
    description: "«لوازم یدکی افرودی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%84%D9%88%D8%A7%D8%B2%D9%85%20%DB%8C%D8%AF%DA%A9%DB%8C%20%D8%A7%D9%81%D8%B1%D9%88%D8%AF%DB%8C&query_place_id=ChIJz8v5UgABjj8RDDoYpC0jhWM",
  },
  "چیکن آیسبار میلاد": {
    description: "«چیکن آیسبار میلاد» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%86%DB%8C%DA%A9%D9%86%20%D8%A2%DB%8C%D8%B3%D8%A8%D8%A7%D8%B1%20%D9%85%DB%8C%D9%84%D8%A7%D8%AF&query_place_id=ChIJLdFELAABjj8RE0GgvCOf9Eg",
  },
  "لوپت": {
    description: "«لوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%84%D9%88%D9%BE%D8%AA&query_place_id=ChIJfeGKtsABjj8R269Uh6tytqY",
  },
  "پت شاپ پرستو 🐶": {
    description: "«پت شاپ پرستو 🐶» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%B1%D8%B3%D8%AA%D9%88%20%F0%9F%90%B6&query_place_id=ChIJM-eFEwABjj8RVWE-CSBtmwo",
  },
  "لیانا فیش": {
    description: "«لیانا فیش» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%84%DB%8C%D8%A7%D9%86%D8%A7%20%D9%81%DB%8C%D8%B4&query_place_id=ChIJPeFQwewBjj8RZ-DKofmlNps",
  },
  "پت شاپ ایران پرنده": {
    description: "«پت شاپ ایران پرنده» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D8%B1%D8%A7%D9%86%20%D9%BE%D8%B1%D9%86%D8%AF%D9%87&query_place_id=ChIJ8Zi2KX8Bjj8RO8VlwEoEIlI",
  },
  "هتل قناری": {
    description: "«هتل قناری» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "http://www.hotel-canary.com/canary/index.php/en/",
  },
  "سرای پر طلایی": {
    description: "«سرای پر طلایی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B3%D8%B1%D8%A7%DB%8C%20%D9%BE%D8%B1%20%D8%B7%D9%84%D8%A7%DB%8C%DB%8C&query_place_id=ChIJFa7VBgABjj8RE1-5sCBX1E8",
  },
  "پت شاپ اینترنتی پت اسپات": {
    description: "«پت شاپ اینترنتی پت اسپات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D9%BE%D8%AA%20%D8%A7%D8%B3%D9%BE%D8%A7%D8%AA&query_place_id=ChIJLcTDJq8Bjj8RK9Nzvl08jt8",
  },
  "پت شاپ اینترنتی جی جی لوپ": {
    description: "«پت شاپ اینترنتی جی جی لوپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، میدان بهارستان، خیابان صفی علیشاه، پلاک ۲۲، طبقه ۲، واحد ۶.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D8%AC%DB%8C%20%D8%AC%DB%8C%20%D9%84%D9%88%D9%BE&query_place_id=ChIJdc5FTFEBjj8RaHa_MNvVQOM",
  },
  "پت شاپ احسان شعبه": {
    description: "«پت شاپ احسان شعبه» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%AD%D8%B3%D8%A7%D9%86%20%D8%B4%D8%B9%D8%A8%D9%87%202%20petshop&query_place_id=ChIJEzXiPAAHjj8RlucFtlFu61k",
  },
  "اکواریوم فایترباز": {
    description: "«اکواریوم فایترباز» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D9%81%D8%A7%DB%8C%D8%AA%D8%B1%D8%A8%D8%A7%D8%B2&query_place_id=ChIJGZgnbLkBjj8RNXOtuG5BMVE",
  },
  "پت شاپ سی‌پت": {
    description: "«پت شاپ سی‌پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان منوچهری، تهران.",
  },
  "اسفند پت (پت شاپ)": {
    description: "«اسفند پت (پت شاپ)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پتشاپ ژیکو": {
    description: "«پتشاپ ژیکو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان سی ام.",
    website: "https://www.instagram.com/zhiko.petshop",
  },
  "ژوکی پت": {
    description: "«ژوکی پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان ببری.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%98%D9%88%DA%A9%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJjeVTDQABjj8Rv_W_uEpAtgA",
  },
  "پت مارکت": {
    description: "«پت مارکت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D9%85%D8%A7%D8%B1%DA%A9%D8%AA&query_place_id=ChIJQxGlJQABjj8RDnHTCNyHxAw",
  },
  "پت شاپ اینترنتی پتی مون": {
    description: "«پت شاپ اینترنتی پتی مون» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D9%BE%D8%AA%DB%8C%20%D9%85%D9%88%D9%86&query_place_id=ChIJr7chJlsDjj8Rl4ftaH9TfTo",
  },
  "پت شاپ لاوِتا": {
    description: "«پت شاپ لاوِتا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=luvetta%20petshop%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D8%A7%D9%88%D9%90%D8%AA%D8%A7&query_place_id=ChIJPVSFLwABjj8RDdv5NsEZZQA",
  },
  "هپی پت فود": {
    description: "«هپی پت فود» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%87%D9%BE%DB%8C%20%D9%BE%D8%AA%20%D9%81%D9%88%D8%AF%20Happy%20pet%20food&query_place_id=ChIJIV3aHAAHjj8RBoN9j9b0_XA",
  },
  "پت شاپ همدم": {
    description: "«پت شاپ همدم» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%D9%85%D8%AF%D9%85&query_place_id=ChIJoTBDOAAHjj8RF-byUl5BdmM",
  },
  "پت شاپ دلسا۲": {
    description: "«پت شاپ دلسا۲» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۷.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D9%84%D8%B3%D8%A7%DB%B2&query_place_id=ChIJfbrTOgABjj8RsXV5ZyW1z18",
  },
  "پت شاپ و پرنده سرای کلبه": {
    description: "«پت شاپ و پرنده سرای کلبه» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%20%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D8%B3%D8%B1%D8%A7%DB%8C%20%DA%A9%D9%84%D8%A8%D9%87&query_place_id=ChIJc30N_ksHjj8RjUc6xI7BZNk",
  },
  "پت شاپ تاپ کات": {
    description: "«پت شاپ تاپ کات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AA%D8%A7%D9%BE%20%DA%A9%D8%A7%D8%AA&query_place_id=ChIJwXr2xjAHjj8RloyVpcoBWGI",
  },
  "پت شاپ شاپرک": {
    description: "«پت شاپ شاپرک» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B4%D8%A7%D9%BE%D8%B1%DA%A9&query_place_id=ChIJK0NNsggDjj8RlMq3b-BGYk0",
  },
  "پت شاپ ستارگان حیوانات": {
    description: "«پت شاپ ستارگان حیوانات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان شریعتی، نرسیده به سه راه، پت شاپ ستارگان حیوانات پلاک ۱۸۲ پایین تر از گروسی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B3%D8%AA%D8%A7%D8%B1%DA%AF%D8%A7%D9%86%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJ3TpXnfkDjj8R6LVkhlJ6gQw",
  },
  "پت شاپ مشاهیر": {
    description: "«پت شاپ مشاهیر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان مشاهیر، پلاک ۷۲، تهران.",
    website: "https://mashahirpetshop.ir/",
  },
  "پت شاپ سیمبا": {
    description: "«پت شاپ سیمبا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B3%DB%8C%D9%85%D8%A8%D8%A7&query_place_id=ChIJ8wUBXwAHjj8RMXPP06L850M",
  },
  "پرنده فروشی یدک": {
    description: "«پرنده فروشی یدک» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D9%81%D8%B1%D9%88%D8%B4%DB%8C%20%DB%8C%D8%AF%DA%A9&query_place_id=ChIJS32cl-cBjj8R7kV7WPDByRc",
  },
  "پت شاپ هایپر پت غرب": {
    description: "«پت شاپ هایپر پت غرب» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%D8%A7%DB%8C%D9%BE%D8%B1%20%D9%BE%D8%AA%20%D8%BA%D8%B1%D8%A8&query_place_id=ChIJ_UGOXAAHjj8R4HUMvagW_sk",
  },
  "پت شاپ فندق": {
    description: "«پت شاپ فندق» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان تهران، ستارخان، بازار سنتی، فاز ۴، طبقه اول، پلاک ۴/۳۰۱، تهران.",
    website: "https://asnafyab.ir/09196553055",
  },
  "پت شاپ رازان شعبه ولیعصر": {
    description: "«پت شاپ رازان شعبه ولیعصر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خط ویژه پلاک ۲۱۵٨ بالاتر از بهشتی سمت.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D8%A7%D8%B2%D8%A7%D9%86%20%D8%B4%D8%B9%D8%A8%D9%87%20%D9%88%D9%84%DB%8C%D8%B9%D8%B5%D8%B1&query_place_id=ChIJuVW7eQABjj8RKlzZazi52g0",
  },
  "پت شاپ امیر": {
    description: "«پت شاپ امیر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D9%85%DB%8C%D8%B1&query_place_id=ChIJxTWy0N0Djj8Rn4gtmNDe6lE",
  },
  "پت شاپ آنلاین پشیله": {
    description: "«پت شاپ آنلاین پشیله» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در طبقه ششم، واحد ۳۷ خیابان دانشگاه هوایی شمالی، پلاک ابتدای مجتمع اداری افرا.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86%20%D9%BE%D8%B4%DB%8C%D9%84%D9%87&query_place_id=ChIJE-cgQgD_jT8Ris0mnL_ccqY",
  },
  "پت شاپ احسان": {
    description: "«پت شاپ احسان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، خیابان ستارخان.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%AD%D8%B3%D8%A7%D9%86&query_place_id=ChIJG1rszpUHjj8RuHoEvYmqAyc",
  },
  "فندوق پت شاپ": {
    description: "«فندوق پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "اکواریوم ستاره": {
    description: "«اکواریوم ستاره» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D8%B3%D8%AA%D8%A7%D8%B1%D9%87&query_place_id=ChIJL5MGumn_jT8RnjRGRGbksew",
  },
  "پت شاپ": {
    description: "«پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20B%26A&query_place_id=ChIJm9EGWwADjj8RM_a0xOTLhws",
  },
  "پت شاپ جانا": {
    description: "«پت شاپ جانا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AC%D8%A7%D9%86%D8%A7&query_place_id=ChIJga4IMwADjj8RfY19hFU6bhU",
  },
  "تهران دیسکس": {
    description: "«تهران دیسکس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20%D8%AF%D9%8A%D8%B3%D9%83%D8%B3&query_place_id=ChIJK0P2_FgHjj8RfHGJtqSwTqY",
  },
  "ماه پت": {
    description: "«ماه پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%A7%D9%87%20%D9%BE%D8%AA&query_place_id=ChIJzVY3JgAHjj8Rxl7tttKqXqo",
  },
  "پت شاپ نازی اباد": {
    description: "«پت شاپ نازی اباد» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در چمن (خدایاری).",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%86%D8%A7%D8%B2%DB%8C%20%D8%A7%D8%A8%D8%A7%D8%AF&query_place_id=ChIJn_RbIwD_kT8RJsJrSaKREJk",
  },
  "پت شاپ پاپوک": {
    description: "«پت شاپ پاپوک» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D9%BE%D9%88%DA%A9&query_place_id=ChIJRUAyBJb9jT8R_5a9gioGzDs",
  },
  "پرنده سرای سیلور": {
    description: "«پرنده سرای سیلور» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
  },
  "پت شاپ شارک": {
    description: "«پت شاپ شارک» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B4%D8%A7%D8%B1%DA%A9&query_place_id=ChIJlU9F4sMDjj8RRHLbZxIUrMc",
  },
  "پت شاپ پوپیا": {
    description: "«پت شاپ پوپیا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D9%88%D9%BE%DB%8C%D8%A7&query_place_id=ChIJC0N1EgADjj8RISA6NxlHx5w",
  },
  "پت شاپ درنا": {
    description: "«پت شاپ درنا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D8%B1%D9%86%D8%A7&query_place_id=ChIJJzAuggf9jT8REmzOpOhkdvw",
  },
  "پت شاپ کاراکال": {
    description: "«پت شاپ کاراکال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D8%A7%D8%B1%D8%A7%DA%A9%D8%A7%D9%84&query_place_id=ChIJr4LT0FgHjj8RI0qBmutiDSI",
  },
  "پت شاپ و پرنده سرای مرغ سحر": {
    description: "«پت شاپ و پرنده سرای مرغ سحر» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%20%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D8%B3%D8%B1%D8%A7%DB%8C%20%D9%85%D8%B1%D8%BA%20%D8%B3%D8%AD%D8%B1&query_place_id=ChIJbyMxSzYDjj8R6KNZ1FCz0hc",
  },
  "پت شاپ رازان": {
    description: "«پت شاپ رازان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D8%A7%D8%B2%D8%A7%D9%86&query_place_id=ChIJXXfGc9wDjj8RA3KxuN72Kiw",
  },
  "پت شاپ راشا": {
    description: "«پت شاپ راشا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D8%A7%D8%B4%D8%A7&query_place_id=ChIJ9QVWFAADjj8Rmd7efPkGZU8",
  },
  "پت شاپ محسن": {
    description: "«پت شاپ محسن» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ پاپی": {
    description: "«پت شاپ پاپی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D9%BE%DB%8C&query_place_id=ChIJ09SKPgADjj8RYv69xcKVC3U",
  },
  "پت شاپ کیان": {
    description: "«پت شاپ کیان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان فلکه اول صادقیه، تهران.",
    website: "t.me/iran_pet_shop",
  },
  "پت شاپ لوپر": {
    description: "«پت شاپ لوپر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D9%88%D9%BE%D8%B1&query_place_id=ChIJLWtKy7f_kT8RaeZgj6dE0uM",
  },
  "ونوس پت": {
    description: "«ونوس پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%88%D9%86%D9%88%D8%B3%20%D9%BE%D8%AA&query_place_id=ChIJzes6LgD_jT8RuPReMncTEOU",
  },
  "پت شاپ آپاوت": {
    description: "«پت شاپ آپاوت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%E2%80%8C%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%BE%D8%A7%D9%88%D8%AA&query_place_id=ChIJJz6ePAADjj8RhCnMriucsgs",
  },
  "پت شاپ بانی": {
    description: "«پت شاپ بانی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در محلاتی خیابان مخبر شمالی انتهای خطیبی نیا خ سرهنگ آبادی ک کجداریان پلاک ۵ طبقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D8%A7%D9%86%DB%8C&query_place_id=ChIJK5l7L5f9kT8R1U6xgPhq2iw",
  },
  "پت شاپ پلنگ صورتی": {
    description: "«پت شاپ پلنگ صورتی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ ترنج": {
    description: "«پت شاپ ترنج» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AA%D8%B1%D9%86%D8%AC&query_place_id=ChIJucYWJQD9kT8RCb1_EOOoHOw",
  },
  "کلارا پروت": {
    description: "«کلارا پروت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "آکواریوم برمودا ۱": {
    description: "«آکواریوم برمودا ۱» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در منطقه ۱۴.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D8%A8%D8%B1%D9%85%D9%88%D8%AF%D8%A7%20%DB%B1&query_place_id=ChIJxajrtCP9kT8RDvjbH9VPWHs",
  },
  "گلدین مقدم دانا": {
    description: "«گلدین مقدم دانا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%AF%D9%84%D8%AF%DB%8C%D9%86%20%D9%85%D9%82%D8%AF%D9%85%20%D8%AF%D8%A7%D9%86%D8%A7&query_place_id=ChIJq2igFYv9kT8RXyNqBmphicQ",
  },
  "پرنده سرای طوقی": {
    description: "«پرنده سرای طوقی» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در منطقه ۱۹.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D8%B3%D8%B1%D8%A7%DB%8C%20%D8%B7%D9%88%D9%82%DB%8C&query_place_id=ChIJ8_qJnmD_kT8RMLowg7YkLPo",
  },
  "/ پت شاپ": {
    description: "«/ پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در مرزداران خیابان زاگرس، پاساژ پردیسان، پت شاپ مرزداران فرزام پت.",
    website: "https://www.google.com/maps/search/?api=1&query=Farzam%20pet%20%2F%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE&query_place_id=ChIJaw1LbwAHjj8RU5cW4be7uPU",
  },
  "فروشگاه آکواریوم آکواسیلور": {
    description: "«فروشگاه آکواریوم آکواسیلور» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D8%A2%DA%A9%D9%88%D8%A7%D8%B3%DB%8C%D9%84%D9%88%D8%B1&query_place_id=ChIJXScZfN3_jT8R8K2hRBhKHcg",
  },
  "آکواریوم برکه": {
    description: "«آکواریوم برکه» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D8%A8%D8%B1%DA%A9%D9%87&query_place_id=ChIJsWXtY0H-kT8RE0mNae3qR6I",
  },
  "پت شاپ تهران طوطی": {
    description: "«پت شاپ تهران طوطی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان پلیس، خیابان اجاره دار، نرسیده به کوچه اقبالی، جنب فروشگاه جانبو، پلاک ۴۰۹.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20%D8%B7%D9%88%D8%B7%DB%8C&query_place_id=ChIJjf0UIAADjj8Ry6LSlkt6ZBo",
  },
  "پت شاپ پرنده فروشی": {
    description: "«پت شاپ پرنده فروشی» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در منطقه ۱۴.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D9%81%D8%B1%D9%88%D8%B4%DB%8C&query_place_id=ChIJW5XKAQD9kT8RAkT58D-e3CI",
  },
  "نیترو پت شاپ": {
    description: "«نیترو پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%86%DB%8C%D8%AA%D8%B1%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE&query_place_id=ChIJs8ZdOQADjj8Rwn3k2yt2lN8",
  },
  "پت شاپ رویال پت": {
    description: "«پت شاپ رویال پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان کلینی، شهر تهران.",
  },
  "پت شاپ لوسی": {
    description: "«پت شاپ لوسی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، خیابان میثاق.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D9%88%D8%B3%DB%8C&query_place_id=ChIJj3_KPT3_kT8RWr1HjILxKyE",
  },
  "پت شاپ لیو": {
    description: "«پت شاپ لیو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان سید جمال الدین اسدآبادی، تهران.",
    website: "https://leopetshop14.ir",
  },
  "پرشین دیسکس": {
    description: "«پرشین دیسکس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، منطقه ۱۴، خیابان عجب گل.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D8%B4%DB%8C%D9%86%20%D8%AF%DB%8C%D8%B3%DA%A9%D8%B3&query_place_id=ChIJPS3IgYH9kT8RvqioXjMP9wY",
  },
  "پت پارس": {
    description: "«پت پارس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%E2%80%8C%20%D9%BE%D8%A7%D8%B1%D8%B3&query_place_id=ChIJiypOX5f9jT8R9rStliZv7B4",
  },
  "پرنده پرطلایی امیر": {
    description: "«پرنده پرطلایی امیر» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در خیابان ناز، تهران.",
  },
  "پت شاپ هوما": {
    description: "«پت شاپ هوما» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%D9%88%D9%85%D8%A7&query_place_id=ChIJL8-4UgADjj8Rtp6YJp7YC5U",
  },
  "پت شاپ استار": {
    description: "«پت شاپ استار» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%B3%D8%AA%D8%A7%D8%B1&query_place_id=ChIJea9XeQD_kT8RWkCN1nP_nAw",
  },
  "پت شاپ این برا کیه؟": {
    description: "«پت شاپ این برا کیه؟» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%20%D8%A8%D8%B1%D8%A7%20%DA%A9%DB%8C%D9%87%D8%9F&query_place_id=ChIJ9znBcQD_jT8Rkhh_xGjwY2Y",
  },
  "پرندگان زینتی شاکری": {
    description: "«پرندگان زینتی شاکری» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D8%B2%DB%8C%D9%86%D8%AA%DB%8C%20%D8%B4%D8%A7%DA%A9%D8%B1%DB%8C&query_place_id=ChIJf9EMSgD9kT8RLrYZW6fgDLg",
  },
  "پت شاپ رایا": {
    description: "«پت شاپ رایا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D8%A7%DB%8C%D8%A7&query_place_id=ChIJmQ2RNAADjj8RmBMLCO83GaU",
  },
  "پت شاپ پت مارکت حیوانات": {
    description: "«پت شاپ پت مارکت حیوانات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در ۱۷ شهریور، پلاک جنوبی، بعد از چهارراه منصور (رضایی) لاین جنوب به شمال پ۹۳ پت مارکت حیوانات.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%85%D8%A7%D8%B1%DA%A9%D8%AA%20%D8%AD%D9%8A%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJ5TaDR479kT8R5hA8AnaHYCA",
  },
  "پت شاپ میلانو": {
    description: "«پت شاپ میلانو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خ عشقیار(نیلوفر)، بین کوچه ۱۰ و ۱۲ پلاک ۹۴.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%DB%8C%D9%84%D8%A7%D9%86%D9%88&query_place_id=ChIJ9Qxrj7EDjj8RIGUACOnWgLU",
  },
  "آریاآکادمی": {
    description: "«آریاآکادمی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%DB%8C%D8%A7%D8%A2%DA%A9%D8%A7%D8%AF%D9%85%DB%8C%20Aria%20Academy&query_place_id=ChIJjSAWZEv-kT8RZAuLk1UeYN0",
  },
  "آکوآ پت شاپ آریا": {
    description: "«آکوآ پت شاپ آریا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A2%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D8%B1%DB%8C%D8%A7%20Aria%20pet%20shop&query_place_id=ChIJGYmMsrD_kT8RCwc5VQsgtRw",
  },
  "آکواریوم آبشار": {
    description: "«آکواریوم آبشار» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در منطقه ۱۹.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D8%A2%D8%A8%D8%B4%D8%A7%D8%B1&query_place_id=ChIJ0dmrDgf_kT8RWIIleNW7bs4",
  },
  "پت شاپ تام و جری اکباتان": {
    description: "«پت شاپ تام و جری اکباتان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان عظیمی، پلاک ۱۷، تهران.",
  },
  "پرورش قناری معین حسینی": {
    description: "«پرورش قناری معین حسینی» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در منطقه ۱۴.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%88%D8%B1%D8%B4%20%D9%82%D9%86%D8%A7%D8%B1%DB%8C%20%D9%85%D8%B9%DB%8C%D9%86%20%D8%AD%D8%B3%DB%8C%D9%86%DB%8C&query_place_id=ChIJN1ftlXsDjj8Rqilo49JUXlI",
  },
  "پرنده سرای امیرعلی": {
    description: "«پرنده سرای امیرعلی» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D8%B3%D8%B1%D8%A7%DB%8C%20%D8%A7%D9%85%DB%8C%D8%B1%D8%B9%D9%84%DB%8C&query_place_id=ChIJf53zDwD_kT8RH_tHB8RTuqI",
  },
  "پت شاپ آژین،پت شاپ ژولی پولی": {
    description: "«پت شاپ آژین،پت شاپ ژولی پولی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%DA%98%DB%8C%D9%86%D8%8C%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%98%D9%88%D9%84%DB%8C%20%D9%BE%D9%88%D9%84%DB%8C&query_place_id=ChIJS-W0JgAHjj8RpeTULnzT32Y",
  },
  "دنیای پرنده": {
    description: "«دنیای پرنده» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D9%86%DB%8C%D8%A7%DB%8C%20%D9%BE%D8%B1%D9%86%D8%AF%D9%87&query_place_id=ChIJvb-ovUD_kT8RDilP1FA6oY4",
  },
  "مستر پت شاپ": {
    description: "«مستر پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان هویزه، پلاک ۴۷، تهران.",
  },
  "پت شاپ وانیاپت": {
    description: "«پت شاپ وانیاپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۷.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%D8%A7%D9%86%DB%8C%D8%A7%D9%BE%D8%AA&query_place_id=ChIJlabjZQADjj8R7ObiRTtq_xM",
  },
  "لوازم پرندگان زینتی سام برد 2": {
    description: "«لوازم پرندگان زینتی سام برد 2» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پخش اکسسوری و غذای حیوانات خانگی (mgh group)": {
    description: "«پخش اکسسوری و غذای حیوانات خانگی (mgh group)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۳.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AE%D8%B4%20%D8%A7%DA%A9%D8%B3%D8%B3%D9%88%D8%B1%DB%8C%20%D9%88%20%D8%BA%D8%B0%D8%A7%DB%8C%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20(mgh%20group)&query_place_id=ChIJkUpsBQADjj8RwI08MGb2bGQ",
  },
  "قفس حسینی": {
    description: "«قفس حسینی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، میدان بروجردی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%82%D9%81%D8%B3%20%D8%AD%D8%B3%DB%8C%D9%86%DB%8C&query_place_id=ChIJ4cyMwFQDjj8RQ7vdglsI0-M",
  },
  "پت شاپ چیکو اکباتان": {
    description: "«پت شاپ چیکو اکباتان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Ekbatan%20Chico%20Petshop%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%86%DB%8C%DA%A9%D9%88%20%D8%A7%DA%A9%D8%A8%D8%A7%D8%AA%D8%A7%D9%86&query_place_id=ChIJV-0Il7b9jT8RbvFphYzdSK8",
  },
  "پت شاپ حامیان پت": {
    description: "«پت شاپ حامیان پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AD%D8%A7%D9%85%DB%8C%D8%A7%D9%86%20%D9%BE%D8%AA&query_place_id=ChIJVWXRAQD9jT8RZRITXInGDhA",
  },
  "پت شاپ پت هاوس": {
    description: "«پت شاپ پت هاوس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=Pet%20house%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%87%D8%A7%D9%88%D8%B3&query_place_id=ChIJszV78sEHjj8R34NYFYBstWI",
  },
  "قناری افشین داوری": {
    description: "«قناری افشین داوری» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%82%D9%86%D8%A7%D8%B1%DB%8C%20%D8%A7%D9%81%D8%B4%DB%8C%D9%86%20%D8%AF%D8%A7%D9%88%D8%B1%DB%8C&query_place_id=ChIJJ9-TJQADjj8RcQTzaTIP5zo",
  },
  "فروشگاه پت شاپ آوا": {
    description: "«فروشگاه پت شاپ آوا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۸.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%88%D8%A7&query_place_id=ChIJQ7aWAQD_jT8RbrGUZ3GPnHs",
  },
  "فروشگاه پرندگان سیلور": {
    description: "«فروشگاه پرندگان سیلور» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D8%B3%DB%8C%D9%84%D9%88%D8%B1&query_place_id=ChIJV1-VTgADjj8R4Yk0HthViSg",
  },
  "( مجموعه طوطی سانان )": {
    description: "«( مجموعه طوطی سانان )» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=EG-Parrot%20(%20%D9%85%D8%AC%D9%85%D9%88%D8%B9%D9%87%20%D8%B7%D9%88%D8%B7%DB%8C%20%D8%B3%D8%A7%D9%86%D8%A7%D9%86%20EG%20)&query_place_id=ChIJQZulGDcHjj8R3sqXUcg80P4",
  },
  "ماکیان خاص": {
    description: "«ماکیان خاص» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%A7%DA%A9%DB%8C%D8%A7%D9%86%20%D8%AE%D8%A7%D8%B5&query_place_id=ChIJS5k9oS__kT8RNEzV1uHawlg",
  },
  "افسانه حیوانات": {
    description: "«افسانه حیوانات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Storypet%20%D8%A7%D9%81%D8%B3%D8%A7%D9%86%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJhaYEGQAHjj8R_uPSSd_Deao",
  },
  "پت شاپ اکسیژن تهران": {
    description: "«پت شاپ اکسیژن تهران» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DA%A9%D8%B3%DB%8C%DA%98%D9%86%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86&query_place_id=ChIJx9kfZgADjj8RRxR4AvmzTJ8",
  },
  "پرنده سرای رضا": {
    description: "«پرنده سرای رضا» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D8%B3%D8%B1%D8%A7%DB%8C%20%D8%B1%D8%B6%D8%A7&query_place_id=ChIJc66oeAD_jT8RLiFkD-aRCgU",
  },
  "پت شاپ آرپوپت": {
    description: "«پت شاپ آرپوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۳.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D8%B1%D9%BE%D9%88%D9%BE%D8%AA&query_place_id=ChIJ9frhSAAHjj8Rq07lLiBQDjU",
  },
  "پت شاپ پت فایو": {
    description: "«پت شاپ پت فایو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%81%D8%A7%DB%8C%D9%88&query_place_id=ChIJO3IVWwAFjj8Rx_3o4CE1hT0",
  },
  "دفتر فروش پت باکس": {
    description: "«دفتر فروش پت باکس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D9%81%D8%AA%D8%B1%20%D9%81%D8%B1%D9%88%D8%B4%20%D9%BE%D8%AA%20%D8%A8%D8%A7%DA%A9%D8%B3&query_place_id=ChIJrUf4l9cHjj8RVcHddVjAw38",
  },
  "پت شاپ استاد فیفو": {
    description: "«پت شاپ استاد فیفو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بالاتر از پل سیدخندان، بین مسجد و یارندی، پلاک ۸۷۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%B3%D8%AA%D8%A7%D8%AF%20%D9%81%DB%8C%D9%81%D9%88&query_place_id=ChIJV04mNAADjj8RY5vntLxkrtU",
  },
  "پت شاپ جردن": {
    description: "«پت شاپ جردن» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان نگار، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AC%D8%B1%D8%AF%D9%86%20-%20%D8%B3%D8%A7%D8%B9%DB%8C&query_place_id=ChIJUy-7IAAHjj8R2rpPlREGr4E",
  },
  "پت شاپ رگدال": {
    description: "«پت شاپ رگدال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۳.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%DA%AF%D8%AF%D8%A7%D9%84&query_place_id=ChIJIW9jLgAHjj8RHVrudlXLcY4",
  },
  "پت شاد": {
    description: "«پت شاد» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ مسیح": {
    description: "«پت شاپ مسیح» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۸.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D8%B3%DB%8C%D8%AD&query_place_id=ChIJ41YUOzADjj8RX9RN4r6HbFA",
  },
  "پت شاپ شهرپت": {
    description: "«پت شاپ شهرپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B4%D9%87%D8%B1%D9%BE%D8%AA&query_place_id=ChIJW2pxSB0Fjj8RUW3ZHN_jVpg",
  },
  "فروشگاه تهران": {
    description: "«فروشگاه تهران» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بلوار پاسدار گمنام، بین قیام و نبرد، پلاک ۶۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20110%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86&query_place_id=ChIJe9IphnoBjj8RwVtUI3k_eJA",
  },
  "پرندگان طلایه شومالی": {
    description: "«پرندگان طلایه شومالی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، تهران، خیابان پیروزی، نبرد شمالی، پایینتر از چهار راه ایمه اطهار، نرسیده به بانک رفاه و ملی، خیابان پیروزی، پلاک ۱۹۶.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D8%B7%D9%84%D8%A7%DB%8C%D9%87%20%D8%B4%D9%88%D9%85%D8%A7%D9%84%DB%8C&query_place_id=ChIJP-7F6wADjj8R49_wu6XGfQw",
  },
  "داروخانه و پت شاپ سانا": {
    description: "«داروخانه و پت شاپ سانا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان هشتم شرقی، پلاک ۳، تهران.",
  },
  "پت شاپ میراندا": {
    description: "«پت شاپ میراندا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%DB%8C%D8%B1%D8%A7%D9%86%D8%AF%D8%A7&query_place_id=ChIJ0Zzug9IDjj8RhPTH2pMk4yE",
  },
  "پت شاپ آنلاین پرواز": {
    description: "«پت شاپ آنلاین پرواز» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86%20%D9%BE%D8%B1%D9%88%D8%A7%D8%B2&query_place_id=ChIJcdrRFgD9kT8R4zk9SjcG764",
  },
  "پت شاپ رنگو": {
    description: "«پت شاپ رنگو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D9%86%DA%AF%D9%88&query_place_id=ChIJrS0ORwADjj8RuwX-p7cQczo",
  },
  "پت شاپ رویال": {
    description: "«پت شاپ رویال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان پیروزی پلاک پرستار.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D9%88%DB%8C%D8%A7%D9%84&query_place_id=ChIJUd4fEgD9kT8RKQ-yTVExxOk",
  },
  "پت شاپ پشمالوها": {
    description: "«پت شاپ پشمالوها» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۴.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%B4%D9%85%D8%A7%D9%84%D9%88%D9%87%D8%A7&query_place_id=ChIJxXPBAQAdjj8REd2qZtuL1_s",
  },
  "پت شاپ زی پت لند": {
    description: "«پت شاپ زی پت لند» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Zee%20Petland%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B2%DB%8C%20%D9%BE%D8%AA%20%D9%84%D9%86%D8%AF&query_place_id=ChIJiZaYN6oHjj8Ry9pnH7GDoTQ",
  },
  "پت شاپ یوپت": {
    description: "«پت شاپ یوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DB%8C%D9%88%D9%BE%D8%AA&query_place_id=ChIJo7j1NAD9jT8RmP0QXcKCo2s",
  },
  "پت شاپ ببری خان (شعبه جردن)": {
    description: "«پت شاپ ببری خان (شعبه جردن)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D8%A8%D8%B1%DB%8C%E2%80%8C%20%D8%AE%D8%A7%D9%86%20(%D8%B4%D8%B9%D8%A8%D9%87%20%D8%AC%D8%B1%D8%AF%D9%86)&query_place_id=ChIJi4koLAAHjj8R2x-N6VfdIdI",
  },
  "پت شاپ رزین": {
    description: "«پت شاپ رزین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D8%B2%DB%8C%D9%86&query_place_id=ChIJr0I2YQD9jT8RQtziwuFbQjk",
  },
  "پت شاپ ای پت": {
    description: "«پت شاپ ای پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان ده ونک، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJ7VauRwAHjj8RGQW967OGM0s",
  },
  "پت شاپ سگارو": {
    description: "«پت شاپ سگارو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B3%DA%AF%D8%A7%D8%B1%D9%88%20%7C%20%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C&query_place_id=ChIJESEZVwADjj8ReXrE0nkIBwo",
  },
  "پت شاپ کوکی": {
    description: "«پت شاپ کوکی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D9%88%DA%A9%DB%8C&query_place_id=ChIJj7F4bQD9kT8R81CMbktl15k",
  },
  "سوپرداگ ویتابیوتیکس": {
    description: "«سوپرداگ ویتابیوتیکس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۳.",
    website: "https://www.google.com/maps/search/?api=1&query=Vitabiotics%20SuperDog%20%D8%B3%D9%88%D9%BE%D8%B1%D8%AF%D8%A7%DA%AF%20%D9%88%DB%8C%D8%AA%D8%A7%D8%A8%DB%8C%D9%88%D8%AA%DB%8C%DA%A9%D8%B3&query_place_id=ChIJ6ZHBJTYHjj8RdNoGLk6cpYg",
  },
  "پت شاپ چیوو": {
    description: "«پت شاپ چیوو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%86%DB%8C%D9%88%D9%88&query_place_id=ChIJnRfAkrIDjj8RHf4xenZ0tq4",
  },
  "پت شاپ پت پال": {
    description: "«پت شاپ پت پال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%BE%D8%A7%D9%84&query_place_id=ChIJE6ETZAADjj8RGnp7gCwIsH4",
  },
  "پت شاپ دهکده ی گربه سگ": {
    description: "«پت شاپ دهکده ی گربه سگ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D9%87%DA%A9%D8%AF%D9%87%20%DB%8C%20%DA%AF%D8%B1%D8%A8%D9%87%20%D8%B3%DA%AF&query_place_id=ChIJJStWSQADjj8RwFLwOihl-l4",
  },
  "تهران شریمپ": {
    description: "«تهران شریمپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، منطقه ۱۹، تهران منطقه ۱۹ شهرک دولتخواه کوچه ۳۶ پلاک ۵۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20%D8%B4%D8%B1%DB%8C%D9%85%D9%BE&query_place_id=ChIJ4xQKpFsBkj8RzJqjqvdXYR8",
  },
  "پت شاپ بینگو": {
    description: "«پت شاپ بینگو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%DB%8C%D9%86%DA%AF%D9%88&query_place_id=ChIJxXM0OgAFjj8RpV2KVjPRaew",
  },
  "پت شاپ قلعه حیوانات": {
    description: "«پت شاپ قلعه حیوانات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%82%D9%84%D8%B9%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJc8lnPwADjj8RQTLv0kYQjs0",
  },
  "پت شاپ میوهاپ (آنیک)": {
    description: "«پت شاپ میوهاپ (آنیک)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%DB%8C%D9%88%D9%87%D8%A7%D9%BE%20(%D8%A2%D9%86%DB%8C%DA%A9)&query_place_id=ChIJs5ZOUQD9jT8RpXS76a6RzxM",
  },
  "پت شاپ جام جم همت پونک": {
    description: "«پت شاپ جام جم همت پونک» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AC%D8%A7%D9%85%20%D8%AC%D9%85%20%D9%87%D9%85%D8%AA%20%D9%BE%D9%88%D9%86%DA%A9%20%7C%20%D8%A2%D9%86%DB%8C%DA%A9&query_place_id=ChIJMbJDD6v9jT8RTNQ8LBAR0rc",
  },
  "پت شاپ بالتوپت": {
    description: "«پت شاپ بالتوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D8%A7%D9%84%D8%AA%D9%88%D9%BE%D8%AA%20Baltopet%20Petshop&query_place_id=ChIJI4jjHgAHjj8RSByUUoAe3-o",
  },
  "پت شاپ منوپتم": {
    description: "«پت شاپ منوپتم» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://manopetam.com",
  },
  "پت شاپ اینترنتی باران پت": {
    description: "«پت شاپ اینترنتی باران پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D8%A8%D8%A7%D8%B1%D8%A7%D9%86%20%D9%BE%D8%AA&query_place_id=ChIJZTLewyUHjj8RfqXmwCNHVDQ",
  },
  "پت شاپ کسری": {
    description: "«پت شاپ کسری» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در فرح آباد، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D8%B3%D8%B1%DB%8C&query_place_id=ChIJ1_1trFb9kT8RieKfcELGI1o",
  },
  "اکواریوم ایلیا": {
    description: "«اکواریوم ایلیا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D8%A7%DB%8C%D9%84%DB%8C%D8%A7&query_place_id=ChIJ4TP--Wj9kT8RpFbJNzwJbBo",
  },
  "پت شاپ دامشهر": {
    description: "«پت شاپ دامشهر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D8%A7%D9%85%D8%B4%D9%87%D8%B1&query_place_id=ChIJvaAJElEGjj8RRIdYYg7hyoQ",
  },
  "پت شاپ ۲۰ طوطی": {
    description: "«پت شاپ ۲۰ طوطی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در پروین اعتصامی، خیابان شهادت، پلاک ۲۲۴ خیابان.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DB%B2%DB%B0%20%D8%B7%D9%88%D8%B7%DB%8C&query_place_id=ChIJX6UWgdD9kT8RaoIeNu06b9A",
  },
  "پت شاپ شاه. عروس": {
    description: "«پت شاپ شاه. عروس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B4%D8%A7%D9%87.%20%D8%B9%D8%B1%D9%88%D8%B3&query_place_id=ChIJbQETQJUDjj8RsjEjgdsK6VI",
  },
  "پت خرید": {
    description: "فروشگاه زنجیره‌ای پت خرید با شعب نیاوران، پاسداران، نارمک و شهرک غرب — عرضه‌ی غذای سگ و گربه از برندهای رویال کنین، رفلکس و بیفار به‌همراه اسباب‌بازی، قلاده و لوازم بهداشتی.",
    website: "https://petkharid.com",
  },
  "پت شاپ لاما": {
    description: "«پت شاپ لاما» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Lama%20petshop%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D8%A7%D9%85%D8%A7&query_place_id=ChIJ8ZxkuacHjj8R6Za180_N6qw",
  },
  "پت شاپ پت مشاور": {
    description: "«پت شاپ پت مشاور» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%85%D8%B4%D8%A7%D9%88%D8%B1&query_place_id=ChIJswhClGoHjj8RHA6SgmkIM8M",
  },
  "پت شاپ پونک": {
    description: "«پت شاپ پونک» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۵.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D9%88%D9%86%DA%A9&query_place_id=ChIJlZlcUwD9jT8RP4B-HU5fY-U",
  },
  "مخعیسختولیمیا": {
    description: "«مخعیسختولیمیا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%AE%D8%B9%DB%8C%D8%B3%D8%AE%D8%AA%D9%88%D9%84%DB%8C%D9%85%DB%8C%D8%A7&query_place_id=ChIJnempQwADjj8RdFVX6pUMrn8",
  },
  "پت شاپ بهشت حیوانات": {
    description: "«پت شاپ بهشت حیوانات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D9%87%D8%B4%D8%AA%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJn8AeaQD9jT8R6nBV83yoYTE",
  },
  "پت شاپ کاج در میرداماد": {
    description: "«پت شاپ کاج در میرداماد» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۳.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D8%A7%D8%AC%20%D8%AF%D8%B1%20%D9%85%DB%8C%D8%B1%D8%AF%D8%A7%D9%85%D8%A7%D8%AF&query_place_id=ChIJgYoQ9i8Fjj8RclfesZz_26g",
  },
  "آکواریوم مهدی": {
    description: "«آکواریوم مهدی» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D9%85%D9%87%D8%AF%DB%8C&query_place_id=ChIJAWrTagD9kT8RrsGb3hlTJog",
  },
  "پت شاپ پتولیکا": {
    description: "«پت شاپ پتولیکا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%D9%88%D9%84%DB%8C%DA%A9%D8%A7&query_place_id=ChIJ9ZErTgD9jT8RyJciEmSpSdc",
  },
  "دالی پت": {
    description: "«دالی پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%84%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJ9xBvTgAHjj8RwtWHMkmQqpQ",
  },
  "پت شاپ آکام": {
    description: "«پت شاپ آکام» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%E2%80%8C%D8%B4%D8%A7%D9%BE%20%D8%A2%DA%A9%D8%A7%D9%85&query_place_id=ChIJD88sSwAFjj8RK2SORFBq3yU",
  },
  "پتشاپ اینترنتی پاستیلی پت": {
    description: "«پتشاپ اینترنتی پاستیلی پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D9%BE%D8%A7%D8%B3%D8%AA%DB%8C%D9%84%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJb0JENrIHjj8RU_2R4Q0bLBk",
  },
  "نوآوران طبیعت": {
    description: "«نوآوران طبیعت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۵.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%86%D9%88%D8%A2%D9%88%D8%B1%D8%A7%D9%86%20%D8%B7%D8%A8%DB%8C%D8%B9%D8%AA&query_place_id=ChIJuepNhkL9jT8Ryu6DpjklRaw",
  },
  "پت شاپ مارسلو": {
    description: "«پت شاپ مارسلو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۵.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D8%A7%D8%B1%D8%B3%D9%84%D9%88&query_place_id=ChIJYWFisRP9jT8RcIztDbUybO4",
  },
  "پت شاپ پت ریزه": {
    description: "«پت شاپ پت ریزه» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۸.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D8%B1%DB%8C%D8%B2%D9%87&query_place_id=ChIJ_wKmBAADjj8RV2OloGrhaJM",
  },
  "علیرضا بیگی": {
    description: "«علیرضا بیگی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B9%D9%84%DB%8C%D8%B1%D8%B6%D8%A7%20%D8%A8%DB%8C%DA%AF%DB%8C&query_place_id=ChIJY6oGf_YDjj8RzzoKWTfr4hk",
  },
  "پت شاپ اختصاصی طوطی سانان": {
    description: "«پت شاپ اختصاصی طوطی سانان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، بلوار فردوس غربی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%AE%D8%AA%D8%B5%D8%A7%D8%B5%DB%8C%20%D8%B7%D9%88%D8%B7%DB%8C%20%D8%B3%D8%A7%D9%86%D8%A7%D9%86&query_place_id=ChIJJRBGVVb9jT8RK3_vOyJaI24",
  },
  "petshop\\پت شاپ بلوبری": {
    description: "«petshop\\پت شاپ بلوبری» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=Blueberry%20petshop%5C%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D9%84%D9%88%D8%A8%D8%B1%DB%8C&query_place_id=ChIJBy_5VAAHjj8R70KmBBC6kEI",
  },
  "پت شاپ غرب": {
    description: "«پت شاپ غرب» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%BA%D8%B1%D8%A8&query_place_id=ChIJLRv8MgD9jT8RYu7lO8D61SI",
  },
  "ژرمن رویال": {
    description: "«ژرمن رویال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%98%D8%B1%D9%85%D9%86%20%D8%B1%D9%88%DB%8C%D8%A7%D9%84&query_place_id=ChIJv4ofuYcHjj8RvBmYS_UjETU",
  },
  "پت شاپ پاز": {
    description: "«پت شاپ پاز» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پترینا": {
    description: "«پترینا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در شهرک غرب، منطقه ۲، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D8%B1%DB%8C%D9%86%D8%A7&query_place_id=ChIJ4Rr90ccHjj8RTewuqnChQPQ",
  },
  "پت شاپ دارما": {
    description: "«پت شاپ دارما» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ انیمال کالا": {
    description: "«پت شاپ انیمال کالا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان رسالت - طبقه اول - واحد ۱۲، پلاک ۱۲، تهران.",
  },
  "پت شاپ شریاز": {
    description: "«پت شاپ شریاز» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در رسالت شهید کرد، مجتمع دنیای نور، طبقه منفی۲، پلاک ۵۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B4%D8%B1%DB%8C%D8%A7%D8%B2&query_place_id=ChIJ2-oERwADjj8Ru4WV8FgzHoE",
  },
  "پت آباد": {
    description: "«پت آباد» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%A2%D8%A8%D8%A7%D8%AF&query_place_id=ChIJUwiVRdQHjj8RmvFsyg_N8UM",
  },
  "پت‌آباد": {
    description: "«پت‌آباد» — فروشگاه اینترنتی و حضوری با دسته‌بندی کامل سگ، گربه، پرندگان، جوندگان و آبزیان از برندهای رویال کنین، جوسرا، رفلکس و بیفار.",
    website: "https://petabad.com",
  },
  "مجموعه خرگوش زیبا": {
    description: "«مجموعه خرگوش زیبا» — عرضه‌ی غذای خرگوش، لوازم جوندگان در خیابان ایثارگران، تهران.",
    website: "https://t.me.beautifulrabbit",
  },
  "پت شاپ ظفر": {
    description: "«پت شاپ ظفر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B8%D9%81%D8%B1&query_place_id=ChIJj-TdbQAFjj8RDjtPxUytIuA",
  },
  "آنلاین شاپ ممدپت": {
    description: "«آنلاین شاپ ممدپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۵.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86%20%D8%B4%D8%A7%D9%BE%20%D9%85%D9%85%D8%AF%D9%BE%D8%AA%7C%D9%81%D8%B1%D9%88%D8%B4%20%D9%85%D9%84%D8%B2%D9%88%D9%85%D8%A7%D8%AA%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%7C%D8%BA%D8%B0%D8%A7%DB%8C%20%DA%AF%D8%B1%D8%A8%D9%87&query_place_id=ChIJiRyicgD9jT8RivCTcbQjSbA",
  },
  "همستر پت شاپ": {
    description: "«همستر پت شاپ» — عرضه‌ی غذای خرگوش، لوازم جوندگان در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%87%D9%85%D8%B3%D8%AA%D8%B1%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE&query_place_id=ChIJOTZ_mEn9jT8RGoYqPv3DpRY",
  },
  "پت شاپ لیام": {
    description: "«پت شاپ لیام» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%DB%8C%D8%A7%D9%85&query_place_id=ChIJpwZ4dgADjj8RCHKl0zoH2Ig",
  },
  "پت شاپ بونیتا": {
    description: "«پت شاپ بونیتا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D9%88%D9%86%DB%8C%D8%AA%D8%A7&query_place_id=ChIJGwgFHAAHjj8RpLi3ih55KeQ",
  },
  "کلبه حیوانات سمرقند": {
    description: "«کلبه حیوانات سمرقند» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%D8%A8%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%B3%D9%85%D8%B1%D9%82%D9%86%D8%AF&query_place_id=ChIJVVVVtuH8jT8RTF2u9iSG1AI",
  },
  "پت شاپ پاکوتا": {
    description: "«پت شاپ پاکوتا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۳.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%DA%A9%D9%88%D8%AA%D8%A7&query_place_id=ChIJ_0wfGgAFjj8ReOrkQ1xgaBQ",
  },
  "پت شاپ پت زو": {
    description: "«پت شاپ پت زو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۵.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D8%B2%D9%88&query_place_id=ChIJdwfUCgD9jT8RysSYCXAi1OM",
  },
  "پت شاپ ملت انلاین": {
    description: "«پت شاپ ملت انلاین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۳.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D9%84%D8%AA%20%D8%A7%D9%86%D9%84%D8%A7%DB%8C%D9%86&query_place_id=ChIJl8UxVAAHjj8Rg72C4C76lvw",
  },
  "پت شاپ زروان": {
    description: "«پت شاپ زروان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B2%D8%B1%D9%88%D8%A7%D9%86&query_place_id=ChIJyQKUSQADjj8Ro74u46elTGs",
  },
  "فروشگاه آنلای": {
    description: "«فروشگاه آنلای» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C&query_place_id=ChIJ1yFM33P9jT8R2KhHKrFxOM8",
  },
  "فروشگاه پت شاپ الیز پت": {
    description: "«فروشگاه پت شاپ الیز پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%DA%AF%D8%A7%D9%87%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D9%84%DB%8C%D8%B2%20%D9%BE%D8%AA&query_place_id=ChIJo0BZEgD9jT8RCHz2BBx2jKM",
  },
  "خرید سگ": {
    description: "«خرید سگ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AE%D8%B1%DB%8C%D8%AF%20%D8%B3%DA%AF&query_place_id=ChIJX2hxz-oHjj8RDOuXBp473UM",
  },
  "پت شاپ دردونه": {
    description: "«پت شاپ دردونه» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۵.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D8%B1%D8%AF%D9%88%D9%86%D9%87&query_place_id=ChIJ5TKBQbL9jT8RYkUxLZ5vVRo",
  },
  "پت شاپ پتکو": {
    description: "«پت شاپ پتکو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۳.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%DA%A9%D9%88&query_place_id=ChIJjSjrZQAFjj8R84lSMMot0KI",
  },
  "پت شاپ ریو": {
    description: "«پت شاپ ریو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در افسریه، خیابان ۱۶، پلاک بین ۱۵ متری اول و دوم پلاک ۱۲۹.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%DB%8C%D9%88&query_place_id=ChIJrTtIRAD9kT8RZnl7DJ9JyFk",
  },
  "پت بوتیک سفید🐾": {
    description: "«پت بوتیک سفید🐾» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%A8%D9%88%D8%AA%D9%8A%D9%83%20%D8%B3%D9%81%D9%8A%D8%AF%F0%9F%90%BE&query_place_id=ChIJ8y0FVQAFjj8RFyPWLf319L0",
  },
  "پت شاپ آقا شیره": {
    description: "«پت شاپ آقا شیره» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%82%D8%A7%20%D8%B4%DB%8C%D8%B1%D9%87&query_place_id=ChIJ4zoDWAADjj8RnEuW5Pa6veo",
  },
  "کلبه حیوانات دروس": {
    description: "«کلبه حیوانات دروس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%D8%A8%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AF%D8%B1%D9%88%D8%B3&query_place_id=ChIJNat7P6QFjj8RBzyAualahi0",
  },
  "پت شاپ بهار یک": {
    description: "«پت شاپ بهار یک» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در عترت.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D9%87%D8%A7%D8%B1%20%DB%8C%DA%A9&query_place_id=ChIJfbTeHgD9jT8RnhteE50PeqA",
  },
  "پاپت شاپ": {
    description: "«پاپت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بلوار شهید غلامرضا مخبری، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE&query_place_id=ChIJK5iXTQD9jT8RvHH9Dpyv_Xg",
  },
  "پت شاپ آوینا": {
    description: "«پت شاپ آوینا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پرنده سرای ری(اصلی)": {
    description: "«پرنده سرای ری(اصلی)» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در منطقه ۲۰.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D8%B3%D8%B1%D8%A7%DB%8C%20%D8%B1%DB%8C(%D8%A7%D8%B5%D9%84%DB%8C)&query_place_id=ChIJ8W1GJAD9kT8RjzcE0pdF5EM",
  },
  "گندم پت": {
    description: "«گندم پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%AF%D9%86%D8%AF%D9%85%20%D9%BE%D8%AA&query_place_id=ChIJrWD5dgADjj8RprPhJINkHpg",
  },
  "پت شاپ پامرکده": {
    description: "«پت شاپ پامرکده» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D9%85%D8%B1%DA%A9%D8%AF%D9%87%20pomerkadeh&query_place_id=ChIJo6UBWIX9jT8R2DGcpLmtqPg",
  },
  "داریان پت شاپ": {
    description: "«داریان پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در جنت آباد شمالی جنب مرکز تجاری طوبی، پلاک ۸۶.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%DB%8C%D8%A7%D9%86%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE&query_place_id=ChIJCfbQUgD9jT8RtKRWhycZM3E",
  },
  "پت شاپ پیشو": {
    description: "«پت شاپ پیشو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%DB%8C%D8%B4%D9%88&query_place_id=ChIJIYRKXgAHjj8RePzf6q5xAOw",
  },
  "پت شاپ سایمون": {
    description: "«پت شاپ سایمون» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بلوار شهید غلامرضا مخبری، پلاک ۲۶۶.",
    website: "https://simoncat.ir/",
  },
  "کلبه حیوانات": {
    description: "«کلبه حیوانات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%D8%A8%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJzZUEKQABjj8RTHVG1l_HQiQ",
  },
  "سالن گلدین فنچ ری": {
    description: "«سالن گلدین فنچ ری» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در چشمه علی، منطقه ۲۰، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B3%D8%A7%D9%84%D9%86%20%DA%AF%D9%84%D8%AF%DB%8C%D9%86%20%D9%81%D9%86%DA%86%20%D8%B1%DB%8C&query_place_id=ChIJYwFlHDb9kT8ROwKDOWDExGs",
  },
  "خرید و فروش گربه میومیو": {
    description: "«خرید و فروش گربه میومیو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AE%D8%B1%DB%8C%D8%AF%20%D9%88%20%D9%81%D8%B1%D9%88%D8%B4%20%DA%AF%D8%B1%D8%A8%D9%87%20%D9%85%DB%8C%D9%88%D9%85%DB%8C%D9%88&query_place_id=ChIJ97UObwD9jT8R0lauZjVxHeM",
  },
  "پت شاپ پاسداران پلاس": {
    description: "«پت شاپ پاسداران پلاس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D8%B3%D8%AF%D8%A7%D8%B1%D8%A7%D9%86%20%D9%BE%D9%84%D8%A7%D8%B3&query_place_id=ChIJrwchYwAFjj8RFgVZMIgu24Y",
  },
  "پت شاپ وانیل": {
    description: "«پت شاپ وانیل» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در انتها، ندا پلاک ۲/۹.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%D8%A7%D9%86%DB%8C%D9%84&query_place_id=ChIJF-35bbIFjj8RrDLBFqS9_aE",
  },
  "پت شاپ الیت": {
    description: "«پت شاپ الیت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "فامیلی پت شاپ": {
    description: "«فامیلی پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%A7%D9%85%DB%8C%D9%84%DB%8C%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE&query_place_id=ChIJuQMSCsgBjj8R6dc4HUOfnf0",
  },
  "پت شاپ لاویتا": {
    description: "«پت شاپ لاویتا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D8%A7%D9%88%DB%8C%D8%AA%D8%A7&query_place_id=ChIJbVw9e4sHjj8Rt6nS-D7BTCw",
  },
  "پت شاپ فرشته": {
    description: "«پت شاپ فرشته» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان توحید ۱، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%81%D8%B1%D8%B4%D8%AA%D9%87&query_place_id=ChIJ5z7lOlUHjj8RWQUBRydziF4",
  },
  "پت شاپ گلبا": {
    description: "«پت شاپ گلبا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان توحید ۱، پلاک ۱۱۱، تهران.",
    website: "https://golba.group",
  },
  "پلنتاریوم و کادویی آریا پلنت": {
    description: "«پلنتاریوم و کادویی آریا پلنت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۵.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D9%84%D9%86%D8%AA%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D9%88%20%DA%A9%D8%A7%D8%AF%D9%88%DB%8C%DB%8C%20%D8%A2%D8%B1%DB%8C%D8%A7%20%D9%BE%D9%84%D9%86%D8%AA&query_place_id=ChIJlfT8MjH9kT8Rtg5htD1eJXE",
  },
  "پت شاپ پازل": {
    description: "«پت شاپ پازل» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان کمیجانی، پلاک ۱۳، تهران.",
  },
  "پت شاپ استخوان نارنجی": {
    description: "«پت شاپ استخوان نارنجی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%B3%D8%AA%D8%AE%D9%88%D8%A7%D9%86%20%D9%86%D8%A7%D8%B1%D9%86%D8%AC%DB%8C&query_place_id=ChIJWbv8LlMDjj8Rvm9Jp4FnXWs",
  },
  "پت شاپ یونیکورن": {
    description: "«پت شاپ یونیکورن» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DB%8C%D9%88%D9%86%DB%8C%DA%A9%D9%88%D8%B1%D9%86%202&query_place_id=ChIJZRebfwL9jT8RJBZIkatKqGE",
  },
  "پت شاپ های": {
    description: "«پت شاپ های» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%D8%A7%DB%8C&query_place_id=ChIJL8fs05EDjj8R-1EZyCrzYu0",
  },
  "(پت شاپ آنلاین)": {
    description: "«(پت شاپ آنلاین)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۴.",
    website: "https://www.google.com/maps/search/?api=1&query=(%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86)%20Zoodpet&query_place_id=ChIJ16-n6SoFjj8RGNknfg5TkXA",
  },
  "پت شاپ اشی مشی": {
    description: "«پت شاپ اشی مشی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ شرق": {
    description: "«پت شاپ شرق» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B4%D8%B1%D9%82&query_place_id=ChIJG6x0YD0Djj8RnFhFcm4KBPw",
  },
  "پت شاپ پوما": {
    description: "«پت شاپ پوما» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D9%88%D9%85%D8%A7&query_place_id=ChIJvc6eEQD9jT8RDyrqNEU_zY4",
  },
  "پت شاپ درین": {
    description: "«پت شاپ درین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D8%B1%DB%8C%D9%86&query_place_id=ChIJi2S4_9wDjj8RvWzhMi_R7FA",
  },
  "پت شاپ لوازم حیوانات خانگی درین": {
    description: "«پت شاپ لوازم حیوانات خانگی درین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بزرگراه شهید سلیمانی.",
  },
  "پت شاپ بوشوگ.": {
    description: "«پت شاپ بوشوگ.» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D9%88%D8%B4%D9%88%DA%AF.&query_place_id=ChIJ-eg2BqUDjj8RX5IHN6-tkOg",
  },
  "آکواریوم ساحل ۱۱۰": {
    description: "«آکواریوم ساحل ۱۱۰» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D8%B3%D8%A7%D8%AD%D9%84%20%DB%B1%DB%B1%DB%B0&query_place_id=ChIJWaSxJnn9kT8RIKhHJOyrs88",
  },
  "پت شاپ کت هاپ": {
    description: "«پت شاپ کت هاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در نیایش.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D8%AA%20%D9%87%D8%A7%D9%BE&query_place_id=ChIJpanMdwD9jT8RG7mREX3QWXc",
  },
  "پت شاپ طرلان ۲": {
    description: "«پت شاپ طرلان ۲» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در شرق، بازار بزرگ جنت پلاک ۲۳۵ پت شاپ طرلان.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B7%D8%B1%D9%84%D8%A7%D9%86%20%DB%B2&query_place_id=ChIJkz3CcAD9jT8RMWgnKEa7fzk",
  },
  "آکواریم و پت شاپ ماهور": {
    description: "«آکواریم و پت شاپ ماهور» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%85%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D8%A7%D9%87%D9%88%D8%B1&query_place_id=ChIJtwjU3_L_kT8RyQhaDpauGjw",
  },
  "پت شاپ پیشاپو": {
    description: "«پت شاپ پیشاپو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%DB%8C%D8%B4%D8%A7%D9%BE%D9%88&query_place_id=ChIJu4FdRrwDjj8R-yJxbi7FukQ",
  },
  "پرنده سرای ری": {
    description: "«پرنده سرای ری» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران، خیابان عروجی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D8%B3%D8%B1%D8%A7%DB%8C%20%D8%B1%DB%8C&query_place_id=ChIJG-YmHxr7kT8RiDwK0mDGFt8",
  },
  "پت شاپ زبل شعبه پاسداران": {
    description: "«پت شاپ زبل شعبه پاسداران» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B2%D8%A8%D9%84%20%D8%B4%D8%B9%D8%A8%D9%87%20%D9%BE%D8%A7%D8%B3%D8%AF%D8%A7%D8%B1%D8%A7%D9%86&query_place_id=ChIJ9Zg8BQAFjj8RGdO9mmNss0o",
  },
  "داروخانه و پت شاپ دانش": {
    description: "«داروخانه و پت شاپ دانش» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D8%A7%D9%86%D8%B4&query_place_id=ChIJaR4UfiMHjj8ROWKqj46kkhQ",
  },
  "ژیوان": {
    description: "«ژیوان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ کیم پت پاسداران": {
    description: "«پت شاپ کیم پت پاسداران» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%DB%8C%D9%85%20%D9%BE%D8%AA%20%D9%BE%D8%A7%D8%B3%D8%AF%D8%A7%D8%B1%D8%A7%D9%86&query_place_id=ChIJ0wbKPAAFjj8RdpxSJSMmuA4",
  },
  "پت شاپ و گرومینگ لوپاپت(شعبه دولت)": {
    description: "«پت شاپ و گرومینگ لوپاپت(شعبه دولت)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۳.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%20%DA%AF%D8%B1%D9%88%D9%85%DB%8C%D9%86%DA%AF%20%D9%84%D9%88%D9%BE%D8%A7%D9%BE%D8%AA(%D8%B4%D8%B9%D8%A8%D9%87%20%D8%AF%D9%88%D9%84%D8%AA)%20%7C%20Lupawpet&query_place_id=ChIJ8w8YIQAFjj8Rsnv1rU5pJKI",
  },
  "فروش گربه اسکاتیش رادپت": {
    description: "«فروش گربه اسکاتیش رادپت» — عرضه‌ی لوازم گربه، خاک و بستر، غذای گربه در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%81%D8%B1%D9%88%D8%B4%20%DA%AF%D8%B1%D8%A8%D9%87%20%D8%A7%D8%B3%DA%A9%D8%A7%D8%AA%DB%8C%D8%B4%20%D8%B1%D8%A7%D8%AF%D9%BE%D8%AA&query_place_id=ChIJD2x2YAD9jT8RaNAUbkZeRYA",
  },
  "مرکز خرید و فروش انواع گربه نژاد دار اسکاتیش بریتیش رادپت": {
    description: "«مرکز خرید و فروش انواع گربه نژاد دار اسکاتیش بریتیش رادپت» — عرضه‌ی لوازم گربه، خاک و بستر، غذای گربه در خیابان معینی (هفتم)، تهران.",
  },
  "رژپت": {
    description: "«رژپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، تهرانسر شرقی، بلوار لاله.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B1%DA%98%D9%BE%D8%AA&query_place_id=ChIJIzwj8-v7jT8RG3ien_6nT_A",
  },
  "Shopپت شاپ ایرانیان": {
    description: "«Shopپت شاپ ایرانیان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۴.",
    website: "https://www.google.com/maps/search/?api=1&query=Iranian%20Pet%20Shop%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D8%B1%D8%A7%D9%86%DB%8C%D8%A7%D9%86&query_place_id=ChIJ7RcH9VAFjj8Rr-vazzt0ghA",
  },
  "پت شاپ فلامینگو": {
    description: "«پت شاپ فلامینگو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://flamingopet.shop/",
  },
  "پت شاپ پت فودا": {
    description: "«پت شاپ پت فودا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%81%D9%88%D8%AF%D8%A7%20%7C%20Petfooda&query_place_id=ChIJQSJriA8Fjj8RqBDBaXrC-3c",
  },
  "مای فندق": {
    description: "«مای فندق» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، میدان هروی، پلاک ۷.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%A7%DB%8C%20%D9%81%D9%86%D8%AF%D9%82&query_place_id=ChIJS7wXMGoFjj8R5mJGjItFu5g",
  },
  "ژرمن پت شاپ": {
    description: "«ژرمن پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%98%D8%B1%D9%85%D9%86%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE&query_place_id=ChIJmeOteADjjT8Rxk_TFgO15WU",
  },
  "بازار سگ فروشی": {
    description: "«بازار سگ فروشی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%D8%A7%D8%B2%D8%A7%D8%B1%20%D8%B3%DA%AF%20%D9%81%D8%B1%D9%88%D8%B4%DB%8C&query_place_id=ChIJ3XPAfTr_jT8RbnA17eCOwaQ",
  },
  "پت شاپ آنلاین پی کی پت": {
    description: "«پت شاپ آنلاین پی کی پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86%20%D9%BE%DB%8C%20%DA%A9%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJ9d8Bh98Hjj8RtSPwX8DjuSo",
  },
  "پت شاپ لوسی شهرری": {
    description: "«پت شاپ لوسی شهرری» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۰.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D9%88%D8%B3%DB%8C%20%D8%B4%D9%87%D8%B1%D8%B1%DB%8C&query_place_id=ChIJe9XkVAD7kT8ROtiz3AmcheQ",
  },
  "پت شاپ رویال پال -": {
    description: "«پت شاپ رویال پال -» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D9%88%DB%8C%D8%A7%D9%84%20%D9%BE%D8%A7%D9%84%20-%20Royal%20Pal%20PetShop&query_place_id=ChIJnw5JQAAFjj8RA6x6t8qasmM",
  },
  "پت شاپ هیوا شعبه": {
    description: "«پت شاپ هیوا شعبه» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۴.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%DB%8C%D9%88%D8%A7%20%D8%B4%D8%B9%D8%A8%D9%87%202&query_place_id=ChIJPfzANgAFjj8RsGvpPxlv8Qw",
  },
  "پتهران پت کلاب": {
    description: "«پتهران پت کلاب» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20VIP%20%D9%BE%D8%AA%20%DA%A9%D9%84%D8%A7%D8%A8&query_place_id=ChIJ0Z14eQAHjj8RgyMY7YOKqww",
  },
  "آکواریوم امپراطور ۲": {
    description: "«آکواریوم امپراطور ۲» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%20%D8%A7%D9%85%D9%BE%D8%B1%D8%A7%D8%B7%D9%88%D8%B1%20%DB%B2&query_place_id=ChIJQY3MU4n7jT8R1p9HQdi04gY",
  },
  "پت شاپ میوهاپ": {
    description: "«پت شاپ میوهاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%DB%8C%D9%88%D9%87%D8%A7%D9%BE&query_place_id=ChIJIf8XSgD7jT8RtUfpMU_sfWU",
  },
  "پتشاپ دایان": {
    description: "«پتشاپ دایان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ یوکا": {
    description: "«پت شاپ یوکا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DB%8C%D9%88%DA%A9%D8%A7&query_place_id=ChIJeRL_dADjjT8RCJbIC49g7r4",
  },
  "پت شاپ ملوپت": {
    description: "«پت شاپ ملوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D9%84%D9%88%D9%BE%D8%AA&query_place_id=ChIJj1BhdQD7kT8Rzz88_Z1cKGI",
  },
  "بلوار اصلی تهرانسربین کوچه یکم وسوم پاساژ الهام طبقه همکف": {
    description: "«بلوار اصلی تهرانسربین کوچه یکم وسوم پاساژ الهام طبقه همکف» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%D9%84%D9%88%D8%A7%D8%B1%20%D8%A7%D8%B5%D9%84%DB%8C%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%D8%B3%D8%B1%D8%A8%DB%8C%D9%86%20%DA%A9%D9%88%DA%86%D9%87%20%DB%8C%DA%A9%D9%85%20%D9%88%D8%B3%D9%88%D9%85%20%D9%BE%D8%A7%D8%B3%D8%A7%DA%98%20%D8%A7%D9%84%D9%87%D8%A7%D9%85%20%D8%B7%D8%A8%D9%82%D9%87%20%D9%87%D9%85%DA%A9%D9%81&query_place_id=ChIJicb54ZX7jT8RKB_qw7Z3c9g",
  },
  "پت شاپ رویال تهرانسر": {
    description: "«پت شاپ رویال تهرانسر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D9%88%DB%8C%D8%A7%D9%84%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%D8%B3%D8%B1&query_place_id=ChIJreYnL7b7jT8Rnu712K-1UNo",
  },
  "پت شاپ روماک پت": {
    description: "«پت شاپ روماک پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D9%88%D9%85%D8%A7%DA%A9%20%D9%BE%D8%AA%20Romak%20pet%20Petshop&query_place_id=ChIJE1tnDgD7jT8RRBeDKkqmLBM",
  },
  "پت شاپ پت لند تهرانسر": {
    description: "«پت شاپ پت لند تهرانسر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Pet%20shop%20Pet%20Land%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%84%D9%86%D8%AF%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%D8%B3%D8%B1&query_place_id=ChIJuxtCU4r7jT8RmVyD9EFKcXM",
  },
  "حیوانات امیر": {
    description: "«حیوانات امیر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%A7%D9%85%DB%8C%D8%B1&query_place_id=ChIJ46Q7n8T7jT8RNl7jJNtbZ9Y",
  },
  "دکتر پروین": {
    description: "«دکتر پروین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "http://www.petiran.ir",
  },
  "لاوی پت": {
    description: "«لاوی پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%84%D8%A7%D9%88%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJjQjJbAAFjj8Rl3N1nNwYRkg",
  },
  "پت شاپ آنلاین پت دونی": {
    description: "«پت شاپ آنلاین پت دونی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86%20%D9%BE%D8%AA%20%D8%AF%D9%88%D9%86%DB%8C&query_place_id=ChIJZQdQLAAHjj8RCTpAcaIIKrk",
  },
  "پت شاپ قیطریه": {
    description: "«پت شاپ قیطریه» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%82%DB%8C%D8%B7%D8%B1%DB%8C%D9%87&query_place_id=ChIJEVranBgFjj8R2rk0TFuEvzs",
  },
  "ساران پت": {
    description: "«ساران پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان سلمان، پلاک ۲۱، تهران.",
  },
  "پت شاپ پت استیشن": {
    description: "«پت شاپ پت استیشن» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D8%A7%D8%B3%D8%AA%DB%8C%D8%B4%D9%86&query_place_id=ChIJv-AOaAAJjj8Rq7XeR96eFeA",
  },
  "سرزمین حیوانات هیرو": {
    description: "«سرزمین حیوانات هیرو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B3%D8%B1%D8%B2%D9%85%DB%8C%D9%86%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%87%DB%8C%D8%B1%D9%88&query_place_id=ChIJs16FPwAFjj8RgYCA4VkPdXc",
  },
  "لومانوپت": {
    description: "«لومانوپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، شارستان یکم.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%84%D9%88%D9%85%D8%A7%D9%86%D9%88%D9%BE%D8%AA&query_place_id=ChIJZ0qxiPAHjj8RYJvOb4W5xKo",
  },
  "پت شاپ مرسی پت شهرری": {
    description: "«پت شاپ مرسی پت شهرری» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۰.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D8%B1%D8%B3%DB%8C%20%D9%BE%D8%AA%20%D8%B4%D9%87%D8%B1%D8%B1%DB%8C&query_place_id=ChIJUzDqh_37kT8RjQH3vHAhp_Y",
  },
  "پت شاپ سروین": {
    description: "«پت شاپ سروین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B3%D8%B1%D9%88%DB%8C%D9%86&query_place_id=ChIJ185lAQAHjj8Ro9B7rF5wyAM",
  },
  "پت شاپ پرنس": {
    description: "«پت شاپ پرنس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ بهار": {
    description: "«پت شاپ بهار» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D9%87%D8%A7%D8%B1&query_place_id=ChIJQbfADQAFjj8RBwaQMMF_mcE",
  },
  "پت شاپ ارم": {
    description: "«پت شاپ ارم» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در قیطریه اندرزگو بلوار صبا خیابان کریمی  نبش محققی.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%B1%D9%85&query_place_id=ChIJe70G1kMFjj8RwYrhOgvNrJg",
  },
  "آس پت": {
    description: "«آس پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ آژین": {
    description: "«پت شاپ آژین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ پیشیکا": {
    description: "«پت شاپ پیشیکا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%DB%8C%D8%B4%DB%8C%DA%A9%D8%A7&query_place_id=ChIJL7RuRAD9jT8RuxMybvNR2fo",
  },
  "/ پت شاپ نمو": {
    description: "«/ پت شاپ نمو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Pet%20Shop%20Nemo%20%2F%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%86%D9%85%D9%88&query_place_id=ChIJGXy5SgAFjj8RuCa0uCU93Yc",
  },
  "پت شاپ پرشیا": {
    description: "«پت شاپ پرشیا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان گلستان دوم، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Elx%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%B1%D8%B4%DB%8C%D8%A7&query_place_id=ChIJS8Xmoj4Jjj8RX-eHNIisCNY",
  },
  "بلو پت": {
    description: "«بلو پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "اسکودوباکس": {
    description: "«اسکودوباکس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%D8%B3%DA%A9%D9%88%D8%AF%D9%88%D8%A8%D8%A7%DA%A9%D8%B3&query_place_id=ChIJNUsQlMAFjj8RSCyZWnRyUW4",
  },
  "پت شاپ ولنجک": {
    description: "«پت شاپ ولنجک» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%D9%84%D9%86%D8%AC%DA%A9&query_place_id=ChIJzcSrXwYJjj8RRw7hOUevrYk",
  },
  "پرنده زینتی خلیل سرباز": {
    description: "«پرنده زینتی خلیل سرباز» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در منطقه ۱۸.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D8%B2%DB%8C%D9%86%D8%AA%DB%8C%20%D8%AE%D9%84%DB%8C%D9%84%20%D8%B3%D8%B1%D8%A8%D8%A7%D8%B2&query_place_id=ChIJ22CCWQD5jT8RJdKrTubn7G0",
  },
  "پت شاپ پت محل": {
    description: "«پت شاپ پت محل» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%85%D8%AD%D9%84&query_place_id=ChIJQ2OdCwAFjj8RO2MlFLdPtWI",
  },
  "دان قفس لوازم پرندگان سام": {
    description: "«دان قفس لوازم پرندگان سام» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پخش قفس و لوازم پرندگان سام برد": {
    description: "«پخش قفس و لوازم پرندگان سام برد» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۸.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AE%D8%B4%20%D9%82%D9%81%D8%B3%20%D9%88%20%D9%84%D9%88%D8%A7%D8%B2%D9%85%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D8%B3%D8%A7%D9%85%20%D8%A8%D8%B1%D8%AF&query_place_id=ChIJD220GAD5jT8RJTHYnQCwSK4",
  },
  "بازار پرندگان زینتی خلیج فارس": {
    description: "«بازار پرندگان زینتی خلیج فارس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ آراز": {
    description: "«پت شاپ آراز» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱۸.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D8%B1%D8%A7%D8%B2&query_place_id=ChIJY10cIwD5jT8RPzYENft7oHY",
  },
  "پت شاپ دانشکده طوطی": {
    description: "«پت شاپ دانشکده طوطی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان کنارگذر آزادگان، شهر تهران.",
    website: "https://amozeshtoti.ir",
  },
  "پرنده فروشی": {
    description: "«پرنده فروشی» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D9%81%D8%B1%D9%88%D8%B4%DB%8C&query_place_id=ChIJ2yZJAgD7kT8ROQ9r1xJP5tQ",
  },
  "پت شاپ کایان": {
    description: "«پت شاپ کایان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D8%A7%DB%8C%D8%A7%D9%86&query_place_id=ChIJPwL5E0D7jT8R5AWUlnr9YgM",
  },
  "پت شاپ زعفرانیه": {
    description: "«پت شاپ زعفرانیه» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B2%D8%B9%D9%81%D8%B1%D8%A7%D9%86%DB%8C%D9%87&query_place_id=ChIJZdMhSYEHjj8Rc3tGTfgAQhs",
  },
  "پت شاپ پت ویل": {
    description: "«پت شاپ پت ویل» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Pet%20Ville%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%88%DB%8C%D9%84&query_place_id=ChIJ9T9TGEL7jT8RsRfUROXj7ok",
  },
  "پتشاپ عسل پت": {
    description: "«پتشاپ عسل پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در چیتگر، خیابان کوهک، نبش نسیم ۱۶، پاساژ طوبی، ط ۳، راهرو جی،  ۱۶.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D8%B4%D8%A7%D9%BE%20%D8%B9%D8%B3%D9%84%20%D9%BE%D8%AA%20Asalpet%20Petshop&query_place_id=ChIJl7ML8Zn7jT8R742Fd0cfqH0",
  },
  "پت شاپ لوکس سنتر": {
    description: "«پت شاپ لوکس سنتر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در ۵۶۹تهران پلاک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D9%88%DA%A9%D8%B3%20%D8%B3%D9%86%D8%AA%D8%B1&query_place_id=ChIJi9YcHAAFjj8RuMjwEJGZ50E",
  },
  "پت شاپ پام پت": {
    description: "«پت شاپ پام پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D9%85%20%D9%BE%D8%AA&query_place_id=ChIJy_bSLbT7jT8RlCPHAc4YdMI",
  },
  "پتشاپ پت جت": {
    description: "«پتشاپ پت جت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D8%AC%D8%AA&query_place_id=ChIJKcuTcgAFjj8Rxhr4Yj2_fpE",
  },
  "پت شاپ آنلاین پنجول": {
    description: "«پت شاپ آنلاین پنجول» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86%20%D9%BE%D9%86%D8%AC%D9%88%D9%84&query_place_id=ChIJmWgWOAAFjj8RmhnKStCeczk",
  },
  "سهره مجتبی": {
    description: "«سهره مجتبی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B3%D9%87%D8%B1%D9%87%20%D9%85%D8%AC%D8%AA%D8%A8%DB%8C&query_place_id=ChIJXaTZ7rP7kT8Rlj2xeM83o8k",
  },
  "صباپت": {
    description: "«صباپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان (۱۲۱) رضایی.",
  },
  "پت شاپ اینترنتی بهی پت": {
    description: "«پت شاپ اینترنتی بهی پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در میدان تجریش، خیابان فناخسرو، پلاک ۲۴.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D8%A8%D9%87%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJYVnvZgYHjj8RZw_CoPbLq0Y",
  },
  "پت شاپ ژیوان": {
    description: "«پت شاپ ژیوان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%98%DB%8C%D9%88%D8%A7%D9%86&query_place_id=ChIJ82JQVQAHjj8RxAwMCq2U66Q",
  },
  "پت شاپ هیوا": {
    description: "«پت شاپ هیوا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%DB%8C%D9%88%D8%A7&query_place_id=ChIJRT5v2lYdjj8R9GDrcaJ0lJs",
  },
  "پت شاپ بامبو": {
    description: "«پت شاپ بامبو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D8%A7%D9%85%D8%A8%D9%88&query_place_id=ChIJ21UhRgD7jT8R0uweKBcvAoo",
  },
  "پت شاپ چیتگر": {
    description: "«پت شاپ چیتگر» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در نسیم هفتم-پاساژ چیتگر-طبقه اول بلوار کوهک انتهای.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%86%DB%8C%D8%AA%DA%AF%D8%B1&query_place_id=ChIJPeoJJAD7jT8R1aXTllqeBZ0",
  },
  "همراه پت": {
    description: "«همراه پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%D9%85%D8%B1%D8%A7%D9%87%20%D9%BE%D8%AA&query_place_id=ChIJ4xfwJ4sdjj8RQUUXGg7T7bU",
  },
  "پت شاپ، ملزومات حیوانات خانگی": {
    description: "«پت شاپ، ملزومات حیوانات خانگی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان بیست متری مسجد، تهران.",
  },
  "پت شاپ پت پوینت": {
    description: "«پت شاپ پت پوینت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%BE%D9%88%DB%8C%D9%86%D8%AA&query_place_id=ChIJr_RK250djj8RzmQ5WuHDeOU",
  },
  "پت شاپ کاپیتان": {
    description: "«پت شاپ کاپیتان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۸.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D8%A7%D9%BE%DB%8C%D8%AA%D8%A7%D9%86&query_place_id=ChIJk_khX9sdjj8RDQX0FBHpx7I",
  },
  "پت شاپ اقدسیه": {
    description: "«پت شاپ اقدسیه» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در اقدسیه، منطقه ۱، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D9%82%D8%AF%D8%B3%DB%8C%D9%87&query_place_id=ChIJDxoE9qUFjj8Rnu36wKcHJcU",
  },
  "ماهی فروشی": {
    description: "«ماهی فروشی» — عرضه‌ی آکواریوم، ماهی زینتی، لوازم آبزیان در تهران.",
  },
  "پت شاپ میو هاپ": {
    description: "«پت شاپ میو هاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%DB%8C%D9%88%20%D9%87%D8%A7%D9%BE&query_place_id=ChIJA4UpUr8Fjj8RelgfKfD5tCA",
  },
  "پت شاپ درین اوا پلاس": {
    description: "«پت شاپ درین اوا پلاس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D8%B1%DB%8C%D9%86%20%D8%A7%D9%88%D8%A7%20%D9%BE%D9%84%D8%A7%D8%B3&query_place_id=ChIJWzd4cwAFjj8RQLc-_LzpCDg",
  },
  "پت شاپ و کلینیک آواپت": {
    description: "«پت شاپ و کلینیک آواپت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://avaplatt.com/service/%d8%a2%d9%88%d8%a7-%d9%be%d8%aa/",
  },
  "پت شاپ لُپیدو": {
    description: "«پت شاپ لُپیدو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D9%8F%D9%BE%DB%8C%D8%AF%D9%88&query_place_id=ChIJ6--jd_Idjj8RDYsG4ibyRtg",
  },
  "پت ایت": {
    description: "«پت ایت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%A7%DB%8C%D8%AA&query_place_id=ChIJ6RzZFAAFjj8Rdc-T8RdGqfI",
  },
  "مدرسه خرگوشا": {
    description: "«مدرسه خرگوشا» — عرضه‌ی غذای خرگوش، لوازم جوندگان در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%AF%D8%B1%D8%B3%D9%87%20%D8%AE%D8%B1%DA%AF%D9%88%D8%B4%D8%A7&query_place_id=ChIJKcE6NgYPjj8R6wXLDYH1ntU",
  },
  "پت شاپ هاپومیو": {
    description: "«پت شاپ هاپومیو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%D8%A7%D9%BE%D9%88%D9%85%DB%8C%D9%88&query_place_id=ChIJqaf_3SQPjj8RfAncRTUMXEs",
  },
  "پت شاپ پاپی کت": {
    description: "«پت شاپ پاپی کت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D9%BE%DB%8C%20%DA%A9%D8%AA&query_place_id=ChIJ3QPhrq8djj8Re9lGLEkEQAI",
  },
  "پت شاپ ویان": {
    description: "«پت شاپ ویان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%88%DB%8C%D8%A7%D9%86&query_place_id=ChIJJa_-W1Udjj8RvKpQXXH9zXk",
  },
  "پت شاپ ماکایو": {
    description: "«پت شاپ ماکایو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در جمیلی، پلاک نبش، خیابان، پلاک ۴۲۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D8%A7%DA%A9%D8%A7%D8%A6%D9%88&query_place_id=ChIJsbvmPAAdjj8RHrrFur5AB8o",
  },
  "سپاس پت": {
    description: "«سپاس پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B3%D9%BE%D8%A7%D8%B3%20%D9%BE%D8%AA&query_place_id=ChIJF6UK9_DlkT8RGu1euQ2D8Ss",
  },
  "پت شاپ پتالیون": {
    description: "«پت شاپ پتالیون» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%D8%A7%D9%84%DB%8C%D9%88%D9%86&query_place_id=ChIJY2mnegAFjj8RBUOOn6WhtXk",
  },
  "پت شاپ تیوان": {
    description: "«پت شاپ تیوان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان سروستان هشتم، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AA%DB%8C%D9%88%D8%A7%D9%86&query_place_id=ChIJWzjvYQDljT8RaTaKG5d3iUI",
  },
  "پتشاپ وست": {
    description: "«پتشاپ وست» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%D8%B4%D8%A7%D9%BE%20%D9%88%D8%B3%D8%AA&query_place_id=ChIJv_AFtXjljT8RmKjAML9P4fI",
  },
  "پرنده سرای نگاه": {
    description: "«پرنده سرای نگاه» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در خیابان ارفاقی، پلاک ۳۱۳، تهران.",
  },
  "سالن مرغ عشق (هما)": {
    description: "«سالن مرغ عشق (هما)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B3%D8%A7%D9%84%D9%86%20%D9%85%D8%B1%D8%BA%20%D8%B9%D8%B4%D9%82%20(%D9%87%D9%85%D8%A7)&query_place_id=ChIJt329U3Idjj8R2P_Atd8jvaY",
  },
  "پت شاپ پت دوست": {
    description: "«پت شاپ پت دوست» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در امیری صفت.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D8%AF%D9%88%D8%B3%D8%AA&query_place_id=ChIJ_wkb0azljT8RByVFzx6gEtc",
  },
  "پت شاپ راویس": {
    description: "«پت شاپ راویس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D8%A7%D9%88%D9%8A%D8%B3&query_place_id=ChIJ93Ua574Fjj8R6ULTfpcWOUs",
  },
  "پت شاپ نینی پت": {
    description: "«پت شاپ نینی پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۲، بلوار محیط بان خیابان امیری صفت تقاطع تالش پاساژ پارامیس طبقه همکف واحد ۲ میدان موج.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%86%DB%8C%D9%86%DB%8C%20%D9%BE%D8%AA&query_place_id=ChIJoXsR-_PljT8RE6FCjmyzxxM",
  },
  "میوخان پت شاپ": {
    description: "«میوخان پت شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%DB%8C%D9%88%D8%AE%D8%A7%D9%86%20%D9%BE%D8%AA%20%E2%80%8C%D8%B4%D8%A7%D9%BE%20Meowkhan%20pet%20shop&query_place_id=ChIJgR2oSAAFjj8Rku1b6z_zpzY",
  },
  "پت شاپلی": {
    description: "«پت شاپلی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۲.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%D9%84%DB%8C&query_place_id=ChIJR3dArCvljT8REPZ2XvwI2Zk",
  },
  "پرنده فروشی سیمرغ": {
    description: "«پرنده فروشی سیمرغ» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در استخر، منطقه ۴، تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%B1%D9%86%D8%AF%D9%87%20%D9%81%D8%B1%D9%88%D8%B4%DB%8C%20%D8%B3%DB%8C%D9%85%D8%B1%D8%BA&query_place_id=ChIJ2Z0mEK4djj8RDQcktig1enQ",
  },
  "پت شاپ اینترنتی نارو پت": {
    description: "«پت شاپ اینترنتی نارو پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D9%86%D8%AA%D8%B1%D9%86%D8%AA%DB%8C%20%D9%86%D8%A7%D8%B1%D9%88%20%D9%BE%D8%AA&query_place_id=ChIJ-X7zKjTljT8R7hf1JVHgp0E",
  },
  "(کیا پت)": {
    description: "«(کیا پت)» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=Kia%20pet%20(%DA%A9%DB%8C%D8%A7%20%D9%BE%D8%AA)&query_place_id=ChIJs9OceQAFjj8RAbdho6D4ngY",
  },
  "انبار تحویل پت شاپ دانشکده طوطی": {
    description: "«انبار تحویل پت شاپ دانشکده طوطی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران، استان تهران.",
  },
  "پت شاپ دکتر پت": {
    description: "«پت شاپ دکتر پت» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۴.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%BE%D8%AA&query_place_id=ChIJ-0oiAMgdjj8RKm9khhWcmiw",
  },
  "پت شاپ فلافی": {
    description: "«پت شاپ فلافی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%81%D9%84%D8%A7%D9%81%DB%8C&query_place_id=ChIJ1WZCaAAFjj8RwB67dw72UfI",
  },
  "پت شاپ ژیوان رزمال": {
    description: "«پت شاپ ژیوان رزمال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Zivan%20PetShop%20Rose%20Mall%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%98%DB%8C%D9%88%D8%A7%D9%86%20%D8%B1%D8%B2%D9%85%D8%A7%D9%84&query_place_id=ChIJ_XigW3bljT8Rh6ew6qZISWY",
  },
  "پت شاپ دوستان کوچک": {
    description: "«پت شاپ دوستان کوچک» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۱.",
    website: "https://www.google.com/maps/search/?api=1&query=Little%20Friends%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%D9%88%D8%B3%D8%AA%D8%A7%D9%86%20%DA%A9%D9%88%DA%86%DA%A9&query_place_id=ChIJkbjfPwD7jT8Rpt3AdjMnpqE",
  },
  "پت شاپ هاپ هاپ": {
    description: "«پت شاپ هاپ هاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=Hap%20hap%20petshop%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%87%D8%A7%D9%BE%20%D9%87%D8%A7%D9%BE&query_place_id=ChIJQc-hBBHljT8RHay3jvEB8-g",
  },
  "پت شاپ آکوا": {
    description: "«پت شاپ آکوا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ سیلپا": {
    description: "«پت شاپ سیلپا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در میدان دریاچه.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B3%DB%8C%D9%84%D9%BE%D8%A7&query_place_id=ChIJE30mQgDljT8REVMkAikYksE",
  },
  "هاپ میو": {
    description: "«هاپ میو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%87%D8%A7%D9%BE%20%D9%85%DB%8C%D9%88&query_place_id=ChIJycGXRADljT8Ro_vMdbPf1Rw",
  },
  "پت شاپ بارن": {
    description: "«پت شاپ بارن» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در منطقه ۲۱.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A8%D8%A7%D8%B1%D9%86&query_place_id=ChIJxVyKGgDljT8RiPmZuTcIiNQ",
  },
  "پت شاپ ایرانمال": {
    description: "«پت شاپ ایرانمال» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران پارکینگ جی ۱ ستون ، پلاک ۲۰.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%DB%8C%D8%B1%D8%A7%D9%86%D9%85%D8%A7%D9%84&query_place_id=ChIJYYMkKgDljT8RcVUCULQaUN8",
  },
  "پت شاپ پارسیم": {
    description: "«پت شاپ پارسیم» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%A7%D8%B1%D8%B3%DB%8C%D9%85&query_place_id=ChIJaXrmE4Ydjj8RyAPoQ8cXGX4",
  },
  "پت شاپ نیل": {
    description: "«پت شاپ نیل» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%86%DB%8C%D9%84&query_place_id=ChIJQbXCCQAdjj8R2l3fQPy0bI8",
  },
  "پت شاپ کوکو": {
    description: "«پت شاپ کوکو» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D9%88%DA%A9%D9%88&query_place_id=ChIJcyeTGgDljT8Rr9kEb3jFIWk",
  },
  "آکوامارین": {
    description: "«آکوامارین» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%DA%A9%D9%88%D8%A7%D9%85%D8%A7%D8%B1%DB%8C%D9%86&query_place_id=ChIJy3MhGLfvjT8RAjyepyUBOG0",
  },
  "تولیدی ملزومات حیوانات خانگی زاریکس": {
    description: "«تولیدی ملزومات حیوانات خانگی زاریکس» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در جاده محمود آباد، خاورشهر.",
  },
  "پرنده سرای ربیعی": {
    description: "«پرنده سرای ربیعی» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
  },
  "بلک سی": {
    description: "«بلک سی» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%D9%84%DA%A9%20%D8%B3%DB%8C&query_place_id=ChIJkUIuKQDvjT8RgXoA-npPpsQ",
  },
  "پرنده فروشی موسوی": {
    description: "«پرنده فروشی موسوی» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
  },
  "فروشگاه پت شاپ پت جان": {
    description: "«فروشگاه پت شاپ پت جان» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بلوار امام خمینی، نبش بیشه، شهر لواسان.",
  },
  "دامداری نمونه کبیری": {
    description: "«دامداری نمونه کبیری» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان شهریار-ادران، صباشهر.",
  },
  "شهر پرنده لوتینو": {
    description: "«شهر پرنده لوتینو» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
  },
  "کلبه قناری شهربار شعبه ۲": {
    description: "«کلبه قناری شهربار شعبه ۲» — عرضه‌ی دانه و غذای پرنده، قفس و لوازم پرنده، اسباب‌بازی پرنده در تهران.",
  },
  "کلبه حییوانات": {
    description: "«کلبه حییوانات» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بلوار امام خمینی، پلاک ۳۴/۲، تهران.",
    website: "kolbehheyvanat.ir",
  },
  "پت شاپ آمازون": {
    description: "«پت شاپ آمازون» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در تهران.",
  },
  "پت شاپ زوتوپیا": {
    description: "«پت شاپ زوتوپیا» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در بلوار رحیمی، پاکدشت.",
  },
  "پت شاپ هاپ شاپ": {
    description: "«پت شاپ هاپ شاپ» — عرضه‌ی غذای سگ، غذای گربه، اسباب‌بازی، لوازم بهداشتی در خیابان شادی، کرج.",
  },
  "دامپزشکی سیار": {
    description: "«دامپزشکی سیار» — کلینیک دامپزشکی در منطقه ۱۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%DB%8C%D8%A7%D8%B1&query_place_id=ChIJj2gOYAABjj8R9YWt-PMTSmE",
  },
  "بیمارستان تخصصی دانشکده دامپزشکی دانشگاه تهران": {
    description: "«بیمارستان تخصصی دانشکده دامپزشکی دانشگاه تهران» — کلینیک دامپزشکی در خیابان دکتر محمد قریب، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی دانشگاه تهران": {
    description: "«کلینیک دامپزشکی دانشگاه تهران» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%D8%A7%D9%86%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86&query_place_id=ChIJ7y46qeYAjj8RVfaSOWjmZZs",
  },
  "لوازم دامپزشکی و غذای حیوانات آریا": {
    description: "«لوازم دامپزشکی و غذای حیوانات آریا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%84%D9%88%D8%A7%D8%B2%D9%85%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D8%BA%D8%B0%D8%A7%DB%8C%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%A2%D8%B1%DB%8C%D8%A7&query_place_id=ChIJtSu8vngBjj8RzH1FklAsQf4",
  },
  "داروخانه دامپزشکی پارسا": {
    description: "«داروخانه دامپزشکی پارسا» — کلینیک دامپزشکی در تهران، خیابان اسکندری شمالی، نرسیده به فرصت شیرازی، پلاگ ۴۴؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%A7%D8%B1%D8%B3%D8%A7&query_place_id=ChIJwV8cCgkBjj8RvYmqActD4jQ",
  },
  "کلینیک دامپزشکی افشین": {
    description: "«کلینیک دامپزشکی افشین» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A7%D9%81%D8%B4%DB%8C%D9%86&query_place_id=ChIJrXbgMNwBjj8RfZ7uFWPmBLY",
  },
  "کلینیک دامپزشکی رکس": {
    description: "«کلینیک دامپزشکی رکس» — کلینیک دامپزشکی در فرصت شیرازی جنب بانک آینده بالاتر از؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B1%DA%A9%D8%B3&query_place_id=ChIJeeFGSQABjj8RMSjDtjJWU5A",
  },
  "بیمارستان دامپزشکی شبانه روزی خاورمیانه": {
    description: "«بیمارستان دامپزشکی شبانه روزی خاورمیانه» — کلینیک دامپزشکی در خیابان یدالله امیرلو، پلاک ۱۵۶، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.mevh.ir/",
  },
  "دامپزشک (ویزیت، شناسنامه و واکسیناسیون حیوانات خانگی)": {
    description: "«دامپزشک (ویزیت، شناسنامه و واکسیناسیون حیوانات خانگی)» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%20(%D9%88%DB%8C%D8%B2%DB%8C%D8%AA%D8%8C%20%D8%B4%D9%86%D8%A7%D8%B3%D9%86%D8%A7%D9%85%D9%87%20%D9%88%20%D9%88%D8%A7%DA%A9%D8%B3%DB%8C%D9%86%D8%A7%D8%B3%DB%8C%D9%88%D9%86%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C)&query_place_id=ChIJIzDRTd8Bjj8R2f7Fx9Pj0Pg",
  },
  "داروخانه دامپزشکی دکتر فرقانی": {
    description: "«داروخانه دامپزشکی دکتر فرقانی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%81%D8%B1%D9%82%D8%A7%D9%86%DB%8C&query_place_id=ChIJUyKADegAjj8RNLkDcWJkyAE",
  },
  "دکتر پیشی": {
    description: "«دکتر پیشی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%BE%DB%8C%D8%B4%DB%8C&query_place_id=ChIJgQpYYIcBjj8RXIkee3SpShc",
  },
  "کلینیک دامپزشکی شاهو": {
    description: "«کلینیک دامپزشکی شاهو» — کلینیک دامپزشکی در خیابان نصرت، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B4%D8%A7%D9%87%D9%88&query_place_id=ChIJ0xUdAwABjj8R0WB4RDjM6eU",
  },
  "نظام دامپزشکی استان تهران ،": {
    description: "«نظام دامپزشکی استان تهران ،» — کلینیک دامپزشکی در منطقه ۶؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%86%D8%B8%D8%A7%D9%85%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%D9%83%D9%8A%20%D8%A7%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20%D8%8C%20Tehran%20Veterinary%20Council&query_place_id=ChIJk7ZCZ_0Bjj8Rw8FdLwGWQc8",
  },
  "کلینیک تخصصی پرندگان مرکزی": {
    description: "«کلینیک تخصصی پرندگان مرکزی» — کلینیک دامپزشکی در منطقه ۱۰؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D9%85%D8%B1%DA%A9%D8%B2%DB%8C&query_place_id=ChIJk2Gm4_8Bjj8R8-8lRf9OHQA",
  },
  "آزمایشگاه دامپزشکی مرکزی": {
    description: "«آزمایشگاه دامپزشکی مرکزی» — کلینیک دامپزشکی در منطقه ۱۰؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B2%D9%85%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%D8%B1%DA%A9%D8%B2%DB%8C&query_place_id=ChIJZz3KzeUBjj8RyEz70U2FL4M",
  },
  "دامپزشکی پاستور": {
    description: "«دامپزشکی پاستور» — کلینیک دامپزشکی در خیابان پرچم، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "آزمایشگاه دامپزشکی وت": {
    description: "«آزمایشگاه دامپزشکی وت» — کلینیک دامپزشکی در خیابان ستارخان، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک وفا": {
    description: "«کلینیک وفا» — کلینیک دامپزشکی در شکاری، پلاک کوچه، پلاک۸؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D9%88%D9%81%D8%A7&query_place_id=ChIJy9VmlhwBjj8RiIM6yVAXRqE",
  },
  "دامپزشکی تیتی": {
    description: "«دامپزشکی تیتی» — کلینیک دامپزشکی در تهران، منطقه ۶؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AA%DB%8C%D8%AA%DB%8C&query_place_id=ChIJF_P78PUBjj8R2vIShOQVdz0",
  },
  "کلینیک دامپزشکی راد": {
    description: "«کلینیک دامپزشکی راد» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی لارا": {
    description: "«کلینیک دامپزشکی لارا» — کلینیک دامپزشکی در خیابان شاداب، پلاک ۵۸، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی پت پارادایس": {
    description: "«کلینیک دامپزشکی پت پارادایس» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%AA%20%D9%BE%D8%A7%D8%B1%D8%A7%D8%AF%D8%A7%DB%8C%D8%B3&query_place_id=ChIJjbdHlC0Bjj8RFmATN_8JEzc",
  },
  "کلینیک دامپزشکی آویل": {
    description: "«کلینیک دامپزشکی آویل» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%D9%88%DB%8C%D9%84&query_place_id=ChIJ29w3oOoBjj8RJ2sKSkNEi-A",
  },
  "داروخانه دامپزشکی و پتشاپ لبخند": {
    description: "«داروخانه دامپزشکی و پتشاپ لبخند» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D9%BE%D8%AA%D8%B4%D8%A7%D9%BE%20%D9%84%D8%A8%D8%AE%D9%86%D8%AF&query_place_id=ChIJfUyBFgABjj8RLVJ47bE5MLQ",
  },
  "دامپزشکی و پت شاپ دکتر قانع اسلامشهر": {
    description: "«دامپزشکی و پت شاپ دکتر قانع اسلامشهر» — کلینیک دامپزشکی در امامزاده حسن) نبش کوچه رسولی؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%82%D8%A7%D9%86%D8%B9%20%D8%A7%D8%B3%D9%84%D8%A7%D9%85%D8%B4%D9%87%D8%B1&query_place_id=ChIJ92zFAwAHkj8RC2rUPM4QlTs",
  },
  "کلینیک دامپزشکی کژال": {
    description: "«کلینیک دامپزشکی کژال» — کلینیک دامپزشکی در خیابان پروانه، پلاک ۱، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://kajalpetclinic.com",
  },
  "کلینیک دامپزشکی پاندورا": {
    description: "«کلینیک دامپزشکی پاندورا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%A7%D9%86%D8%AF%D9%88%D8%B1%D8%A7&query_place_id=ChIJ4apUfAABjj8RXlOj-Aqrc9s",
  },
  "کلینیک دامپزشکی نبض": {
    description: "«کلینیک دامپزشکی نبض» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%86%D8%A8%D8%B6%20Nabz%20Veterinary%20Clinic&query_place_id=ChIJb6zdh34Hjj8RA3XuxaJ5gKo",
  },
  "کلینیک دامپزشکی یوسف آباد": {
    description: "«کلینیک دامپزشکی یوسف آباد» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DB%8C%D9%88%D8%B3%D9%81%20%D8%A2%D8%A8%D8%A7%D8%AF&query_place_id=ChIJbTKVVQABjj8RZWTg_9mX-_w",
  },
  "شرکت پارس پویش ویتامین": {
    description: "«شرکت پارس پویش ویتامین» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%B4%D8%B1%DA%A9%D8%AA%20%D9%BE%D8%A7%D8%B1%D8%B3%20%D9%BE%D9%88%DB%8C%D8%B4%20%D9%88%DB%8C%D8%AA%D8%A7%D9%85%DB%8C%D9%86&query_place_id=ChIJXxKux2gHjj8Rm8QwGnhbMws",
  },
  "کلینیک دامپزشکی دکتر آلن": {
    description: "«کلینیک دامپزشکی دکتر آلن» — کلینیک دامپزشکی در تهران، بزرگراه شیخ فضل الله نوری شمال بعد از پل ستارخان خیابان شهید شوریده، پلاک۲۰؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%A2%D9%84%D9%86&query_place_id=ChIJM2srMgAHjj8RSQoiTj77McU",
  },
  "کلینیک دامپزشکی گاندو": {
    description: "«کلینیک دامپزشکی گاندو» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%AF%D8%A7%D9%86%D8%AF%D9%88&query_place_id=ChIJOUy6hlAHjj8R3W1TTCYWiwM",
  },
  "کلینیک دامپزشکی رنیسا": {
    description: "«کلینیک دامپزشکی رنیسا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی میلوی": {
    description: "«کلینیک دامپزشکی میلوی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%DB%8C%D9%84%D9%88%DB%8C&query_place_id=ChIJneGOfgABjj8Rn8z-va2zzKU",
  },
  "دامپزشکی پت استار": {
    description: "«دامپزشکی پت استار» — کلینیک دامپزشکی در خیابان دانشگاه هوایی جنوبی، خیابان تفرش شرقی، پلاک ۱۰۸؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%AA%20%D8%A7%D8%B3%D8%AA%D8%A7%D8%B1&query_place_id=ChIJ_a84RAD_jT8R6dP4paRLBHA",
  },
  "کلینیک دامپزشکی آران": {
    description: "«کلینیک دامپزشکی آران» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%D8%B1%D8%A7%D9%86&query_place_id=ChIJw2LhfAADjj8R33J0twsFr7M",
  },
  "دامپزشکی سپن": {
    description: "«دامپزشکی سپن» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%D9%BE%D9%86&query_place_id=ChIJ6RGBEAAHjj8RJm-k-kzEiFg",
  },
  "پت شاپ استارپت (داروخانه دامپزشکی)": {
    description: "«پت شاپ استارپت (داروخانه دامپزشکی)» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%A7%D8%B3%D8%AA%D8%A7%D8%B1%D9%BE%D8%AA%20(%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C)&query_place_id=ChIJ5RB7fAD_kT8RrqjTtBXJfe0",
  },
  "دامپزشکی پرشین": {
    description: "«دامپزشکی پرشین» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی و پت شاپ میلانوپت": {
    description: "«کلینیک دامپزشکی و پت شاپ میلانوپت» — کلینیک دامپزشکی در شیخ بهایی؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%DB%8C%D9%84%D8%A7%D9%86%D9%88%D9%BE%D8%AA&query_place_id=ChIJHbrNcwAHjj8RBX0eO6fV8RQ",
  },
  "کلینیک دامپزشکی یونیک پت": {
    description: "«کلینیک دامپزشکی یونیک پت» — کلینیک دامپزشکی در خیابان کلینیک دامپزشکی یونیک پت، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DB%8C%D9%88%D9%86%DB%8C%DA%A9%20%D9%BE%D8%AA&query_place_id=ChIJRRkkZAADjj8RA_uHXXe5Vyo",
  },
  "بیمارستان دامپزشکی مهر": {
    description: "«بیمارستان دامپزشکی مهر» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%D9%87%D8%B1&query_place_id=ChIJRdIxDwD_kT8RsykYPaqW6CM",
  },
  "سپکا": {
    description: "«سپکا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی مهر": {
    description: "«کلینیک دامپزشکی مهر» — کلینیک دامپزشکی در خیابان احمد بابایی، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی آمازون و پت شاپ": {
    description: "«کلینیک دامپزشکی آمازون و پت شاپ» — کلینیک دامپزشکی در پلاک ۱۰۶- جنب فروشگاه جانبو- طبقه اول-واحد۲  بین ایثار و آریافر؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%D9%85%D8%A7%D8%B2%D9%88%D9%86%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE&query_place_id=ChIJoQxIlE4Hjj8RLNQOSYofDFA",
  },
  "کلینیک دامپزشکی دکتر هومن کریمی": {
    description: "«کلینیک دامپزشکی دکتر هومن کریمی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%87%D9%88%D9%85%D9%86%20%DA%A9%D8%B1%DB%8C%D9%85%DB%8C&query_place_id=ChIJXf340BMHjj8Rw4LtcLaYZvo",
  },
  "دامپزشکی سیار بیمه": {
    description: "«دامپزشکی سیار بیمه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%DB%8C%D8%A7%D8%B1%20%D8%A8%DB%8C%D9%85%D9%87&query_place_id=ChIJK0WuJdb9jT8RaPP_1u4oWqY",
  },
  "کلینیک دامپزشکی دکتر کریمی": {
    description: "«کلینیک دامپزشکی دکتر کریمی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشک خوب": {
    description: "«کلینیک دامپزشک خوب» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "مرکز نگهداری از حیوانات آزمایشگاهی": {
    description: "«مرکز نگهداری از حیوانات آزمایشگاهی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک تخصصی دامپزشکی پاندا": {
    description: "«کلینیک تخصصی دامپزشکی پاندا» — کلینیک دامپزشکی در شهرک اکباتان، کوی بیمه، بیمه دوم، بالاتر از میدان سالاری، نبش بنبست ۲۷ پلاک ۴۳، طبقه اول؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%A7%D9%86%D8%AF%D8%A7&query_place_id=ChIJuyLwBUz9jT8Ra6P4OK0YYzQ",
  },
  "دامپزشکی و پت شاپ جوجوپت": {
    description: "«دامپزشکی و پت شاپ جوجوپت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AC%D9%88%D8%AC%D9%88%D9%BE%D8%AA&query_place_id=ChIJWbnnRAADjj8RAbcFJaxUABg",
  },
  "کلینیک دامپزشکی و پت شاپ فراپت": {
    description: "«کلینیک دامپزشکی و پت شاپ فراپت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%81%D8%B1%D8%A7%D9%BE%D8%AA&query_place_id=ChIJIdrDTvP9jT8RQVnbr9mwMsw",
  },
  "درمانگاه دامپزشکی پت لایف": {
    description: "«درمانگاه دامپزشکی پت لایف» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی مرزداران": {
    description: "«کلینیک دامپزشکی مرزداران» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%D8%B1%D8%B2%D8%AF%D8%A7%D8%B1%D8%A7%D9%86&query_place_id=ChIJ_5tcNAD9jT8RPoF7OKAro3U",
  },
  "دامپزشک میلاد": {
    description: "«دامپزشک میلاد» — کلینیک دامپزشکی در منطقه ۶؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%20%D9%85%DB%8C%D9%84%D8%A7%D8%AF&query_place_id=ChIJtzWoWscGjj8R1XbaznkhUeg",
  },
  "کلینیک دامپزشکی شهرک": {
    description: "«کلینیک دامپزشکی شهرک» — کلینیک دامپزشکی در کوچه تیرداد کوچه توحید پلاک ۴۷؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B4%D9%87%D8%B1%DA%A9&query_place_id=ChIJG9o_KwD9jT8RuD9ACRtkgmM",
  },
  "کلینیک دامپزشکی ژو": {
    description: "«کلینیک دامپزشکی ژو» — کلینیک دامپزشکی در خیابان خرمشهر، پلاک ۵۱، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=Zho%20pet%20clinic%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%98%D9%88&query_place_id=ChIJ9URyDwADjj8RMGTJa3_y7t4",
  },
  "کلینیک دامپزشکی پیروز": {
    description: "«کلینیک دامپزشکی پیروز» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%DB%8C%D8%B1%D9%88%D8%B2&query_place_id=ChIJOxo_bP_9jT8RE9ZCbBsxrSo",
  },
  "کلینیک دامپزشکی سهروردی": {
    description: "«کلینیک دامپزشکی سهروردی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی جزیره حیوانات": {
    description: "«کلینیک دامپزشکی جزیره حیوانات» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AC%D8%B2%DB%8C%D8%B1%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJaw80UAD9jT8RxRuZ4CE494E",
  },
  "کلینیک دامپزشکی کارما گیتی": {
    description: "«کلینیک دامپزشکی کارما گیتی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%A9%D8%A7%D8%B1%D9%85%D8%A7%20%DA%AF%DB%8C%D8%AA%DB%8C&query_place_id=ChIJJwSqQQD9jT8RD_91CbEoOcw",
  },
  "کلینیک دامپزشکی آراز": {
    description: "«کلینیک دامپزشکی آراز» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی وت ایران": {
    description: "«کلینیک دامپزشکی وت ایران» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشک سیار در تهران - آدلین پت": {
    description: "«دامپزشک سیار در تهران - آدلین پت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%20%D8%B3%DB%8C%D8%A7%D8%B1%20%D8%AF%D8%B1%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20-%20%D8%A2%D8%AF%D9%84%DB%8C%D9%86%20%D9%BE%D8%AA&query_place_id=ChIJQVJ8PgADjj8RQ840umWpEco",
  },
  "بیمارستان دامپزشکی مانوک": {
    description: "«بیمارستان دامپزشکی مانوک» — کلینیک دامپزشکی در منطقه ۳؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%D8%A7%D9%86%D9%88%DA%A9&query_place_id=ChIJ6-EjJgAHjj8RNxvglh-qH94",
  },
  "کلینیک دامپزشکی و آرایشگاه حیوانات کارو": {
    description: "«کلینیک دامپزشکی و آرایشگاه حیوانات کارو» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%DA%A9%D8%A7%D8%B1%D9%88&query_place_id=ChIJFXFdBwAHjj8RKZOW9JQn3oA",
  },
  "کلینیک دامپزشکی آوید": {
    description: "«کلینیک دامپزشکی آوید» — کلینیک دامپزشکی در فاز دو شهرک اکباتان، شهرک اکباتان، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%83%D9%84%D9%8A%D9%86%D9%8A%D9%83%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%D9%83%D9%8A%20%D8%A2%D9%88%D9%8A%D8%AF&query_place_id=ChIJy-RqhgP9jT8RosY5_Ho2hXg",
  },
  "بیمارستان دامپزشکی اکسیژن": {
    description: "«بیمارستان دامپزشکی اکسیژن» — کلینیک دامپزشکی در خیابان ستاری، پلاک ۲۴، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A7%DA%A9%D8%B3%DB%8C%DA%98%D9%86&query_place_id=ChIJ3W3yAQADjj8RugVk8fF8TYk",
  },
  "کلینیک دامپزشکی و پت شاپ سبلان": {
    description: "«کلینیک دامپزشکی و پت شاپ سبلان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B3%D8%A8%D9%84%D8%A7%D9%86&query_place_id=ChIJZ38JQxwDjj8Rv6QC8K4ySGE",
  },
  "کلینیک دامپزشکی سبلان": {
    description: "«کلینیک دامپزشکی سبلان» — کلینیک دامپزشکی در منطقه ۸؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%D8%A8%D9%84%D8%A7%D9%86&query_place_id=ChIJxfVBSwADjj8R7xvBekSU-3w",
  },
  "بیمارستان دامپزشکی پندار": {
    description: "«بیمارستان دامپزشکی پندار» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D9%86%D8%AF%D8%A7%D8%B1&query_place_id=ChIJpUBxRgAHjj8RGCheD1uRgok",
  },
  "کلینیک دامپزشکی اختصاصی پرندگان غرب": {
    description: "«کلینیک دامپزشکی اختصاصی پرندگان غرب» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A7%D8%AE%D8%AA%D8%B5%D8%A7%D8%B5%DB%8C%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D8%BA%D8%B1%D8%A8&query_place_id=ChIJ4R2I0QD9jT8R5mDSnhm2K1c",
  },
  "کلینیک دامپزشکی زرین": {
    description: "«کلینیک دامپزشکی زرین» — کلینیک دامپزشکی در بلوار نلسون ماندلا، پلاک ۳۵، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B2%D8%B1%DB%8C%D9%86&query_place_id=ChIJa5HmRgAHjj8R8o8Xbtu8tFM",
  },
  "کلینیک دامپزشکی اولکا": {
    description: "«کلینیک دامپزشکی اولکا» — کلینیک دامپزشکی در شهرک اکباتان- فاز۲- بلوک ۶-زیرشاخه۴، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.instagram.com/olkapetclinic",
  },
  "پلی کلینیک دامپزشکی فران": {
    description: "«پلی کلینیک دامپزشکی فران» — کلینیک دامپزشکی در منطقه ۳؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D9%84%DB%8C%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%81%D8%B1%D8%A7%D9%86&query_place_id=ChIJL5eIKQAHjj8RBtsEnisjsdQ",
  },
  "بیمارستان دامپزشکی پرندگان سانا": {
    description: "«بیمارستان دامپزشکی پرندگان سانا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%D9%8A%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D8%B3%D8%A7%D9%86%D8%A7&query_place_id=ChIJdwvnn3r9jT8R62n-eDBzQGs",
  },
  "بیمارستان دامپزشکی تخصصی پرندگان سانا": {
    description: "«بیمارستان دامپزشکی تخصصی پرندگان سانا» — کلینیک دامپزشکی در خیابان هشتم شرقی، پلاک ۲، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.aviansana.com",
  },
  "کلینیک دامپزشکی تریتا": {
    description: "«کلینیک دامپزشکی تریتا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی سیار هوم پت": {
    description: "«دامپزشکی سیار هوم پت» — کلینیک دامپزشکی در منطقه ۳؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%DB%8C%D8%A7%D8%B1%20%D9%87%D9%88%D9%85%20%D9%BE%D8%AA&query_place_id=ChIJrbIRDwAHjj8RMLEWc2dMoPY",
  },
  "کلینیک دامپزشکی دکتر افشار": {
    description: "«کلینیک دامپزشکی دکتر افشار» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%A7%D9%81%D8%B4%D8%A7%D8%B1&query_place_id=ChIJMfEDTgADjj8RD3Io0zQi7f4",
  },
  "پت کلینیک (دکتر نادر آزادی)": {
    description: "«پت کلینیک (دکتر نادر آزادی)» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی مسیحا": {
    description: "«کلینیک دامپزشکی مسیحا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی نیل پت": {
    description: "«کلینیک دامپزشکی نیل پت» — کلینیک دامپزشکی در خیابان سعید اسلامیان، پلاک ۳۲، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.instagram.com/nilpet_clinic/profilecard/?igsh=MXNpNHVobTI2YnZwNA==",
  },
  "مرکز تخصصی دامپزشکی ونک ، دکتر عباس وشکینی": {
    description: "«مرکز تخصصی دامپزشکی ونک ، دکتر عباس وشکینی» — کلینیک دامپزشکی در منطقه ۳؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B1%DA%A9%D8%B2%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%D9%86%DA%A9%20%D8%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B9%D8%A8%D8%A7%D8%B3%20%D9%88%D8%B4%DA%A9%DB%8C%D9%86%DB%8C&query_place_id=ChIJ-8ISruQHjj8R5k8UTOjkpfA",
  },
  "کلینیک دامپزشکی روژان": {
    description: "«کلینیک دامپزشکی روژان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B1%D9%88%DA%98%D8%A7%D9%86&query_place_id=ChIJZwf6vY0Djj8RvJUPdT6Nj1Y",
  },
  "کلینیک دامپزشکی دکتر مکرم": {
    description: "«کلینیک دامپزشکی دکتر مکرم» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%85%DA%A9%D8%B1%D9%85&query_place_id=ChIJSb4sCQD9jT8R6W-CQaQjLFU",
  },
  "بیمارستان دامپزشکی حیات": {
    description: "«بیمارستان دامپزشکی حیات» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AD%DB%8C%D8%A7%D8%AA&query_place_id=ChIJC_HKEWv9jT8RDU1Q4a9IXeQ",
  },
  "پلی کلینیک دامپزشکی ما": {
    description: "«پلی کلینیک دامپزشکی ما» — کلینیک دامپزشکی در شهرک غرب . بلوار دادمان .تقاطع شجریان شمالی، پلاک ۶۰، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://mavetpolyclinic.com/",
  },
  "بیمارستان دامپزشکی شبانه روزی رویال": {
    description: "«بیمارستان دامپزشکی شبانه روزی رویال» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%D9%8A%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%D9%83%D9%8A%20%D8%B4%D8%A8%D8%A7%D9%86%D9%87%20%D8%B1%D9%88%D8%B2%D9%8A%20%D8%B1%D9%88%D9%8A%D8%A7%D9%84&query_place_id=ChIJEc8YfwD9jT8RK2qEX1Q_2Sw",
  },
  "دامپزشکی پرندگان طوطی وت": {
    description: "«دامپزشکی پرندگان طوطی وت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D8%B7%D9%88%D8%B7%DB%8C%20%D9%88%D8%AA&query_place_id=ChIJOezHVQAHjj8RaUGy4Xd1xak",
  },
  "کلینیک دامپزشکی و پت شاپ کایا": {
    description: "«کلینیک دامپزشکی و پت شاپ کایا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D8%A7%DB%8C%D8%A7&query_place_id=ChIJIRBYfwD9jT8Ryyl9hqmSa_g",
  },
  "درمانگاه دامپزشکی کارو غرب": {
    description: "«درمانگاه دامپزشکی کارو غرب» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی پایتخت": {
    description: "«دامپزشکی پایتخت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی وایتال": {
    description: "«کلینیک دامپزشکی وایتال» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%D8%A7%DB%8C%D8%AA%D8%A7%D9%84%20vital&query_place_id=ChIJoyCwHgAHjj8RvjMMLCamng8",
  },
  "بیمارستان دامپزشکی فوق تخصص اطلس": {
    description: "«بیمارستان دامپزشکی فوق تخصص اطلس» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی تریتا میرداماد": {
    description: "«کلینیک دامپزشکی تریتا میرداماد» — کلینیک دامپزشکی در منطقه ۳؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AA%D8%B1%DB%8C%D8%AA%D8%A7%20%D9%85%DB%8C%D8%B1%D8%AF%D8%A7%D9%85%D8%A7%D8%AF&query_place_id=ChIJF63NQwAFjj8ROhhfUygJejY",
  },
  "کلینیک دامپزشکی سیاره حیوانات": {
    description: "«کلینیک دامپزشکی سیاره حیوانات» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%DB%8C%D8%A7%D8%B1%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJMRb7CQAHjj8RmERIjcuPI4A",
  },
  "دامپزشکی هاچیکو": {
    description: "«دامپزشکی هاچیکو» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی رایا": {
    description: "«کلینیک دامپزشکی رایا» — کلینیک دامپزشکی در شهرک غرب، خیابان سپهر، پلاک ۲۵، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "داروخانه دامپزشکی نوین فارماوت": {
    description: "«داروخانه دامپزشکی نوین فارماوت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%86%D9%88%DB%8C%D9%86%20%D9%81%D8%A7%D8%B1%D9%85%D8%A7%D9%88%D8%AA&query_place_id=ChIJXz_AFZcCjj8RJAhqzS6r5Bg",
  },
  "دامپزشکی سیار مهراد": {
    description: "«دامپزشکی سیار مهراد» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%DB%8C%D8%A7%D8%B1%20%D9%85%D9%87%D8%B1%D8%A7%D8%AF&query_place_id=ChIJwYVGFQD9jT8RaXeCaZjjH-k",
  },
  "جراحی عقیم سازی": {
    description: "«جراحی عقیم سازی» — کلینیک دامپزشکی در تهران، بلوار ابوذر، بین پل اول و دوم، کوچه ۴ شرقی (مرادی دوست) پلاک ۱۸، پل اول؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AC%D8%B1%D8%A7%D8%AD%DB%8C%20%D8%B9%D9%82%DB%8C%D9%85%20%D8%B3%D8%A7%D8%B2%DB%8C&query_place_id=ChIJO5vKV7D9kT8RJBY2FQq6e-w",
  },
  "جراحی و عقیم سازی حیوانات شرق": {
    description: "«جراحی و عقیم سازی حیوانات شرق» — کلینیک دامپزشکی در ۴؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AC%D8%B1%D8%A7%D8%AD%DB%8C%20%D9%88%20%D8%B9%D9%82%DB%8C%D9%85%20%D8%B3%D8%A7%D8%B2%DB%8C%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%B4%D8%B1%D9%82&query_place_id=ChIJkfZGDMn9kT8RT5LyOs01o7Y",
  },
  "کشتارگاه حیوانات - غیر حمایتی": {
    description: "«کشتارگاه حیوانات - غیر حمایتی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D8%B4%D8%AA%D8%A7%D8%B1%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20-%20%D8%BA%DB%8C%D8%B1%20%D8%AD%D9%85%D8%A7%DB%8C%D8%AA%DB%8C&query_place_id=ChIJ_b-BC579kT8RDRAbI1HGIwc",
  },
  "کلینیک دامپزشکی دکتر پیمان فرهی": {
    description: "«کلینیک دامپزشکی دکتر پیمان فرهی» — کلینیک دامپزشکی در خیابان سی متری نیروی هوایی، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%BE%DB%8C%D9%85%D8%A7%D9%86%20%D9%81%D8%B1%D9%87%DB%8C&query_place_id=ChIJqf4_WJ4Djj8Ru-USwoITeqw",
  },
  "کلینیک دامپزشکی دکتر پیمان معصومی": {
    description: "«کلینیک دامپزشکی دکتر پیمان معصومی» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%BE%DB%8C%D9%85%D8%A7%D9%86%20%D9%85%D8%B9%D8%B5%D9%88%D9%85%DB%8C&query_place_id=ChIJk4qZYwAHjj8R0FJ_IrFFVNg",
  },
  "کلینیک دامپزشکی پتی مان": {
    description: "«کلینیک دامپزشکی پتی مان» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%AA%DB%8C%20%D9%85%D8%A7%D9%86&query_place_id=ChIJ9XJXxL4Hjj8RyscMP8RUuBA",
  },
  "مرکز تشخیص دامپزشکی پرتو": {
    description: "«مرکز تشخیص دامپزشکی پرتو» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B1%DA%A9%D8%B2%20%D8%AA%D8%B4%D8%AE%DB%8C%D8%B5%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%B1%D8%AA%D9%88&query_place_id=ChIJ45zyAAAFjj8RCcE4zTS5FHg",
  },
  "کلینیک دامپزشکی پناه": {
    description: "«کلینیک دامپزشکی پناه» — کلینیک دامپزشکی در بلوار دریا غربی، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "بیمارستان دامپزشکی زی": {
    description: "«بیمارستان دامپزشکی زی» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B2%DB%8C%20zee%20pet%20hospital&query_place_id=ChIJP_guYwAHjj8RiDrDz2hUFXo",
  },
  "کلینیک دامپزشکی تارا": {
    description: "«کلینیک دامپزشکی تارا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "بیمارستان دامپزشکی تهران غرب": {
    description: "«بیمارستان دامپزشکی تهران غرب» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.tehranpet.com/",
  },
  "کلینیک دامپزشکی رایبد": {
    description: "«کلینیک دامپزشکی رایبد» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B1%D8%A7%DB%8C%D8%A8%D8%AF&query_place_id=ChIJDdNoYAAFjj8R5g-XwPCmqrk",
  },
  "دامپزشکی تهران پلاس": {
    description: "«دامپزشکی تهران پلاس» — کلینیک دامپزشکی در خیابان ناطق نوری، پلاک ۳۰، شهر تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی غرب": {
    description: "«دامپزشکی غرب» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی بهار": {
    description: "«کلینیک دامپزشکی بهار» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A8%D9%87%D8%A7%D8%B1&query_place_id=ChIJm0lIJVr9jT8R99FkxnR_N3Q",
  },
  "کلینیک دامپزشکی آتیکا": {
    description: "«کلینیک دامپزشکی آتیکا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%D8%AA%DB%8C%DA%A9%D8%A7&query_place_id=ChIJIU48ZgADjj8RG9JwDNaAJRk",
  },
  "کلینیک دامپزشکی آوانو (Avano Clinic)": {
    description: "«کلینیک دامپزشکی آوانو (Avano Clinic)» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%D9%88%D8%A7%D9%86%D9%88%20(Avano%20Veterinary%20Clinic)&query_place_id=ChIJ9diyZQAFjj8R49MihcYSu7c",
  },
  "بیمارستان حیوانات منصوری ( منصور پلنگ )": {
    description: "«بیمارستان حیوانات منصوری ( منصور پلنگ )» — کلینیک دامپزشکی در منطقه ۲۰؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%85%D9%86%D8%B5%D9%88%D8%B1%DB%8C%20(%20%D9%85%D9%86%D8%B5%D9%88%D8%B1%20%D9%BE%D9%84%D9%86%DA%AF%20)&query_place_id=ChIJR6EvXQD_kT8Rg2MEtlZwlRI",
  },
  "بستری و پانسیون گربه ماناپت": {
    description: "«بستری و پانسیون گربه ماناپت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%D8%B3%D8%AA%D8%B1%DB%8C%20%D9%88%20%D9%BE%D8%A7%D9%86%D8%B3%DB%8C%D9%88%D9%86%20%DA%AF%D8%B1%D8%A8%D9%87%20%D9%85%D8%A7%D9%86%D8%A7%D9%BE%D8%AA&query_place_id=ChIJv0I-PwD9jT8RABOjRHYiy8o",
  },
  "پلی کلینیک دامپزشکی سفید": {
    description: "«پلی کلینیک دامپزشکی سفید» — کلینیک دامپزشکی در خیابان مهرشاد، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی لیام": {
    description: "«کلینیک دامپزشکی لیام» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%84%DB%8C%D8%A7%D9%85&query_place_id=ChIJoS4MEwADjj8RggD8s4MYZZI",
  },
  "کلینیک دامپزشکی و پت شاپ پیچا": {
    description: "«کلینیک دامپزشکی و پت شاپ پیچا» — کلینیک دامپزشکی در بلوار پونک، پلاک ۱۵؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "مرکز تصویربرداری دامپزشکی تابش": {
    description: "«مرکز تصویربرداری دامپزشکی تابش» — کلینیک دامپزشکی در خیابان اتوبان ستاری جنوب، بعد از چهارراه مخبری، ساختمان صدرا، پلاک ۱۱۶، طبقه اول، واحد ۶، پلاک ۱۱۶، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی رد کارپت": {
    description: "«کلینیک دامپزشکی رد کارپت» — کلینیک دامپزشکی در خیابان شهرآرا، نیایش، جنب ملکوتی، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B1%D8%AF%20%DA%A9%D8%A7%D8%B1%D9%BE%D8%AA&query_place_id=ChIJgR9WMQABjj8RZoPlmKrJUqw",
  },
  "کلینیک دامپزشکی وال": {
    description: "«کلینیک دامپزشکی وال» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%D8%A7%D9%84&query_place_id=ChIJyb4gBgD9jT8RaTCYmQZSshI",
  },
  "داروخانه دامپزشکی دکتر سیف": {
    description: "«داروخانه دامپزشکی دکتر سیف» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B3%DB%8C%D9%81&query_place_id=ChIJsebdHkEHjj8Rj2BloOodwNc",
  },
  "دامپزشکی حامی هلث": {
    description: "«دامپزشکی حامی هلث» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AD%D8%A7%D9%85%DB%8C%20%D9%87%D9%84%D8%AB%20%7C%20Hami%20Health%20Pet%20Clinic&query_place_id=ChIJx17yTQD9jT8RMbEUA_U9bL8",
  },
  "اداره دامپزشکی شهر ری": {
    description: "«اداره دامپزشکی شهر ری» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A7%D8%AF%D8%A7%D8%B1%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%D9%83%D9%89%20%D8%B4%D9%87%D8%B1%20%D8%B1%D9%89&query_place_id=ChIJBVzb8Kb-kT8RJHrvqF-ww-s",
  },
  "کلینیک فیزیوتراپی حیوانات خانگی فیزیوپت": {
    description: "«کلینیک فیزیوتراپی حیوانات خانگی فیزیوپت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D9%81%DB%8C%D8%B2%DB%8C%D9%88%D8%AA%D8%B1%D8%A7%D9%BE%DB%8C%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D9%81%DB%8C%D8%B2%DB%8C%D9%88%D9%BE%D8%AA&query_place_id=ChIJ5fxo3a79jT8RbHhN_S2CVfM",
  },
  "دامپزشکی دکتر نسیم نجل حسن": {
    description: "«دامپزشکی دکتر نسیم نجل حسن» — کلینیک دامپزشکی در تهران٫ پلاک ۱۳ واحد ۶۹  ٫بلوار گلشهر؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%86%D8%B3%DB%8C%D9%85%20%D9%86%D8%AC%D9%84%20%D8%AD%D8%B3%D9%86&query_place_id=ChIJER0vHwAHjj8RfOTlbGT0ktY",
  },
  "کلینیک دامپزشکی دکتر صارمی": {
    description: "«کلینیک دامپزشکی دکتر صارمی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B5%D8%A7%D8%B1%D9%85%DB%8C&query_place_id=ChIJRbcHtrgDjj8Remy7KfeoXt4",
  },
  "کلینیک دامپزشکی آبان": {
    description: "«کلینیک دامپزشکی آبان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%D8%A8%D8%A7%D9%86&query_place_id=ChIJ8S4IPwD9jT8RuhyzClMNmrg",
  },
  "داروخانه دامپزشکی مدپتس": {
    description: "«داروخانه دامپزشکی مدپتس» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%D8%AF%D9%BE%D8%AA%D8%B3&query_place_id=ChIJZ78wUQAHjj8RCHCmHhXyB2s",
  },
  "کلینیک تخصصی آبزیان و ماهیان آکواریومی و زینتی": {
    description: "«کلینیک تخصصی آبزیان و ماهیان آکواریومی و زینتی» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D8%A2%D8%A8%D8%B2%DB%8C%D8%A7%D9%86%20%D9%88%20%D9%85%D8%A7%D9%87%DB%8C%D8%A7%D9%86%20%D8%A2%DA%A9%D9%88%D8%A7%D8%B1%DB%8C%D9%88%D9%85%DB%8C%20%D9%88%20%D8%B2%DB%8C%D9%86%D8%AA%DB%8C&query_place_id=ChIJd_dKfAAHjj8RdecZsFj41fg",
  },
  "کلینیک دامپزشکی دوست خوب": {
    description: "«کلینیک دامپزشکی دوست خوب» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%D9%88%D8%B3%D8%AA%20%D8%AE%D9%88%D8%A8&query_place_id=ChIJk9DRAwAHjj8Rik-CEMDAY6A",
  },
  "کلینیک دامپزشکی دکتر حاجی زاده": {
    description: "«کلینیک دامپزشکی دکتر حاجی زاده» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%AD%D8%A7%D8%AC%DB%8C%20%D8%B2%D8%A7%D8%AF%D9%87&query_place_id=ChIJSy2_XQD9jT8R1qKDo4JQges",
  },
  "کلینیک دامپزشکی دکتر صابرنیا": {
    description: "«کلینیک دامپزشکی دکتر صابرنیا» — کلینیک دامپزشکی در منطقه ۵؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B5%D8%A7%D8%A8%D8%B1%D9%86%DB%8C%D8%A7&query_place_id=ChIJYcRTVD39jT8RIfkRYdve7i8",
  },
  "دامپزشک": {
    description: "«دامپزشک» — کلینیک دامپزشکی در پلاک ۴۰؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9&query_place_id=ChIJLRAoL2cFjj8Rytx0OCvyiQA",
  },
  "دامپزشک آنلاین شبانه روزی": {
    description: "«دامپزشک آنلاین شبانه روزی» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%20%D8%A2%D9%86%D9%84%D8%A7%DB%8C%D9%86%20%D8%B4%D8%A8%D8%A7%D9%86%D9%87%20%D8%B1%D9%88%D8%B2%DB%8C&query_place_id=ChIJd2D_cLgHjj8Rkh7MScWQy8c",
  },
  "دامپزشکی شهرزاد": {
    description: "«دامپزشکی شهرزاد» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B4%D9%87%D8%B1%D8%B2%D8%A7%D8%AF&query_place_id=ChIJgSmePjwEjj8R7BoFpY39tbA",
  },
  "کلینیک دامپزشکی آینده": {
    description: "«کلینیک دامپزشکی آینده» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%DB%8C%D9%86%D8%AF%D9%87&query_place_id=ChIJD0OhCQAHjj8R4duHyms5th4",
  },
  "کلینیک دامپزشکی ریکو": {
    description: "«کلینیک دامپزشکی ریکو» — کلینیک دامپزشکی در خیابان سوم شرقی، پلاک ۱۷؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "http://rikovetclinic.com/",
  },
  "کلینیک و مرکز جراحی دامپزشکی دنا": {
    description: "«کلینیک و مرکز جراحی دامپزشکی دنا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=DENA%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D9%88%20%D9%85%D8%B1%DA%A9%D8%B2%20%D8%AC%D8%B1%D8%A7%D8%AD%DB%8C%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%D9%86%D8%A7&query_place_id=ChIJs0k-HAAHjj8RuYE7kn1hIAk",
  },
  "مرکز تصویربرداری دامپزشکی دکتر ماسوله": {
    description: "«مرکز تصویربرداری دامپزشکی دکتر ماسوله» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B1%DA%A9%D8%B2%20%D8%AA%D8%B5%D9%88%DB%8C%D8%B1%D8%A8%D8%B1%D8%AF%D8%A7%D8%B1%DB%8C%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%85%D8%A7%D8%B3%D9%88%D9%84%D9%87&query_place_id=ChIJ02FmMQAHjj8RTLzNQPKX7_U",
  },
  "پلی کلینیک پتسار": {
    description: "«پلی کلینیک پتسار» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D9%84%DB%8C%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D9%BE%D8%AA%D8%B3%D8%A7%D8%B1&query_place_id=ChIJGURw3cgHjj8R-PAXuEnnaj4",
  },
  "کلینیک دامپزشکی پاسداران": {
    description: "«کلینیک دامپزشکی پاسداران» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%A7%D8%B3%D8%AF%D8%A7%D8%B1%D8%A7%D9%86&query_place_id=ChIJJdIicWkFjj8Rc_jrW08KKgE",
  },
  "کلینیک دامپزشکی دکتر علیرضا مقدم": {
    description: "«کلینیک دامپزشکی دکتر علیرضا مقدم» — کلینیک دامپزشکی در شهرزیبا میدان کودک جنب بانک کشاورزی پلاک ۴۷ طبقه، اول؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B9%D9%84%DB%8C%D8%B1%D8%B6%D8%A7%20%D9%85%D9%82%D8%AF%D9%85&query_place_id=ChIJMR4KLWH9jT8RbLb1OW9heAk",
  },
  "دنیا حیوانات": {
    description: "«دنیا حیوانات» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D9%86%DB%8C%D8%A7%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJ1Yo4dTAHjj8R1MQHNx842Fg",
  },
  "کلینیک دامپزشکی لبخند حیوانات": {
    description: "«کلینیک دامپزشکی لبخند حیوانات» — کلینیک دامپزشکی در بلوار شهید غلامرضا مخبری، پلاک ۲۶۶، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://labkhandheyvanat.ir/",
  },
  "پلی کلینیک دامپزشکی آمیگو": {
    description: "«پلی کلینیک دامپزشکی آمیگو» — کلینیک دامپزشکی در خیابان نبش آسمان هشتم شرقی(قره چلویی) پلاک ۲۸، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلنیک دامپزشکی پارسا": {
    description: "«کلنیک دامپزشکی پارسا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی ماهور افسریه": {
    description: "«کلینیک دامپزشکی ماهور افسریه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%D8%A7%D9%87%D9%88%D8%B1%20%D8%A7%D9%81%D8%B3%D8%B1%DB%8C%D9%87&query_place_id=ChIJ5_h2UQD9kT8R9YNwg3d1r_o",
  },
  "کلینیک دامپزشکی هیل": {
    description: "«کلینیک دامپزشکی هیل» — کلینیک دامپزشکی در میدان ملت؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%87%DB%8C%D9%84&query_place_id=ChIJB2w4LwADjj8RZx7HS06moj8",
  },
  "کلینیک دامپزشکی پاسداران پلاس": {
    description: "«کلینیک دامپزشکی پاسداران پلاس» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%A7%D8%B3%D8%AF%D8%A7%D8%B1%D8%A7%D9%86%20%D9%BE%D9%84%D8%A7%D8%B3&query_place_id=ChIJT6IjVwAFjj8RIVwiPg0uAqo",
  },
  "کلینیک دامپزشکی دیاکوپت": {
    description: "«کلینیک دامپزشکی دیاکوپت» — کلینیک دامپزشکی در تهران، سعادت اباد نبش خیابان ۲۹ شرقی پلاک ۴؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DB%8C%D8%A7%DA%A9%D9%88%D9%BE%D8%AA&query_place_id=ChIJ2QPqXJAHjj8RmfgRzbWMX20",
  },
  "بیمارستان حیوانات خانگی حمیدرضا فتاحیان (غرب)": {
    description: "«بیمارستان حیوانات خانگی حمیدرضا فتاحیان (غرب)» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D8%AD%D9%85%DB%8C%D8%AF%D8%B1%D8%B6%D8%A7%20%D9%81%D8%AA%D8%A7%D8%AD%DB%8C%D8%A7%D9%86%20(%D8%BA%D8%B1%D8%A8)&query_place_id=ChIJPd3eDAD9jT8Rx-01VDUIy3E",
  },
  "بیمارستان دامپزشکی شرق": {
    description: "«بیمارستان دامپزشکی شرق» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B4%D8%B1%D9%82&query_place_id=ChIJKQPqZgADjj8RjWSoA2z-Igs",
  },
  "داروخانه دامپزشکی شرق": {
    description: "«داروخانه دامپزشکی شرق» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D8%B1%D9%88%D8%AE%D8%A7%D9%86%D9%87%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B4%D8%B1%D9%82&query_place_id=ChIJE3JUZAADjj8R1-PBJOIzkto",
  },
  "بیمارستان دامپزشکی دورین": {
    description: "«بیمارستان دامپزشکی دورین» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "بیمارستان دامپزشکی شبانه روزی درین": {
    description: "«بیمارستان دامپزشکی شبانه روزی درین» — کلینیک دامپزشکی در بزرگراه شهید سلیمانی؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B4%D8%A8%D8%A7%D9%86%D9%87%20%D8%B1%D9%88%D8%B2%DB%8C%20%D8%AF%D8%B1%DB%8C%D9%86&query_place_id=ChIJu71HbwADjj8RufaM-qN3_hA",
  },
  "کلینیک دامپزشکی شبانه روزی درین": {
    description: "«کلینیک دامپزشکی شبانه روزی درین» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B4%D8%A8%D8%A7%D9%86%D9%87%20%D8%B1%D9%88%D8%B2%DB%8C%20%D8%AF%D8%B1%DB%8C%D9%86&query_place_id=ChIJU9NxCgADjj8RYxay-B8_wfA",
  },
  "کلینیک جراحی حیوانات خانگی درین": {
    description: "«کلینیک جراحی حیوانات خانگی درین» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AC%D8%B1%D8%A7%D8%AD%DB%8C%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D8%AE%D8%A7%D9%86%DA%AF%DB%8C%20%D8%AF%D8%B1%DB%8C%D9%86&query_place_id=ChIJleQ9ZAADjj8RQY8743f5CqY",
  },
  "کلینیک پرندگان و حیوانات خانگی درین": {
    description: "«کلینیک پرندگان و حیوانات خانگی درین» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "آرایشگاه حیوانات پت آرا _ بهنام تقی زاده": {
    description: "«آرایشگاه حیوانات پت آرا _ بهنام تقی زاده» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA%20%D9%BE%D8%AA%20%D8%A2%D8%B1%D8%A7%20_%20%D8%A8%D9%87%D9%86%D8%A7%D9%85%20%D8%AA%D9%82%DB%8C%20%D8%B2%D8%A7%D8%AF%D9%87&query_place_id=ChIJJQnBVwADjj8RB0txaZYdBX4",
  },
  "دامپزشکی نیایش": {
    description: "«دامپزشکی نیایش» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%86%DB%8C%D8%A7%DB%8C%D8%B4&query_place_id=ChIJ0yMLNwD9jT8RhonlzBFELuo",
  },
  "بیمارستان دامپزشکی دکتر عابدی": {
    description: "«بیمارستان دامپزشکی دکتر عابدی» — کلینیک دامپزشکی در منطقه ۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B9%D8%A7%D8%A8%D8%AF%DB%8C&query_place_id=ChIJ-8-LawAHjj8RyAxk-txMkfs",
  },
  "کلینیک دامپزشکی لوتوس": {
    description: "«کلینیک دامپزشکی لوتوس» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "پت شاپ پت لند": {
    description: "«پت شاپ پت لند» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%BE%D8%AA%20%D9%84%D9%86%D8%AF&query_place_id=ChIJKWYKGAAHjj8Rdy0WQJ00fws",
  },
  "کلینیک دامپزشکی غزال": {
    description: "«کلینیک دامپزشکی غزال» — کلینیک دامپزشکی در منطقه ۸؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%BA%D8%B2%D8%A7%D9%84&query_place_id=ChIJRXK6CdgCjj8RyvCIBa-vKUE",
  },
  "بیمارستان حیوانات خانگی حمیدرضا فتاحیان": {
    description: "«بیمارستان حیوانات خانگی حمیدرضا فتاحیان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "http://drfattahian.ir/",
  },
  "کلینیک دامپزشکی ساقدوش": {
    description: "«کلینیک دامپزشکی ساقدوش» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%D8%A7%D9%82%D8%AF%D9%88%D8%B4&query_place_id=ChIJE0nqpHcFjj8RN7ZotOkdAnA",
  },
  "پت شاپ لاوین": {
    description: "«پت شاپ لاوین» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%84%D8%A7%D9%88%DB%8C%D9%86&query_place_id=ChIJyVxzKgD9jT8Rdp4Q3FVCl_c",
  },
  "کلینیک دامپزشکی آناهیتا": {
    description: "«کلینیک دامپزشکی آناهیتا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%D9%86%D8%A7%D9%87%DB%8C%D8%AA%D8%A7&query_place_id=ChIJZxdWawD9jT8RRK8aFH_-VoQ",
  },
  "بیمارستان دامپزشکی پیمان": {
    description: "«بیمارستان دامپزشکی پیمان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک جراحی دامپزشکی دکتر طبری": {
    description: "«کلینیک جراحی دامپزشکی دکتر طبری» — کلینیک دامپزشکی در خیابان مدرس پلاک۷؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AC%D8%B1%D8%A7%D8%AD%DB%8C%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B7%D8%A8%D8%B1%DB%8C&query_place_id=ChIJQ21xFdoHjj8R_Dw9l0NJMf4",
  },
  "کلینیک دامپزشکی دامون": {
    description: "«کلینیک دامپزشکی دامون» — کلینیک دامپزشکی در منطقه ۳؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%83%D9%84%D9%8A%D9%86%D9%8A%D9%83%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%D9%83%D9%8A%20%D8%AF%D8%A7%D9%85%D9%88%D9%86&query_place_id=ChIJjzAtYTAHjj8RkwG5AMGSJWw",
  },
  "کلینیک دامپزشکی کیا پت": {
    description: "«کلینیک دامپزشکی کیا پت» — کلینیک دامپزشکی در منطقه ۴؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%A9%DB%8C%D8%A7%20%D9%BE%D8%AA&query_place_id=ChIJpTzXTAAFjj8RAkte85Wk3DI",
  },
  "بیمارستان دامپزشکی دکتر تقی پور": {
    description: "«بیمارستان دامپزشکی دکتر تقی پور» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%AA%D9%82%DB%8C%20%D9%BE%D9%88%D8%B1&query_place_id=ChIJOe_MCQAJjj8RGdFH25HO4ng",
  },
  "کلینیک دامپزشکی هروی": {
    description: "«کلینیک دامپزشکی هروی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%87%D8%B1%D9%88%DB%8C&query_place_id=ChIJJ1HeSwAFjj8RizEuvEwhNVs",
  },
  "بیمارستان دامپزشکی ایرانیان": {
    description: "«بیمارستان دامپزشکی ایرانیان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "& کلینیک و پت شاپ رودا": {
    description: "«& کلینیک و پت شاپ رودا» — کلینیک دامپزشکی در منطقه ۳؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=Roda%20Veterinary%20%26%20Pet%20Shop%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%B1%D9%88%D8%AF%D8%A7&query_place_id=ChIJA3slUQAFjj8RpkrrHIBJgFA",
  },
  "کلینیک دامپزشکی هدهد": {
    description: "«کلینیک دامپزشکی هدهد» — کلینیک دامپزشکی در منطقه ۳؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%87%D8%AF%D9%87%D8%AF&query_place_id=ChIJX6oiEwAFjj8RTImPyylvmR0",
  },
  "کلینیک دامپزشکی پانیا": {
    description: "«کلینیک دامپزشکی پانیا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی دکتر قصرفخری": {
    description: "«کلینیک دامپزشکی دکتر قصرفخری» — کلینیک دامپزشکی در منطقه ۴؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%82%D8%B5%D8%B1%D9%81%D8%AE%D8%B1%DB%8C&query_place_id=ChIJB1tDhy8Djj8RTlr6S7qUSs0",
  },
  "کلینیک دامپزشکی دکتر رزم آرا": {
    description: "«کلینیک دامپزشکی دکتر رزم آرا» — کلینیک دامپزشکی در خیابان شبدیز، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B1%D8%B2%D9%85%20%D8%A2%D8%B1%D8%A7&query_place_id=ChIJR7DaU4QHjj8ROK4UN1QPHOM",
  },
  "کلینیک دامپزشکی دکتر هلشی": {
    description: "«کلینیک دامپزشکی دکتر هلشی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی ستاره ری": {
    description: "«کلینیک دامپزشکی ستاره ری» — کلینیک دامپزشکی در تهران، عمو محمدی؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%83%D9%84%D9%8A%D9%86%D9%8A%D9%83%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%D9%83%D9%8A%20%D8%B3%D8%AA%D8%A7%D8%B1%D9%87%20%D8%B1%DB%8C&query_place_id=ChIJa517yyz7kT8Rg3NC0IDMpzU",
  },
  "کلینیک دامپزشکی دکتر یاسر رخشان": {
    description: "«کلینیک دامپزشکی دکتر یاسر رخشان» — کلینیک دامپزشکی در منطقه ۱، شقایق؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=Dr%20yaser%20rakhshan%20veterinary%20clinic%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%DB%8C%D8%A7%D8%B3%D8%B1%20%D8%B1%D8%AE%D8%B4%D8%A7%D9%86&query_place_id=ChIJ60UlCQAHjj8RVBKCpxtoA_E",
  },
  "کلینیک دامپزشکی دکتر جولایی": {
    description: "«کلینیک دامپزشکی دکتر جولایی» — کلینیک دامپزشکی در ط اول (قهرمانی)، پلاک دو، ساختمان پارسه  واحد هفتایران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=Dr%20joulai%20pet%20clinic%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%AC%D9%88%D9%84%D8%A7%DB%8C%DB%8C&query_place_id=ChIJ5y458Iv7jT8R28sutnxvT8M",
  },
  "ریور ساید": {
    description: "«ریور ساید» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک تخصصی حیوانات خانگی ارغوان": {
    description: "«کلینیک تخصصی حیوانات خانگی ارغوان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی ارغوان": {
    description: "«کلینیک دامپزشکی ارغوان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A7%D8%B1%D8%BA%D9%88%D8%A7%D9%86&query_place_id=ChIJZ-T9GyMFjj8RpKq3ooXWyP4",
  },
  "کلینیک دامپزشکی دکتر رشیدی": {
    description: "«کلینیک دامپزشکی دکتر رشیدی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B1%D8%B4%DB%8C%D8%AF%DB%8C&query_place_id=ChIJtU1noqodjj8R86kXm_e-IlQ",
  },
  "دامداری اسدنژاد": {
    description: "«دامداری اسدنژاد» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی لوتوس": {
    description: "«دامپزشکی لوتوس» — کلینیک دامپزشکی در مابین خیابان رشید و پلاک ۲۰۸؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%84%D9%88%D8%AA%D9%88%D8%B3&query_place_id=ChIJHyKhTwAdjj8RuTCBrIr0NoM",
  },
  "دامپزشکی تهرانسر": {
    description: "«دامپزشکی تهرانسر» — کلینیک دامپزشکی در منطقه ۲۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%D8%B3%D8%B1%20%7C%20Tehransar%20Pet%20Clinic&query_place_id=ChIJreXsEAD7jT8RBu7U6fnfpPg",
  },
  "کلینیک دامپزشکی ایران پت": {
    description: "«کلینیک دامپزشکی ایران پت» — کلینیک دامپزشکی در خیابان ساسان، پلاک ۱۳، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "http://www.iranpethospital.com",
  },
  "کلینیک دامپزشکی سیرنگ": {
    description: "«کلینیک دامپزشکی سیرنگ» — کلینیک دامپزشکی در جنب بانک ملت خیابان ۱۱۵ رشید ابتدای؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%DB%8C%D8%B1%D9%86%DA%AF&query_place_id=ChIJ19QbbAAdjj8R_0djlwJQZ4s",
  },
  "بیمارستان دامپزشکی گیوش": {
    description: "«بیمارستان دامپزشکی گیوش» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%AF%D8%A6%D9%88%D8%B4&query_place_id=ChIJk8KjMwAFjj8RaGAk8nF0wm0",
  },
  "کلینیک حیوانات خانگی قیطریه": {
    description: "«کلینیک حیوانات خانگی قیطریه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی قیطریه": {
    description: "«کلینیک دامپزشکی قیطریه» — کلینیک دامپزشکی در منطقه ۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%82%DB%8C%D8%B7%D8%B1%DB%8C%D9%87&query_place_id=ChIJnRc_JgAFjj8RmRvjNWMUUeQ",
  },
  "کلینیک دامپزشکی پگاه": {
    description: "«کلینیک دامپزشکی پگاه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی رز": {
    description: "«دامپزشکی رز» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B1%D8%B2&query_place_id=ChIJq0SoOgAdjj8R5Acy4UW2tvE",
  },
  "دامپزشکی تهران کلینیک": {
    description: "«دامپزشکی تهران کلینیک» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%DB%8C%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9&query_place_id=ChIJzy9jqxMdjj8Rn20z6LbijVI",
  },
  "کلینیک دامپزشکی آوین (دکتر برهانی کیا)": {
    description: "«کلینیک دامپزشکی آوین (دکتر برهانی کیا)» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی اورانوس": {
    description: "«کلینیک دامپزشکی اورانوس» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی نیک پلاس": {
    description: "«کلینیک دامپزشکی نیک پلاس» — کلینیک دامپزشکی در منطقه ۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%86%DB%8C%DA%A9%20%D9%BE%D9%84%D8%A7%D8%B3&query_place_id=ChIJQfe2BgAFjj8RRBVytL2_My0",
  },
  "بیمارستان دامپزشکی ترنج": {
    description: "«بیمارستان دامپزشکی ترنج» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی دکتر مسعود تقی زاده جاهد": {
    description: "«دامپزشکی دکتر مسعود تقی زاده جاهد» — کلینیک دامپزشکی در خیابان مهران بهزادی، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.drtaghizadehpetclinic.com/",
  },
  "کلینیک دامپزشکی گل سنگ": {
    description: "«کلینیک دامپزشکی گل سنگ» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%AF%D9%84%20%D8%B3%D9%86%DA%AF&query_place_id=ChIJMUCbb1kHjj8RODVBpylVJpY",
  },
  "کلینیک دامپزشکی پارسه": {
    description: "«کلینیک دامپزشکی پارسه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%A7%D8%B1%D8%B3%D9%87&query_place_id=ChIJjRogtlIEjj8Rf2aRuGaHmBM",
  },
  "بیمارستان دامپزشکی تهران(شعبه کامرانیه)": {
    description: "«بیمارستان دامپزشکی تهران(شعبه کامرانیه)» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.tehranpet.com/",
  },
  "کلینیک دامپزشکی مهربان": {
    description: "«کلینیک دامپزشکی مهربان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%D9%87%D8%B1%D8%A8%D8%A7%D9%86%20%7C%7C%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D9%87%D8%B1&query_place_id=ChIJxWhRRwAFjj8RyQc4DQgkmVk",
  },
  "کلینیک تخصصی پرندگان جم": {
    description: "«کلینیک تخصصی پرندگان جم» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D9%BE%D8%B1%D9%86%D8%AF%DA%AF%D8%A7%D9%86%20%D8%AC%D9%85&query_place_id=ChIJp-vmbQAdjj8Rg1MIvy34cq8",
  },
  "بیمارستان دامپزشکی هونام": {
    description: "«بیمارستان دامپزشکی هونام» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی آرایشگاه و پت شاپ کلینیک حیوانات": {
    description: "«دامپزشکی آرایشگاه و پت شاپ کلینیک حیوانات» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A2%D8%B1%D8%A7%DB%8C%D8%B4%DA%AF%D8%A7%D9%87%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AD%DB%8C%D9%88%D8%A7%D9%86%D8%A7%D8%AA&query_place_id=ChIJk15MGQAHjj8RSncgt9Ix0Kc",
  },
  "دامپزشکی ولنجک": {
    description: "«دامپزشکی ولنجک» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "پلی کلینیک تخصصی پتمسفر": {
    description: "«پلی کلینیک تخصصی پتمسفر» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D9%84%DB%8C%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D9%BE%D8%AA%D9%85%D8%B3%D9%81%D8%B1&query_place_id=ChIJodUZFQAHjj8R58TIJmZLchw",
  },
  "کلینیک دامپزشکی پارسیان": {
    description: "«کلینیک دامپزشکی پارسیان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "پلی کلینیک دامپزشکی پتمسفر": {
    description: "«پلی کلینیک دامپزشکی پتمسفر» — کلینیک دامپزشکی در خیابان مهران بهزادی، پلاک ۳۹، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "پت شاپ و دامپزشکی کلبه حیوانات": {
    description: "«پت شاپ و دامپزشکی کلبه حیوانات» — کلینیک دامپزشکی در خیابان نوریان، شهر تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "پلی کلینیک دامپزشکی کاوه": {
    description: "«پلی کلینیک دامپزشکی کاوه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%BE%D9%84%DB%8C%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%A9%D8%A7%D9%88%D9%87&query_place_id=ChIJe2yssmQFjj8RANJEjFmrPxQ",
  },
  "کلینیک دامپزشکی راما": {
    description: "«کلینیک دامپزشکی راما» — کلینیک دامپزشکی در منطقه ۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=Rama%20Pet%20Clinic%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B1%D8%A7%D9%85%D8%A7&query_place_id=ChIJIaQ5l0cFjj8R017BKfIR3iI",
  },
  "کلینیک دامپزشکی دکتر داودی نیا": {
    description: "«کلینیک دامپزشکی دکتر داودی نیا» — کلینیک دامپزشکی در منطقه ۴؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%AF%D8%A7%D9%88%D8%AF%DB%8C%20%D9%86%DB%8C%D8%A7&query_place_id=ChIJaauHNwAHjj8RMH5IWF8RHEQ",
  },
  "کلینیک دامپزشکی دکتر لطفی": {
    description: "«کلینیک دامپزشکی دکتر لطفی» — کلینیک دامپزشکی در منطقه ۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%84%D8%B7%D9%81%DB%8C&query_place_id=ChIJpZRkknkFjj8RPbvzCEJEjmU",
  },
  "کلینیک دامپزشکی نیاوران": {
    description: "«کلینیک دامپزشکی نیاوران» — کلینیک دامپزشکی در منطقه ۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%86%DB%8C%D8%A7%D9%88%D8%B1%D8%A7%D9%86&query_place_id=ChIJfY_hivEFjj8RP0SpOkzg9Ww",
  },
  "کلینیک دامپزشکی رسپینا": {
    description: "«کلینیک دامپزشکی رسپینا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B1%D8%B3%D9%BE%DB%8C%D9%86%D8%A7&query_place_id=ChIJs-75i64djj8Ry0rswlVtvYU",
  },
  "کلینیک دامپزشکی پت سیتی": {
    description: "«کلینیک دامپزشکی پت سیتی» — کلینیک دامپزشکی در منطقه ۴؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%83%D9%84%D9%8A%D9%86%D9%8A%D9%83%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%D9%83%D9%89%20%D9%BE%D8%AA%20%D8%B3%D9%8A%D8%AA%D9%8A&query_place_id=ChIJO-IsVMQdjj8R84BJHizALyA",
  },
  "کلینیک دامپزشکی پردیس": {
    description: "«کلینیک دامپزشکی پردیس» — کلینیک دامپزشکی در منطقه ۲۲؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%BE%D8%B1%D8%AF%DB%8C%D8%B3%20Pardis%20Pet%20Clinic&query_place_id=ChIJ1fMDGgD7jT8RiSx0jvy2GzU",
  },
  "دامپزشکی سانی مایا": {
    description: "«دامپزشکی سانی مایا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی مدیک": {
    description: "«کلینیک دامپزشکی مدیک» — کلینیک دامپزشکی در خیابان یاسر، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی و پت شاپ مدیک": {
    description: "«کلینیک دامپزشکی و پت شاپ مدیک» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D9%85%D8%AF%DB%8C%DA%A9&query_place_id=ChIJ7UFeDgDljT8RUZnDsXky6ks",
  },
  "کلینیک دامپزشکی فرمانیه": {
    description: "«کلینیک دامپزشکی فرمانیه» — کلینیک دامپزشکی در بلوار لواسانی، پلاک ۱۴، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.petclinic.ir/",
  },
  "کلینیک دامپزشکی دکتر نیک پنجه": {
    description: "«کلینیک دامپزشکی دکتر نیک پنجه» — کلینیک دامپزشکی در منطقه ۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=Nikpanje-pet-clinic%20%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%86%DB%8C%DA%A9%20%D9%BE%D9%86%D8%AC%D9%87&query_place_id=ChIJcbXMHgAFjj8RswBjkZHUkLc",
  },
  "کلینیک دامپزشکی نیک پنجه": {
    description: "«کلینیک دامپزشکی نیک پنجه» — کلینیک دامپزشکی در خیابان دکتر باهنر، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی و پت شاپ دکتر طهرانی": {
    description: "«دامپزشکی و پت شاپ دکتر طهرانی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%88%20%D9%BE%D8%AA%20%D8%B4%D8%A7%D9%BE%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B7%D9%87%D8%B1%D8%A7%D9%86%DB%8C&query_place_id=ChIJp2ipOgAFjj8Rq3yfLQAMomY",
  },
  "کلینیک تخصصی دامپزشکی اگزو": {
    description: "«کلینیک تخصصی دامپزشکی اگزو» — کلینیک دامپزشکی در خیابان مطهری نبش دوم مرکزی؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A7%DA%AF%D8%B2%D9%88&query_place_id=ChIJYYJPC_Udjj8Rz7glz6Cx8sk",
  },
  "دامپزشکی تیکا": {
    description: "«دامپزشکی تیکا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AA%DB%8C%DA%A9%D8%A7&query_place_id=ChIJC67ZegcFjj8RsQ-xxiOpmtY",
  },
  "کلینیک چشم حیوانات نگاه": {
    description: "«کلینیک چشم حیوانات نگاه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی برنا": {
    description: "«کلینیک دامپزشکی برنا» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A8%D8%B1%D9%86%D8%A7&query_place_id=ChIJ25ZELRkdjj8R45jC5_Od5rM",
  },
  "کلینیک دامپزشکی همراز": {
    description: "«کلینیک دامپزشکی همراز» — کلینیک دامپزشکی در خیابان پاسداران، پلاک ۷۶۲، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی کلبه حیوانات": {
    description: "«کلینیک دامپزشکی کلبه حیوانات» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی احسان": {
    description: "«کلینیک دامپزشکی احسان» — کلینیک دامپزشکی در خیابان موحد دانش، پلاک ۳۷/۱، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%A7%D8%AD%D8%B3%D8%A7%D9%86&query_place_id=ChIJe2bnbgAFjj8RXFu8g_XbcQ0",
  },
  "کلینیک دامپزشکی نبات": {
    description: "«کلینیک دامپزشکی نبات» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%86%D8%A8%D8%A7%D8%AA&query_place_id=ChIJk3q47PsFjj8RM4Xj_9uloGk",
  },
  "کلینیک تخصصی دامپزشکی دکتر ذاکریان": {
    description: "«کلینیک تخصصی دامپزشکی دکتر ذاکریان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AA%D8%AE%D8%B5%D8%B5%DB%8C%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D8%B0%D8%A7%DA%A9%D8%B1%DB%8C%D8%A7%D9%86&query_place_id=ChIJ-_l1Sk4Fjj8Riu-Bivp9NN8",
  },
  "کلینیک دامپزشکی درین اوا پلاس": {
    description: "«کلینیک دامپزشکی درین اوا پلاس» — کلینیک دامپزشکی در خیابان پارک اول، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%D8%B1%DB%8C%D9%86%20%D8%A7%D9%88%D8%A7%20%D9%BE%D9%84%D8%A7%D8%B3&query_place_id=ChIJLRwlEQAFjj8RUiCX9dq_f6w",
  },
  "بیمارستان حیوانات خانگی نیکان": {
    description: "«بیمارستان حیوانات خانگی نیکان» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "http://nikanpethospital.com/",
  },
  "بیمارستان دامپزشکی ساران(آراد)": {
    description: "«بیمارستان دامپزشکی ساران(آراد)» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%A8%DB%8C%D9%85%D8%A7%D8%B1%D8%B3%D8%AA%D8%A7%D9%86%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%D8%A7%D8%B1%D8%A7%D9%86(%D8%A2%D8%B1%D8%A7%D8%AF)&query_place_id=ChIJvRcNHAAFjj8RwizP1HcF-Tg",
  },
  "دامپزشکی ساران": {
    description: "«دامپزشکی ساران» — کلینیک دامپزشکی در تهران، بلوار هاشم زاده؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%D8%A7%D8%B1%D8%A7%D9%86&query_place_id=ChIJnalW3GLljT8RfLTnYl3AgSU",
  },
  "کلینیک دامپزشکی سیار ایکس وت": {
    description: "«کلینیک دامپزشکی سیار ایکس وت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%B3%DB%8C%D8%A7%D8%B1%20%D8%A7%DB%8C%DA%A9%D8%B3%20%D9%88%D8%AA&query_place_id=ChIJb079DAAdjj8RHUZibVY1Dmw",
  },
  "کلینیک دامپزشکی دریاچه": {
    description: "«کلینیک دامپزشکی دریاچه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%D8%B1%DB%8C%D8%A7%DA%86%D9%87&query_place_id=ChIJ7_QzKQDljT8RLy4DzzpHi5c",
  },
  "کلینیک دامپزشکی اقدسیه": {
    description: "«کلینیک دامپزشکی اقدسیه» — کلینیک دامپزشکی در منطقه ۱؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D9%83%D9%84%D9%8A%D9%86%D9%8A%D9%83%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%D9%83%D9%8A%20%D8%A7%D9%82%D8%AF%D8%B3%D9%8A%D9%87&query_place_id=ChIJw5heCdwEjj8RxQCEkdQUACo",
  },
  "کلینیک دامپزشکی و پت شاپ ریواس": {
    description: "«کلینیک دامپزشکی و پت شاپ ریواس» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی مه نیک آرتی": {
    description: "«کلینیک دامپزشکی مه نیک آرتی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%85%D9%87%20%D9%86%DB%8C%DA%A9%20%D8%A2%D8%B1%D8%AA%DB%8C&query_place_id=ChIJk4NQtgMFjj8RZGNL3-toYv0",
  },
  "قدرتی": {
    description: "«قدرتی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک تخصصی دامپزشکی حیوانات خانگی دکتر بهزاد شفیعی": {
    description: "«کلینیک تخصصی دامپزشکی حیوانات خانگی دکتر بهزاد شفیعی» — کلینیک دامپزشکی در خیابان صفایی فراهانی، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی دکتر پت": {
    description: "«کلینیک دامپزشکی دکتر پت» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D8%AF%DA%A9%D8%AA%D8%B1%20%D9%BE%D8%AA&query_place_id=ChIJA0tyAgAdjj8RrQImv9L7Hc0",
  },
  "کلینیک دامپزشکی کسری": {
    description: "«کلینیک دامپزشکی کسری» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%A9%D8%B3%D8%B1%DB%8C&query_place_id=ChIJxwXI8U4Fjj8Rtd9wjEewYDs",
  },
  "حبیب الله": {
    description: "«حبیب الله» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی لاله": {
    description: "«کلینیک دامپزشکی لاله» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9%20%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%D9%84%D8%A7%D9%84%D9%87&query_place_id=ChIJTWogzkMbjj8RQ6J8ay0LyS8",
  },
  "رنجبران": {
    description: "«رنجبران» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "خلج": {
    description: "«خلج» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی کالج": {
    description: "«دامپزشکی کالج» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
    website: "https://www.google.com/maps/search/?api=1&query=%D8%AF%D8%A7%D9%85%D9%BE%D8%B2%D8%B4%DA%A9%DB%8C%20%DA%A9%D8%A7%D9%84%D8%AC&query_place_id=ChIJoT5tXQAdjj8RYbynfhhyiD4",
  },
  "کلینیک دامپزشکی": {
    description: "«کلینیک دامپزشکی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "اداره کل دامپزشکی استان تهران": {
    description: "«اداره کل دامپزشکی استان تهران» — کلینیک دامپزشکی در بلوار پژوهش، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دام اصیل": {
    description: "«دام اصیل» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "بهروزی": {
    description: "«بهروزی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "احسان صابری": {
    description: "«احسان صابری» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "اشرفی": {
    description: "«اشرفی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "صابری": {
    description: "«صابری» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی فلی وت": {
    description: "«کلینیک دامپزشکی فلی وت» — کلینیک دامپزشکی در خیابان کمانی؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی دکتر توسلی": {
    description: "«دامپزشکی دکتر توسلی» — کلینیک دامپزشکی در جاده عباس آباد، پلاک ۲، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی و پت شاپ حامی": {
    description: "«کلینیک دامپزشکی و پت شاپ حامی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "پاژن": {
    description: "«پاژن» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "درمانگاه تخصصی جراحی دامپزشکی لواسان": {
    description: "«درمانگاه تخصصی جراحی دامپزشکی لواسان» — کلینیک دامپزشکی در خیابان سهیل، پلاک ۱۱۳۹، تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپروی وحید اسماعیلی": {
    description: "«دامپروی وحید اسماعیلی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "حضرتی": {
    description: "«حضرتی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "داروخانه و دامپزشکی فارابی": {
    description: "«داروخانه و دامپزشکی فارابی» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "دامپزشکی الودامپزشک": {
    description: "«دامپزشکی الودامپزشک» — کلینیک دامپزشکی در خیابان بهاره شرقی، پلاک ۲، ملارد؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک و آزمایشگاه دامپزشکی مرکزی ملارد": {
    description: "«کلینیک و آزمایشگاه دامپزشکی مرکزی ملارد» — کلینیک دامپزشکی در بلوار امام رضا، ملارد؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
  "کلینیک دامپزشکی عظیمیه": {
    description: "«کلینیک دامپزشکی عظیمیه» — کلینیک دامپزشکی در تهران؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک.",
  },
}
