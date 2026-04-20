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

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5176,
    strictPort: true,
    proxy: {
      // 与生产环境同源路径一致，由本地转发到网关（避免浏览器 CORS）
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
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
})
