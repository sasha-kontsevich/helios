#!/usr/bin/env node
/**
 * Import OBJ / FBX / GLB into Helios model bundle (GLB + manifest + .meta files).
 *
 * Usage: helios import-model <file> --out <assets/models/name> [--project <root>]
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import obj2gltf from "obj2gltf";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { buildModelBundleFromGltf } from "@merlinn/helios-three-plugin";

interface CliArgs {
    input: string;
    outDir: string;
    projectRoot: string;
    modelName: string;
}

/** `--out assets/models/foo` → `models/foo` under `public/assets`. */
function normalizeAssetsOutDir(outDir: string): string {
    const norm = outDir.replace(/\\/g, "/").replace(/^\/+/, "");
    if (norm.startsWith("assets/")) {
        return norm.slice("assets/".length);
    }
    return norm;
}

function parseArgs(argv: string[]): CliArgs {
    const positional: string[] = [];
    let outDir = "";
    let projectRoot = process.cwd();

    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--out" && argv[i + 1]) {
            outDir = argv[++i];
        } else if (a === "--project" && argv[i + 1]) {
            projectRoot = path.resolve(argv[++i]);
        } else if (!a.startsWith("-")) {
            positional.push(a);
        }
    }

    if (positional.length === 0) {
        console.error("Usage: helios import-model <file.obj|fbx|glb> --out assets/models/<name>");
        process.exit(1);
    }
    if (!outDir) {
        console.error("Missing --out (e.g. assets/models/crate)");
        process.exit(1);
    }

    const input = path.resolve(positional[0]);
    const modelName = path.basename(outDir);
    return { input, outDir, projectRoot, modelName };
}

async function objToGlbBuffer(objPath: string): Promise<ArrayBuffer> {
    const result = await obj2gltf(objPath, { binary: true });
    if (result instanceof ArrayBuffer) {
        return result;
    }
    const buf = result as Buffer;
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function fbxToGlb(inputPath: string, outputGlb: string): void {
    try {
        execSync(`fbx2gltf -b "${inputPath}" -o "${outputGlb}"`, { stdio: "inherit" });
    } catch {
        console.error(
            "[helios import-model] FBX requires `fbx2gltf` in PATH. Install from https://github.com/facebookincubator/FBX2glTF",
        );
        process.exit(1);
    }
}

async function loadGltfFromBuffer(buffer: ArrayBuffer, resourcePath: string): Promise<GLTF> {
    const loader = new GLTFLoader();
    return loader.parseAsync(buffer, resourcePath);
}

function writeMeta(filePath: string, meta: Record<string, unknown>): void {
    fs.writeFileSync(`${filePath}.meta`, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
}

function upsertAssetIndex(projectRoot: string, relPaths: string[]): void {
    const indexPath = path.join(projectRoot, "public/assets/asset-index.json");
    let list: string[] = [];
    if (fs.existsSync(indexPath)) {
        list = JSON.parse(fs.readFileSync(indexPath, "utf8")) as string[];
    }
    const set = new Set(list);
    for (const p of relPaths) {
        set.add(p.replace(/\\/g, "/"));
    }
    fs.writeFileSync(indexPath, `${JSON.stringify([...set].sort(), null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv);
    const assetsRoot = path.join(args.projectRoot, "public/assets");
    const outRel = normalizeAssetsOutDir(args.outDir);
    const outAbs = path.join(assetsRoot, outRel);
    fs.mkdirSync(outAbs, { recursive: true });

    const ext = path.extname(args.input).toLowerCase();
    const glbName = `${args.modelName}.glb`;
    const glbAbs = path.join(outAbs, glbName);
    const manifestName = `${args.modelName}.manifest.json`;
    const manifestAbs = path.join(outAbs, manifestName);

    if (ext === ".fbx") {
        fbxToGlb(args.input, glbAbs);
    } else if (ext === ".obj") {
        const buf = await objToGlbBuffer(args.input);
        fs.writeFileSync(glbAbs, Buffer.from(buf));
    } else if (ext === ".glb" || ext === ".gltf") {
        fs.copyFileSync(args.input, glbAbs);
    } else {
        console.error(`Unsupported extension: ${ext}`);
        process.exit(1);
    }

    const glbFile = fs.readFileSync(glbAbs);
    const glbBuffer = glbFile.buffer.slice(
        glbFile.byteOffset,
        glbFile.byteOffset + glbFile.byteLength,
    );
    const gltf = await loadGltfFromBuffer(glbBuffer, glbAbs);

    const modelGuid = `guid://models/${args.modelName}`;
    const glbGuid = `guid://models/${args.modelName}/glb`;
    const bundle = buildModelBundleFromGltf(gltf, {
        modelGuid,
        glbGuid,
        modelName: args.modelName,
    });

    fs.writeFileSync(manifestAbs, `${JSON.stringify(bundle.manifest, null, 2)}\n`, "utf8");

    const glbRelUrl = `/assets/${outRel}/${glbName}`;
    const manifestRelUrl = `/assets/${outRel}/${manifestName}`;

    writeMeta(glbAbs, {
        guid: glbGuid,
        type: "gltf",
        loader: "loadGltfBinary",
        dependencies: [],
    });
    writeMeta(manifestAbs, {
        guid: modelGuid,
        type: "model",
        loader: "loadModel",
        dependencies: [glbGuid],
    });

    for (const m of bundle.meshMetas) {
        const geoMetaPath = path.join(outAbs, `geo_${m.gltfMeshIndex}.json`);
        fs.writeFileSync(geoMetaPath, "{}\n", "utf8");
        writeMeta(geoMetaPath, {
            guid: m.guid,
            type: "geometry",
            loader: "loadGltfMesh",
            dependencies: m.dependencies,
            gltfMeshIndex: m.gltfMeshIndex,
            gltfPrimitiveIndex: m.gltfPrimitiveIndex,
        });
    }

    for (const m of bundle.materialMetas) {
        const matMetaPath = path.join(outAbs, `mat_${m.gltfMeshIndex}.json`);
        fs.writeFileSync(matMetaPath, "{}\n", "utf8");
        writeMeta(matMetaPath, {
            guid: m.guid,
            type: "material",
            loader: "loadGltfMaterial",
            dependencies: m.dependencies,
            gltfMeshIndex: m.gltfMeshIndex,
            gltfPrimitiveIndex: m.gltfPrimitiveIndex,
        });
    }

    const indexEntries = [
        `${outRel}/${manifestName}`,
        `${outRel}/${glbName}`,
        ...bundle.meshMetas.map((_, i) => `${outRel}/geo_${i}.json`),
        ...bundle.materialMetas.map((_, i) => `${outRel}/mat_${i}.json`),
    ];
    upsertAssetIndex(args.projectRoot, indexEntries);

    console.log(`Imported model → ${outAbs}`);
    console.log(`  manifest GUID: ${modelGuid}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
