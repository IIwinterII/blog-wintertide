// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import axios from 'axios'; // 确保已安装 Axios

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  assetsInclude: ['**/*.mp4'],
  server: {
    open: true,
    port: 5173,
    // 添加代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端地址
        changeOrigin: true, // 允许域名代理
        //rewrite: (path) => path.replace(/^\/api/, '') // 去掉请求中的 `/api` 前缀
      }
    }
  }
});
