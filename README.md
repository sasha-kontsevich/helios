# helios
ecs web game engine

## Установка pnpm

```bash
npm install -g pnpm
```

Используйте **pnpm** для этого репозитория (`pnpm-lock.yaml`). Отдельный `package-lock.json` может быть устаревшим; для установки зависимостей не смешивайте npm и pnpm в одном дереве.

## Установка
```bash
pnpm install
```

## Запуск игры (пример astris)

Пример импортирует собранный `@merlinn/helios-editor` из `dist/`. Перед первым запуском собирается редактор:

```bash
pnpm --filter astris dev
```

Скрипт `dev` у примера сам выполняет сборку редактора, затем поднимает Vite.

Сборка продакшена:

```bash
pnpm --filter astris build
```

## Пакет редактора (SDK)

Публичный API:

```ts
import { createEditor } from "@merlinn/helios-editor";
import "@merlinn/helios-editor/style.css";

const ui = createEditor({ api: engine.api, root: document.getElementById("editor-root")! });
ui.dispose();
```

Требуются peer-зависимости: `vue` и `@merlinn/helios-core` (см. `packages/helios-editor/package.json`).
