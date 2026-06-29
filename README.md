# ÉCLAT — AI-стилист

Мобильный AI-стилист на Next.js (App Router) + Supabase + Anthropic Claude.
Витрина трендов, подбор образов по профилю и фото, распознавание вещей,
гардероб и избранное.

- **Витрина** (`/`) — тренды недели и образ дня.
- **Подбор** (`/podbor`) — форма параметров, генерация 3 образов через Claude,
  загрузка и распознавание фото вещи/селфи.
- **Гардероб** (`/wardrobe`) — каталог распознанных вещей, ручное добавление,
  фильтры, CRUD.
- **Избранное** (`/favorites`) — сохранённые образы.

## Стек

- Next.js 13 (App Router), React 18, TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres + RLS, Storage)
- Anthropic Claude (`claude-sonnet-4-6`) — анализ фото и генерация образов

---

## 1. Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните. `.env.local` в `.gitignore`
— **реальные ключи только туда, никогда в `.env.example`.**

```bash
# Один публичный набор Supabase покрывает всё приложение:
# браузерный клиент, API-роуты (с токеном пользователя) и SSR-чтение витрины.
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>

# Опционально: серверные креды. Нужны, только если потребуется читать в обход RLS
# на сервере. Иначе используется публичная пара выше.
# SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=

# Обязательно для распознавания фото (/api/analyze) и генерации образов (/api/looks).
ANTHROPIC_API_KEY=<anthropic api key>
```

> `ANTHROPIC_API_KEY` используется **только на сервере** (в роутах `/api/*`) и
> никогда не попадает в браузер.

Получить ключи:
- Supabase: Dashboard → Project Settings → **API** (`Project URL`, `anon`/`publishable`).
- Anthropic: <https://console.anthropic.com> → API Keys.

---

## 2. Настройка Supabase

### 2.1 Применить миграции

SQL лежит в [`supabase/migrations/`](supabase/migrations) и применяется по порядку:

| Файл | Что создаёт |
| --- | --- |
| `0001_profiles.sql` | таблица `profiles` + RLS «владелец» + триггер `updated_at` |
| `0002_wardrobe_and_storage.sql` | таблица `wardrobe_items`, приватный бакет `wardrobe`, RLS на объекты по `<user_id>/` |
| `0003_looks.sql` | таблица `looks` (сохранённые генерации) + RLS |
| `0004_saved_looks.sql` | таблица `saved_looks` (избранное) + RLS |

Два способа применить:

**A. Supabase Dashboard (быстро).** SQL Editor → New query → вставьте содержимое
каждого файла по очереди (0001 → 0004) → Run.

**B. Supabase CLI.**
```bash
npm i -g supabase
supabase link --project-ref <project-ref>
supabase db push
```

### 2.2 Storage

Бакет `wardrobe` создаётся миграцией `0002` как **приватный**, с политиками,
разрешающими пользователю доступ только к объектам под префиксом `<user_id>/`.
Отдельно в Dashboard ничего создавать не нужно. Проверить: Storage → должен быть
бакет `wardrobe` (Public = off).

### 2.3 Auth

Authentication → Providers → **Email**: включён (вход по email + паролю).
Регистрация происходит автоматически при первом входе несуществующего аккаунта.
Подтверждение email можно отключить (Authentication → Settings → *Confirm email*),
если нужен моментальный вход без письма.

### 2.4 RLS

Включён на всех таблицах; политики — в миграциях. Каждый пользователь видит и меняет
только свои строки (`auth.uid()`), а файлы — только под своим префиксом в Storage.

---

## 3. Запуск локально

```bash
npm install
npm run dev      # http://localhost:3000
```

Другие команды:
```bash
npm run build    # production-сборка
npm run start    # запуск собранного приложения
npm run lint     # ESLint
```

> После изменения `.env.local` перезапустите dev-сервер — переменные окружения
> читаются только при старте.

---

## 4. Деплой на Vercel

1. Запушьте репозиторий на GitHub.
2. Vercel → **Add New… → Project** → импортируйте репозиторий. Фреймворк
   определится как Next.js автоматически.
3. **Environment Variables** — добавьте те же, что в `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   - (опционально) `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

   Задайте их для Production (и Preview, если нужно). `NEXT_PUBLIC_*` нужны и на
   этапе сборки.
4. **Deploy.**
5. В Supabase → Authentication → URL Configuration добавьте домен Vercel в
   **Site URL** и **Redirect URLs** (например, `https://<app>.vercel.app`).

