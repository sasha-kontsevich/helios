import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    root: '.',
    plugins: [
        tsconfigPaths({
            // Опционально: укажи, откуда брать tsconfig, например:
            // projects: [path.resolve(__dirname, './tsconfig.json')]
        })
    ],
    server: {
        open: true,
        fs: {
            // чтобы отдавались файлы из родительских пакетов
            allow: ['..']
        }
    }
});
