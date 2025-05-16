# helios
ecs web game engine

## Установка pnpm

```bash
npm install -g pnpm
```

## Установка
При изменении любого из package.json
```bash
pnpm install
```

## Запуск игры
```bash
pnpm --filter astris dev
```

## Запуск отслеживания изменений пакетов
```bash
pnpm --filter @merlinn/helios-core watch
```
```bash
pnpm --filter @merlinn/helios-editor watch
```
```bash
pnpm --filter @merlinn/helios-three-plugin watch
```
```bash
pnpm --filter @merlinn/helios-physics-plugin watch
```

