import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        vue(),
        dts({
            include: ["src/**/*.ts", "src/**/*.vue"],
            rollupTypes: true,
            strictOutput: true,
        }),
    ],
    build: {
        cssCodeSplit: false,
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "HeliosEditor",
            formats: ["es"],
            fileName: "index",
        },
        rollupOptions: {
            external: (id) =>
                id === "vue" ||
                id === "three" ||
                id.startsWith("three/") ||
                id.startsWith("@merlinn/helios-core") ||
                id.startsWith("@merlinn/helios-three-plugin"),
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith(".css")) {
                        return "style.css";
                    }
                    return assetInfo.name ?? "asset";
                },
            },
        },
        sourcemap: true,
        emptyOutDir: true,
        outDir: "dist",
    },
});
