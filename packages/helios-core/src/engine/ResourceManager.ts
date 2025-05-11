export class ResourceManager {
    private nextId = 1;
    private resources = new Map<number, unknown>();

    /**
     * Положить ресурс и получить его numeric ID.
     * @param resource — объект (геометрия, материал, камера и т.п.)
     * @param existingId — если нужно зафиксировать конкретный ID
     */
    set<T>(resource: T, existingId?: number): number {
        const id = existingId ?? this.nextId++;
        this.resources.set(id, resource);
        return id;
    }

    /**
     * Строгое получение ресурса. Бросает ошибку, если ресурса нет.
     * @param id — numeric resourceId
     */
    get<T>(id: number): T {
        const res = this.resources.get(id);
        if (res === undefined) {
            throw new Error(`[ResourceManager] Resource with ID ${id} not found.`);
        }
        return res as T;
    }

    /**
     * Нестрогое получение ресурса. Возвращает undefined, если ресурса нет.
     * @param id — numeric resourceId
     */
    getOrNot<T>(id: number): T | undefined {
        return this.resources.get(id) as T | undefined;
    }

    /** Проверить, есть ли ресурс с этим ID */
    has(id: number): boolean {
        return this.resources.has(id);
    }

    /** Удалить ресурс по ID */
    delete(id: number): void {
        this.resources.delete(id);
    }

    /** Полностью очистить все ресурсы и сбросить счётчик ID */
    clear(): void {
        this.resources.clear();
        this.nextId = 1;
    }

    /** Получить массив всех зарегистрированных ID */
    keys(): number[] {
        return Array.from(this.resources.keys());
    }
}
