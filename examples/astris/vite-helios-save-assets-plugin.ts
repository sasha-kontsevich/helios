import fs from "fs";
import path from "path";
import type { Plugin } from "vite";

const ASSETS_ROOT = path.resolve(__dirname, "public/assets");

function upsertAssetIndex(relPath: string): void {
    const indexPath = path.join(ASSETS_ROOT, "asset-index.json");
    let list: string[] = [];
    if (fs.existsSync(indexPath)) {
        list = JSON.parse(fs.readFileSync(indexPath, "utf8")) as string[];
    }
    const norm = relPath.replace(/\\/g, "/");
    if (!list.includes(norm)) {
        list.push(norm);
        list.sort();
        fs.writeFileSync(indexPath, `${JSON.stringify(list, null, 2)}\n`, "utf8");
    }
}

function writeTextureMeta(fileName: string, guid: string): void {
    const metaPath = path.join(ASSETS_ROOT, "textures", `${fileName}.meta`);
    fs.writeFileSync(
        metaPath,
        `${JSON.stringify(
            { guid, type: "texture", loader: "loadTexture", dependencies: [] },
            null,
            2,
        )}\n`,
        "utf8",
    );
}

/** Dev-only: persist dropped textures under `public/assets/textures/`. */
export function heliosSaveAssetsPlugin(): Plugin {
    return {
        name: "helios-save-assets",
        configureServer(server) {
            server.middlewares.use("/__helios/save-texture", (req, res, next) => {
                if (req.method !== "POST") {
                    next();
                    return;
                }

                const chunks: Buffer[] = [];
                req.on("data", (c) => chunks.push(c));
                req.on("end", () => {
                    try {
                        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
                            fileName?: string;
                            guid?: string;
                            base64?: string;
                        };
                        const fileName = body.fileName;
                        const guid = body.guid;
                        const base64 = body.base64;
                        if (!fileName || !guid || !base64) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: "missing fields" }));
                            return;
                        }

                        const texturesDir = path.join(ASSETS_ROOT, "textures");
                        fs.mkdirSync(texturesDir, { recursive: true });
                        const outPath = path.join(texturesDir, fileName);
                        fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
                        writeTextureMeta(fileName, guid);
                        upsertAssetIndex(`textures/${fileName}`);

                        res.setHeader("Content-Type", "application/json");
                        res.end(
                            JSON.stringify({
                                guid,
                                assetPath: `textures/${fileName}`,
                                url: `/assets/textures/${fileName}`,
                            }),
                        );
                    } catch (err) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: String(err) }));
                    }
                });
            });
        },
    };
}
