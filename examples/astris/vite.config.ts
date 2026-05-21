import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths';
import { heliosSaveAssetsPlugin } from './vite-helios-save-assets-plugin';

export default defineConfig({
    plugins: [vue(), tsconfigPaths(), heliosSaveAssetsPlugin()],
});