Supabase отдельно «подключать» к Vercel не нужно — связь идёт через переменные
окружения. При желании можно использовать официальную интеграцию Vercel ↔ Supabase
из Marketplace, которая проставит переменные автоматически.

---

## 5. Безопасность

- `ANTHROPIC_API_KEY` и `SUPABASE_SERVICE_ROLE_KEY` — серверные секреты, не
  префиксуются `NEXT_PUBLIC_` и не уходят в браузер.
- Роуты `/api/analyze` и `/api/looks` требуют валидный access-token пользователя
  (Bearer) и работают в его RLS-области.
- Загрузки проверяются по типу и размеру (≤ 8 МБ) и на клиенте, и на сервере.
- Если ключ когда-либо попал в `.env.example` или историю git — **ротируйте его**
  в Dashboard.

---

## 6. Структура

```
app/
  page.tsx              витрина (SSR-чтение трендов)
  podbor/page.tsx       подбор: форма → лоадер → результаты
  wardrobe/page.tsx     гардероб
  favorites/page.tsx    избранное
  api/analyze/route.ts  распознавание фото (Claude, multimodal)
  api/looks/route.ts    генерация 3 образов (Claude)
components/             UI: форма, карточки образов, глифы, гардероб, избранное
lib/
  colors.ts             словарь цветов (единый источник палитры)
  looks.ts              типы образов, сид-каталог, безопасный парсинг
  savedLooks.ts         работа с избранным
  supabaseClient.ts     браузерный клиент
  supabaseServer.ts     серверный клиент (fallback на публичную пару)
supabase/migrations/    SQL-миграции (0001–0005)
```

---

## 7. Адаптив (десктоп / мобайл)

**Один брейкпоинт — 1024px** (Tailwind `lg:`, CSS `@media (min-width: 1024px)`).
Вся вёрстка mobile-first: базовые стили — мобильные, десктоп включается только
на `≥1024px`. Поэтому на `<1024px` раскладка не меняется относительно мобильной.

- **`<1024px`** — телефонная колонка (`max-w-md`, по центру; мягкая рамка-кадр
  с `768px`), нижний таб-бар, оверлеи как нижние «листы».
- **`≥1024px`** — оболочка-грид `.app` `[256px sidebar | 1fr stage]`,
  **резиновая**: тянется на всю ширину устройства до потолка `max-width: 1760px`
  по центру, фон oat, без рамки. Стандартные ноутбуки (1366–1536) заполняются
  целиком; на сверхшироких мониторах остаются слитые с фоном поля, чтобы строки
  не были слишком длинными. Горизонтальный гуттер `--gut` текучий:
  `22px` (мобайл) → `clamp(40px, 4vw, 96px)` (десктоп). Внутренние колонки
  контента — до `1320px`.

Что меняет раскладку на `≥1024px`:

| Экран | Мобайл | Десктоп |
| --- | --- | --- |
| Навигация | нижний таб-бар | левый сайдбар (`.tabbar` скрыт) |
| Оверлеи | нижние листы | история — диалог по центру; чат — правый док |
| Главная | hero в 1 колонку (арт сверху), тренды лентой | hero в 2 колонки (копия/арт), тренды в 3 колонки, контент ≤1000px |
| Подбор | форма + инлайн-кнопка | форма + липкий бриф `[1fr 360px]`, main ≤1040px |
| Результаты / Избранное | вертикальная лента | сетка в 3 колонки, main ≤1040px |

Доступность: видимый фокус (`:focus-visible`), `aria-label` на иконочных
кнопках, фокус-трап и возврат фокуса в оверлеях, `prefers-reduced-motion`
гасит анимации лоадера/переходов.

### Скриншоты и regression-diff

Готовый харнесс — [`scripts/screenshots.mjs`](scripts/screenshots.mjs):

```bash
npm i -D playwright && npx playwright install chromium
npm run dev                       # в одном терминале
node scripts/screenshots.mjs http://localhost:3000   # в другом
# → ./screenshots/<route>-<ширина>.png на 360/768/1024/1280/1440
```

Экраны `/podbor`, `/wardrobe`, `/favorites` рендерятся под авторизацией —
задайте `TEST_EMAIL` / `TEST_PASSWORD` существующего аккаунта, и харнесс
залогинится перед съёмкой. Публичная только главная (`/`).

Для regression-diff мобильной версии: снимите кадры на коммите до адаптации в
`OUT_DIR=screenshots-base` и на `HEAD` в `screenshots`, затем сравните пары
`*-360.png` (и `*-768.png`) любым image-diff (`pixelmatch`, ImageMagick
`compare`).
