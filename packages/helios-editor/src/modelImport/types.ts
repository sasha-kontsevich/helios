import type { GeneratedModelBundle } from "@merlinn/helios-three-plugin";
import type { ModelManifest } from "@merlinn/helios-core";

export interface ModelImportFiles {
    glb: Blob;
    manifestJson: string;
    modelName: string;
}

export interface SavedTextureAsset {
    guid: string;
    fileName: string;
    assetPath: string;
}

export interface EditorModelImportHost {
    /** Persist generated bundle under `public/assets` (host implements; e.g. Astris dev server path). */
    saveModelBundle?: (bundle: GeneratedModelBundle, files: ModelImportFiles) => Promise<string | void>;
    /** Persist image under `public/assets/textures/` (dev middleware in Astris). */
    saveTexture?: (file: File, guid: string) => Promise<SavedTextureAsset | void>;
    /** Called after a preview spawn from drop. */
    onModelSpawned?: (rootEid: number, manifest: ModelManifest) => void;
}
