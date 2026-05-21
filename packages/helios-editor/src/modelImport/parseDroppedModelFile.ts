import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { buildModelBundleFromGltf } from "@merlinn/helios-three-plugin";
import { assignDefaultExportMaterial, exportObjectToGlb } from "./exportObjectToGlb";

export type DroppedModelParseResult =
    | {
          ok: true;
          bundle: ReturnType<typeof buildModelBundleFromGltf>;
          glbBlob: Blob;
          modelName: string;
          gltf: import("three/examples/jsm/loaders/GLTFLoader.js").GLTF;
      }
    | { ok: false; message: string };

function stripExtension(name: string): string {
    return name.replace(/\.(glb|gltf|obj|fbx)$/i, "") || "model";
}

export async function parseDroppedModelFile(file: File): Promise<DroppedModelParseResult> {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const modelName = stripExtension(file.name);

    if (ext === "fbx") {
        return {
            ok: false,
            message: "FBX: импортируйте через CLI (helios import-model) с установленным fbx2gltf.",
        };
    }

    if (ext === "obj") {
        const text = await file.text();
        const group = new OBJLoader().parse(text);
        assignDefaultExportMaterial(group);
        const glbBuffer = await exportObjectToGlb(group);
        const gltf = await new GLTFLoader().parseAsync(glbBuffer, file.name);
        const modelGuid = `guid://models/${modelName}`;
        const glbGuid = `guid://models/${modelName}/glb`;
        const bundle = buildModelBundleFromGltf(gltf, { modelGuid, glbGuid, modelName });
        return { ok: true, bundle, glbBlob: new Blob([glbBuffer], { type: "model/gltf-binary" }), modelName, gltf };
    }

    if (ext === "glb" || ext === "gltf") {
        const buffer = await file.arrayBuffer();
        const gltf = await new GLTFLoader().parseAsync(buffer, file.name);
        const modelGuid = `guid://models/${modelName}`;
        const glbGuid = `guid://models/${modelName}/glb`;
        const bundle = buildModelBundleFromGltf(gltf, { modelGuid, glbGuid, modelName });
        return {
            ok: true,
            bundle,
            glbBlob: new Blob([buffer], { type: "model/gltf-binary" }),
            modelName,
            gltf,
        };
    }

    return { ok: false, message: `Неподдерживаемый формат: .${ext}` };
}
