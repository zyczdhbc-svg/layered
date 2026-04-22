import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const chatCompletionsProxy = {
  target: 'https://ai-gateway-test.xtool.com',
  changeOrigin: true,
  rewrite: () => '/v1/chat/completions',
}

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  base: './',
  server: {
    port: 5176,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      '/api/chat-completions': chatCompletionsProxy,
    },
  },
  preview: {
    proxy: {
      '/api/chat-completions': chatCompletionsProxy,
    },
  },
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app.html'),
        embed: path.resolve(__dirname, 'embed.html'),
      },
      output: {
        entryFileNames: 'assets/index.[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
}))
