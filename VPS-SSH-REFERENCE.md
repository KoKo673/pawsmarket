# SSH به VPS — مرجع کامل

> نوشتهٔ ۲۰۲۶-۱۰-۲۱، بعد از اینکه یک ban ناشی از تایپ اشتباه یوزر
> دسترسی را بست. هر عدد اینجا سنجیده شده، نه از حافظه.

---

## دستور کارکننده

```bash
ssh -i "C:/Users/HP/Downloads/office/vps-deploy/id_pawsmarket" \
    -o IdentitiesOnly=yes paw@87.107.130.85
```

| | |
|---|---|
| میزبان | `87.107.130.85` (vm10940-13237.vpsmarket.org) |
| کاربر | **`paw`** — نه root |
| کلید | `vps-deploy/id_pawsmarket` (ED25519) |
| اثر انگشت | `SHA256:k+Z1Icc5J4xwMqZkYaI160qaROPXcEzDgSAgCif+gY4` |
| `sudo` | بدون رمز (`sudo -n` کار می‌کند) |
| احراز هویت | **فقط کلید.** رمز root در یک جلسهٔ قبلی در چت لو رفت و سوخته است |

`-o IdentitiesOnly=yes` مهم است: بدون آن، اگر کلید دیگری در agent باشد،
سرور آن را اول امتحان می‌کند و ممکن است fail2ban آن را هم بشمارد.

---

## ⚠️ وضعیت الان: IP بن شده

```
ping 87.107.130.85        → پاسخ می‌دهد (۲ms)
TCP  :80  روی origin      → باز
TCP  :443 روی origin      → refused (طبیعی؛ nginx فقط ۸۰ گوش می‌دهد)
TCP  :22                  → timeout
```

**پورت ۸۰ باز است ولی ۲۲ تایم‌اوت می‌شود.** این تفاوت مهم است: قطعی
شبکه نبود، چون ۸۰ جواب می‌دهد. بلوک مخصوص SSH است — یعنی fail2ban.

**IP من هنگام این نوشتن:** `31.171.100.174`

اگر IP شما هم همین است (شبکهٔ مشترک)، بعد از بن شدن **شما هم نمی‌توانید
SSH بزنید**، چون بن روی IP است نه روی کاربر.

### رفعش — از کنسول وب، نه از SSH

از پنل vpsmarket.org → کنسول (VNC/Serial) وارد شوید، بعد:

```bash
sudo fail2ban-client status sshd          # ببینید چه IPهایی بن‌اند
sudo fail2ban-client set sshd unbanip 31.171.100.174
```

اگر `fail2ban-client` نبود، قاعده را مستقیم بردارید:

```bash
sudo iptables -L -n --line-numbers | grep -i drop
sudo iptables -D f2b-sshd 1               # شمارهٔ درست را از خروجی بالا
```

**اگر بان‌تایم محدود باشد، خودش هم باز می‌شود** (پیش‌فرض `bantime` در
بسیاری از نصب‌ها ۱۰ دقیقه است). قبل از هر کاری یک بار صبر کنید و دوباره
تلاش کنید.

### برای اینکه دوباره اتفاق نیفتد

- با `paw@` وارد شوید، **نه** `root@` و **نه** نام‌های حدسی.
- هر تلاش ناموفق شمرده می‌شود، حتی اگر کلید درست باشد و یوزر غلط.
- در `~/.ssh/config` یک alias بسازید تا هیچ‌وقت تایپ نکنید:

```
Host paw
    HostName 87.107.130.85
    User paw
    IdentityFile C:/Users/HP/Downloads/office/vps-deploy/id_pawsmarket
    IdentitiesOnly yes
```

بعد فقط: `ssh paw`

---

## روی سرور چه چیزی کجاست

```
/srv/pawsmarket/pawsmarket              فرانت (clone عمومی GitHub)
/srv/pawsmarket/pawsmarket-serverdash   بک‌اند (از git bundle؛ مخزن خصوصی است)

pawsmarket-frontend-1    nginx، روتش /usr/share/nginx/html
pawsmarket-backend-1     FastAPI
pawsmarket-database-1    PostGIS
pawsmarket-migrate-1     یک‌بار اجرا می‌شود و Exited می‌ماند (طبیعی است)
```

---

## دیپلوی فرانت

```bash
cd /srv/pawsmarket/pawsmarket && git pull --ff-only
cd /srv/pawsmarket/pawsmarket-serverdash
sudo -n docker compose -f docker-compose.prod.yml up -d --build frontend
```

فایل compose در **دایرکتوری بک‌اند** است و فرانت را از `../pawsmarket`
به‌عنوان build context می‌سازد. یعنی `docker compose` را باید از
`serverdash` زد، نه از `pawsmarket`.

### تأیید اینکه دیپلوی واقعاً نشست

```bash
curl -s https://pawsmarket.ir/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js'
```

هش باید عوض شده باشد. اگر عوض نشد، دیپلوی نشست.

---

## سه دام که این پروژه سرشان وقت گذاشته

### ۱. `docker build` روی سرور ممکن است با 403 از CloudFront بشکند

یک بار با این خطا خوردیم:

```
failed to compute cache key: … https://production.cloudfront.docker.com/…
403 Forbidden
```

مشکل شبکه است، نه کد. راه دور زدنش — ساختن لوکال و کپی فایل‌های
استاتیک داخل ایمیج موجود:

```bash
# لوکال
docker run --rm -v "/c/…/pawsmarket:/app" -w /app pw-ready \
    sh -c 'node node_modules/vite/bin/vite.js build --outDir dist-prod'
tar -czf /tmp/dist-prod.tgz -C dist-prod .

# آپلود و جایگزینی
scp … /tmp/dist-prod.tgz paw@87.107.130.85:/tmp/
ssh paw@87.107.130.85 "
  W=/tmp/site-swap; rm -rf \$W && mkdir -p \$W
  tar -xzf /tmp/dist-prod.tgz -C \$W
  sudo -n docker cp \$W/. pawsmarket-frontend-1:/usr/share/nginx/html/
  sudo -n docker exec pawsmarket-frontend-1 nginx -s reload
"
```

**این مسیر در `docker-compose.prod.yml` نیست** — دستی است. اگر دوباره
لازم شد، همین است.

### ۲. اعتبار دیتابیس از env داخل کانتینر می‌آید، نه از `myuser`

```bash
# ❌ role "myuser" does not exist
sudo -n docker exec pawsmarket-database-1 psql -U myuser -d mydatabase

# ✅
sudo -n docker exec pawsmarket-database-1 \
    sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1"'
```

### ۳. SQL فارسی را از داخل `ssh "..."` ننویسید

کوتیشن‌های تودرتو و UTF-8 از دو لایه شل رد می‌شوند و متن خراب می‌شود
(`'تست'` تبدیل شد به `'??? ???? ??'`). فایل را `scp` کنید و با
`psql -f` اجرا کنید. یک بار همین باعث شد یک `DELETE` هیچ ردیفی را
نگیرد و فکر کنیم پاک شده.

---

## چیزهایی که با SSH روی این سرور تست نشده‌اند

- `scripts/backup_db.sh` هرگز روی این سرور اجرا نشده — فقط نوشته شده.
- `scripts/restore_to_server.md` هم مسیر تست‌شده ندارد.

قبل از قدم «seed کامل» باید اول backup را یک بار واقعاً اجرا و restore
کنید، وگرنه نسخهٔ پشتیبان داریم که نمی‌دانیم کار می‌کند.
