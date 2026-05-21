import type { AssetRecord } from "@merlinn/helios-core";
import type { EngineAPI } from "@merlinn/helios-core";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp"]);

export function isDroppedImageFile(file: File): boolean {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    return IMAGE_EXT.has(ext);
}

export function textureAssetNameFromFile(fileName: string): string {
    const base = fileName.replace(/\.[^.]+$/, "") || "texture";
    return base.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_|_$/g, "") || "texture";
}

export function textureGuidFromFileName(fileName: string): string {
    return `guid://textures/${textureAssetNameFromFile(fileName)}`;
}

export function textureAssetRecord(fileName: string, guid?: string): AssetRecord {
    const g = guid ?? textureGuidFromFileName(fileName);
    return {
        guid: g,
        type: "texture",
        loader: "loadTexture",
        path: `/assets/textures/${fileName}`,
    };
}

/** Register meta + load texture into ResourceManager (after optional disk save). */
export async function registerDroppedTexture(
    api: EngineAPI,
    fileName: string,
    guid?: string,
): Promise<string> {
    const record = textureAssetRecord(fileName, guid);
    api.preloadAsset(record);
    try {
        await api.loadAsset(record.guid);
    } catch {
        // meta registered; ThreeResourceBuildSystem will retry load
    }
    return record.guid;
}

export async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
}
