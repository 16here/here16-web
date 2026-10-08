import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 前端构建配置（用户端 + 管理端双入口）。
 *
 * - 用户端入口：index.html（访问 /）
 * - 管理端入口：admin.html（访问 /admin.html，路由使用 hash 模式）
 * - 开发服务器：端口 5173，/api 代理到后端 8080
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // 开发环境将 /api 代理到后端，前端无需关心跨域
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      // 双入口：分别构建用户端与管理端页面
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        admin: new URL('./admin.html', import.meta.url).pathname
      }
    }
  }
})
