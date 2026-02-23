import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'// 1. 引入插件
import Sitemap from 'vite-plugin-sitemap';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
      
    }),
    Sitemap({ 
      hostname: 'https://tier-list-maker168.netlify.app/', // 替換成你的網址
      dynamicRoutes: [], // 如果是 SPA，手動列出路由
    }),
    tailwindcss(), // 2. 加入這裡
  ],
})
