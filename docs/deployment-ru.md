# Деплой Trainly (production / staging)

Цель: приложение на **HTTPS**, PostgreSQL **в РФ** (ПДн), миграции, бэкапы, откат.

## 1. Окружения

- **Staging**: отдельный домен/БД, те же переменные что prod с тестовыми ключами ЮKassa.
- **Production**: домен вида `app.trainly.ru`, только боевые секреты.

## 2. Переменные окружения

См. [`.env.example`](../.env.example). Обязательно в prod:

- `DATABASE_URL` — Postgres в РФ, `sslmode=require` при необходимости.
- `JWT_SECRET` — ≥16 символов, уникальный на среду.
- `TELEGRAM_BOT_TOKEN` — для `POST /api/auth/telegram`.
- `TRAINLY_YOOKASSA_WEBHOOK_SECRET` — совпадает с прокси/заголовком вебхука.
- `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` — боевые или тестовые на staging.
- `TRAINLY_PUBLIC_URL` — публичный URL приложения (return_url).

Не включайте `TRAINLY_YOOKASSA_WEBHOOK_ALLOW_QUERY_SECRET=true` в production.

## 3. Миграции

На сервере перед новым релизом:

```bash
npm ci
npm run db:migrate:run
npm run build
# перезапуск процесса (pm2 / systemd / docker)
```

При ошибке миграции: **не** поднимать новый код до исправления; откатить на предыдущий образ/релиз и восстановить БД из бэкапа при повреждении данных.

## 4. Бэкапы

- Включите автоматические бэкапы кластера Postgres (панель провайдера, например Selectel).
- Периодически проверяйте восстановление на тестовый инстанс.

## 5. Логи и мониторинг

- Собирайте stdout/stderr приложения.
- Алерты по 5xx и по диску БД.

## 6. Откат (rollback)

1. Откатить деплой на предыдущую версию приложения.
2. Если миграция уже применена и ломает схему — только через заранее подготовленный `down` SQL или restore из бэкапа (операционная процедура).

## 7. Рекомендации по данным

- Персональные данные тренеров и клиентов хранить только в РФ-сегменте инфраструктуры, доступ по TLS.
- Не использовать иностранный managed Postgres как финальное хранилище ПДн без правовой оценки.

## 8. Вариант: облачный сервер Selectel (VPS) за час

Ниже — **минимальный** рабочий контур: одна ВМ в зоне РФ, приложение за **nginx + Let’s Encrypt**, Postgres — либо **Managed PostgreSQL** Selectel (предпочтительно, см. [`db/README.md`](../db/README.md)), либо Postgres на той же ВМ только для краткого теста.

### 8.1. В панели Selectel (куда нажимать)

- **Не «Файловое хранилище»** — это S3-подобное хранение файлов, не запуск сайта.
- **Виртуальная машина:** в проекте слева **«Серверы»** (или «Облачные серверы») — там ВМ вроде **Darla** (Ubuntu). Запомни **публичный IPv4** — он нужен для DNS.
- **База:** **«Базы данных»** → Managed **PostgreSQL** в регионе РФ — строка подключения в `DATABASE_URL` (см. [`db/README.md`](../db/README.md)). Либо Postgres на той же ВМ только для эксперимента.
- **Домен `trainlyfit.ru`:** при NS на Selectel записи **A** делаются в **DNS Selectel** (часто: **Продукты** → **DNS** / **Публичный DNS** / зона домена). Создай **A** для `@` (корень) и при желании `www` → **IP сервера**. Подтверди телефон в аккаунте, если панель требует для делегирования.
- **Сеть:** в **«Группы безопасности»** / firewall у сервера открыты **22**, **80**, **443**.

Дальше: SSH на сервер, nginx, certbot, код, systemd — см. §8.2–8.6.

### 8.2. На сервере (под `root` или sudo)

```bash
apt update && apt install -y nginx certbot python3-certbot-nginx git
# Node 20 LTS (через NodeSource или nvm — один способ на выбор)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Пользователь для деплоя (опционально, но лучше не крутить от root):

```bash
adduser trainly --disabled-password
usermod -aG sudo trainly
```

### 8.3. Код и сборка

```bash
sudo -u trainly bash -c '
  cd /home/trainly
  git clone https://github.com/YOUR_ORG/TelegramAppTrainlyV2.git app
  cd app
  npm ci
  cp .env.example .env.production
  # отредактируйте .env.production: DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN, публичные URL и т.д.
  nano .env.production
  set -a && source .env.production && set +a
  npm run db:migrate:run
  npm run build
'
```

Секреты храните в `/home/trainly/app/.env.production` с правами `600`, в git не коммитьте.

### 8.4. systemd (Next.js `next start`)

Файл `/etc/systemd/system/trainly.service` (подставьте пользователя и путь):

```ini
[Unit]
Description=Trainly Next.js
After=network.target

[Service]
Type=simple
User=trainly
WorkingDirectory=/home/trainly/app
EnvironmentFile=/home/trainly/app/.env.production
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable trainly
systemctl start trainly
systemctl status trainly
```

В `.env.production` задайте публичный базовый URL (для редиректов и ссылок), например:

- `TRAINLY_PUBLIC_URL=https://app.example.ru`
- при использовании клиентских ссылок — `NEXT_PUBLIC_APP_URL=https://app.example.ru` (см. [`.env.example`](../.env.example)).

### 8.5. nginx (прокси на Node)

Сайт `/etc/nginx/sites-available/trainly`:

```nginx
server {
    listen 80;
    server_name app.example.ru;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -sf /etc/nginx/sites-available/trainly /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d app.example.ru
```

После выпуска сертификата nginx начнёт слушать **443**.

### 8.6. Вебхук ЮKassa

URL уведомлений в личном кабинете ЮKassa: `https://app.example.ru/api/webhooks/yookassa`  
Заголовок `X-Trainly-Yookassa-Secret` = значение `TRAINLY_YOOKASSA_WEBHOOK_SECRET` на сервере (в production **не** включайте `TRAINLY_YOOKASSA_WEBHOOK_ALLOW_QUERY_SECRET`).

### 8.7. Telegram Mini App

В [@BotFather](https://t.me/BotFather) укажите URL веб-приложения **ровно** ваш HTTPS-домен (корень или нужный путь). Без этого вход по `initData` из мини-аппа не совпадёт с URL приложения.

### 8.8. Краткий чеклист после деплоя

1. `curl -I https://app.example.ru` → **200** или редирект на welcome.  
2. Вход (Telegram или тестовый сценарий) → обзор → клиент.  
3. `POST /api/webhooks/yookassa` с тестовым телом на staging (см. [`docs/yookassa-idempotency.md`](yookassa-idempotency.md)).

### 8.9. Остановка «на час»

```bash
systemctl stop trainly
# при необходимости: systemctl disable trainly
```

ВМ в панели Selectel можно **выключить** или **удалить**, чтобы не платить дальше.
