import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('index.html', import.meta.url)),
        "3dview": fileURLToPath(new URL('3dview.html', import.meta.url)),
      }
    }
  }
});
