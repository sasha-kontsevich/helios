# Поддержание документации в актуальном состоянии

Цель: чтобы **изменения в коде и публичных контрактах** не расходились с **`docs/`**, **`README.md`** и **`AGENTS.md`**.

## Принципы

1. **Один проход:** по возможности правки документации в том же коммите или PR, что и изменение поведения/API (не откладывать «на потом»).
2. **Источник правды:** детали архитектуры — в **`docs/architecture.md`**; быстрые команды и подсказки для автоматизации — в **`AGENTS.md`**; точка входа для людей — **`README.md`** и **`docs/README.md`**.
3. **Рецензия:** в PR, который меняет границы пакетов, публичный API или пользовательские сценарии редактора, ревьюер проверяет не только код, но и соответствующий раздел документации.

## Матрица: код → что обновить

| Изменили | Обновить |
|----------|----------|
| Публичный API **`helios-core`** (`EngineAPI`, экспорты, формат буфера, спавн/merge) | `docs/architecture.md` (раздел «Ядро»), при необходимости `AGENTS.md` |
| **`helios-core`**: `rendering/`, компоненты `Geometry`/`Material`/`Mesh`/`Camera`/lights, формат сцен | `docs/scene-serialization.md`, `docs/architecture.md` |
| **`helios-core` / `helios-three-plugin`**: texture assets (`loadTexture`), `Material.descriptor` map slots | `docs/textures.md`, `docs/scene-serialization.md` |
| **`helios-core` / `helios-three-plugin`**: `Skybox` component, `UpdateSkyboxSystem` | `docs/skybox.md`, `docs/scene-serialization.md`, `docs/architecture.md` |
| **`helios-core` / `helios-three-plugin` / editor**: `Fog`, `UpdateFogSystem`, `FogInspector` | `docs/fog.md`, `docs/scene-serialization.md`, `docs/architecture.md` |
| **`helios-core`**: `ModelInstance`, `ModelManifest`, `spawnModelInstance`, asset `loadModel` | `docs/model-import.md`, `docs/architecture.md`, `docs/scene-serialization.md` |
| **`helios-three-plugin`**: GLTF loaders (`loadGltfBinary` / mesh / material), `buildModelBundleFromGltf` | `docs/model-import.md`, `docs/architecture.md` |
| **`helios-cli`**: `helios import-model` | `docs/model-import.md`, `AGENTS.md` |
| **`helios-editor`**: Assets panel, model drop, `ModelInstance` inspector | `docs/model-import.md`, `docs/architecture.md` |
| **`helios-three-plugin`**: capability, `ThreeRenderContext`, `EnsureThreeRenderable`, системы рендера, **теги пикинга** (`heliosEntityEid`) | `docs/architecture.md` (раздел «Плагин Three.js»), при смене JSON — `docs/scene-serialization.md` |
| **`helios-editor`**: `createEditor`, жизненный цикл, панели, буфер, контекстные меню, выделение, **пикинг/жесты вьюпорта** | `docs/architecture.md` (раздел «Редактор»), при смене peers — `README.md` и `docs/overview.md` |
| **`examples/astris`**: скрипты, способ подключения редактора | `README.md`, при необходимости `docs/architecture.md` (астрис) |
| Корневые **`package.json`** скрипты, список workspace, команды CI | `README.md`, `AGENTS.md` |
| Новый пакет в `packages/` или пример в `examples/` | `docs/architecture.md` (таблица пакетов), `docs/README.md`, `AGENTS.md` при необходимости |

Если правка **только** внутренняя (рефакторинг без смены контракта) — документацию трогаем только если меняются описанные там пути файлов или сценарии.

## Чеклист перед мержем (для автора)

- [ ] Затронут ли публичный API или поведение, описанное в `docs/architecture.md`?
- [ ] Изменились ли команды установки/сборки/запуска?
- [ ] Нужно ли обновить таблицу пакетов или peer-зависимостей в `README.md` / `docs/overview.md`?

## Автоматизация и агенты

- В репозитории включено **правило Cursor** `.cursor/rules/documentation-maintenance.mdc` (`alwaysApply`): ассистенты должны обновлять документацию по этой матрице при соответствующих задачах.
- Файл **`AGENTS.md`** дублирует краткую отсылку к процессу, чтобы вне IDE оставался явный контракт для людей и скриптов.

## Устаревшие разделы

Если раздел в `docs/architecture.md` перестал соответствовать коду — либо исправить документ, либо удалить/свернуть утверждение и заменить актуальным описанием в том же PR, что и исправление кода (по возможности).
