import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 限制请求头大小
            Object.keys(req.headers).forEach(key => {
              if (key === 'cookie' && req.headers[key].length > 4000) {
                // 如果cookie太大，只保留必要的部分
                const essentialCookies = req.headers[key].split(';').filter(cookie => 
                  cookie.trim().startsWith('JSESSIONID') || 
                  cookie.trim().startsWith('remember-me')
                ).join(';');
                proxyReq.setHeader(key, essentialCookies);
              }
            });
          });
        }
      }
    },
    // 增加请求头大小限制
    maxHeadersSize: 16 * 1024 // 16KB
  }
})