# University Help Desk — Frontend

React 19 + TypeScript + Vite. Подробный запуск всего проекта — в корневом `README.md`.

## Разработка

```bash
npm install
npm run dev      # http://localhost:5173
```

Запросы `/api/*` проксируются на `http://localhost:5000` (см. `vite.config.ts`), поэтому бэкенд должен быть запущен. Свой адрес API можно задать через `VITE_API_URL` (см. `.env.example`); в этом случае разрешите источник фронтенда в `CORS_ORIGIN` бэкенда.

## Сборка и Docker

`npm run build` собирает статику в `dist/`. Dockerfile собирает её и раздаёт через nginx на порту 8000, `/api` и `/api-docs` проксируются на сервис `backend`.

## Структура

- `src/services/api.ts` — единственная точка работы с API: токен, обработка ошибок и 401, загрузка файлов.
- `src/context/AuthContext.tsx` — сессия: при старте токен проверяется через `GET /users/me`.
- `src/pages/` — страницы; `src/components/` — общие элементы; `src/hooks/` — загрузка данных, debounce, проверка связи.
- `src/lib/labels.ts` — подписи статусов, приоритетов и ролей (в коде везде используются коды `NEW`, `HIGH`, `STUDENT`…).

## Маршруты

`/login`, `/register`, `/dashboard`, `/tickets`, `/tickets/create`, `/tickets/:id`, `/profile` — для всех;
`/staff/dashboard` — сотрудник и администратор;
`/admin`, `/admin/users`, `/admin/categories`, `/admin/statistics` — администратор.

Защита маршрутов на клиенте нужна только для удобства — настоящие права проверяет сервер.
