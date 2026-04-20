import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5176,
    strictPort: true,
    proxy: {
      // /ai-proxy/* → https://ai-gateway-test.xtool.com/*
      // 绕过 CORS：请求走本地 Vite 转发，不触发浏览器 preflight
      '/ai-proxy': {
        target: 'https://ai-gateway-test.xtool.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-proxy/, ''),
      },
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
