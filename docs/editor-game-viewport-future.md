# Редактор vs «игра» во вьюпорте

## Сделано (2026-05)

- **Два canvas:** `#helios-editor-view` (редактор) и `#helios-game-view` (игра) в shell; `ThreeRenderContext` держит два WebGL-рендерера и два прохода.
- **Capability `editor.shell.activeView`:** shell выставляет `"editor"` | `"game"`; `RenderSystem` рендерит соответствующий viewport; в game-pass скрывается editor overlay.
- **Вкладка «Игра»:** отдельный режим ввода (без орбиты/гизмо), опциональный `GAME_VIEWPORT_POINTER_SINK_CAPABILITY` для ЛКМ в game canvas.
- **Play mode:** снимок сцены + `beginPlaySessionSystems` / `endPlaySessionSystems`; симуляция только после Enter Play (см. `docs/architecture.md`).

Связанный код:

- [`packages/helios-three-plugin/src/ThreeRenderContext.ts`](../packages/helios-three-plugin/src/ThreeRenderContext.ts) — dual renderer, `renderEditorViewport` / `renderGameViewport`.
- [`packages/helios-three-plugin/src/systems/RenderSystem.ts`](../packages/helios-three-plugin/src/systems/RenderSystem.ts) — ветка по `EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY`.
- [`packages/helios-editor/src/inspector/EditorShell.vue`](../packages/helios-editor/src/inspector/EditorShell.vue), [`createEditor.ts`](../packages/helios-editor/src/createEditor.ts).
- Пример: [`examples/astris/src/plugins/GameOfLifeViewportPlugin.ts`](../examples/astris/src/plugins/GameOfLifeViewportPlugin.ts).

## Возможные доработки (не блокеры)

- Жёстче гарантировать, что в game view **всегда** используется только ECS-камера (`activeCamera`), без fallback на свободную камеру редактора, если в мире нет камеры.
- Общие настройки качества/тонемаппинга для двух контекстов; синхронизация resize при скрытой вкладке.
- E2E или визуальные тесты переключения editor/game и Enter/Exit Play.

Дата обновления статуса: 2026-05-15.
