import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@core': path.resolve(__dirname, '../../packages/core/src'),
            '@editor': path.resolve(__dirname, '../../packages/editor/src')
        }
    }
});
