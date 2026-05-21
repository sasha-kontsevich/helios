# Документация Helios

| Документ | Назначение |
|----------|------------|
| [overview.md](overview.md) | Краткий обзор монорепозитория и пакетов |
| [architecture.md](architecture.md) | **Подробная архитектура:** цели, стек, границы пакетов, редактор, поток данных |
| [scene-serialization.md](scene-serialization.md) | **Сцены и префабы:** core-компоненты рендера, дескрипторы, runtime Three |
| [model-import.md](model-import.md) | **Импорт 3D:** OBJ/FBX/GLB → GLB + manifest, `ModelInstance`, CLI и редактор |
| [textures.md](textures.md) | **Текстуры:** GUID-ассеты `loadTexture`, слоты в `Material.descriptor`, сцена и инспектор |
| [skybox.md](skybox.md) | **Скайбокс:** компонент `Skybox`, equirectangular panorama |
| [editor-game-viewport-future.md](editor-game-viewport-future.md) | Статус **editor vs game** viewport (два canvas, capability `activeView`; оставшиеся доработки) |
| [maintaining-documentation.md](maintaining-documentation.md) | Как **поддерживать** документацию актуальной (матрица код → файлы, чеклист) |

Корень репозитория:

- **[README.md](../README.md)** — установка, запуск примера, ссылка на SDK редактора
- **[AGENTS.md](../AGENTS.md)** — соглашения для ассистентов и команды разработки

Процесс актуализации описан в [maintaining-documentation.md](maintaining-documentation.md); правило Cursor напоминает об обновлении документов при изменениях архитектуры и API.
