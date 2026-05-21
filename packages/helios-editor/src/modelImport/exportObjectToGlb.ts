import * as THREE from "three";
import type { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

function ensureFileReaderPolyfill(): void {
    if (typeof globalThis.FileReader !== "undefined") {
        return;
    }
    globalThis.FileReader = class FileReader {
        result: ArrayBuffer | string | null = null;
        onload: (() => void) | null = null;
        readAsArrayBuffer(blob: Blob): void {
            void blob.arrayBuffer().then((buf) => {
                this.result = buf;
                this.onload?.();
            });
        }
        readAsDataURL(blob: Blob): void {
            void blob.arrayBuffer().then((buf) => {
                const bytes = new Uint8Array(buf);
                let binary = "";
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]!);
                }
                this.result = `data:application/octet-stream;base64,${btoa(binary)}`;
                this.onload?.();
            });
        }
    } as unknown as typeof FileReader;
}

/** Assign a standard material so GLTFExporter works reliably in the browser. */
export function assignDefaultExportMaterial(root: THREE.Object3D): void {
    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            obj.material = mat;
        }
    });
}

export async function exportObjectToGlb(root: THREE.Object3D): Promise<ArrayBuffer> {
    ensureFileReaderPolyfill();
    const { GLTFExporter: Exporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
    const exporter = new Exporter() as GLTFExporter;
    const result = await exporter.parseAsync(root, { binary: true });
    if (result instanceof ArrayBuffer) {
        return result;
    }
    throw new Error("GLTFExporter did not return ArrayBuffer");
}
