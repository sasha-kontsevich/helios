import type { SavedTextureAsset } from "@merlinn/helios-editor";
import { fileToBase64, textureGuidFromFileName } from "@merlinn/helios-editor";

export async function saveTextureToAssets(file: File, guid: string): Promise<SavedTextureAsset> {
    const base64 = await fileToBase64(file);
    const res = await fetch("/__helios/save-texture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, guid, base64 }),
    });
    if (!res.ok) {
        throw new Error(`save-texture failed: ${res.status}`);
    }
    const data = (await res.json()) as { guid: string; assetPath: string };
    return { guid: data.guid, fileName: file.name, assetPath: data.assetPath };
}

export function textureGuidForFile(file: File): string {
    return textureGuidFromFileName(file.name);
}
