// IAssetLoader.ts
export interface IAssetLoader<T = any> {
    /**
     * Загружает ассет по path (URL или относительному пути),
     * возвращает готовый объект (например, HTMLImageElement, THREE.Mesh и т.п.)
     */
    load(path: string): Promise<T>;
}
