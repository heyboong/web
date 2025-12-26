import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import jsconfigPaths from 'vite-jsconfig-paths'
import eslint from 'vite-plugin-eslint';
import svgr from 'vite-plugin-svgr'
import tailwindcss from "@tailwindcss/vite";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), jsconfigPaths(), svgr(),
  eslint(), tailwindcss(),
  ],
  resolve: {
    alias: {
      app: path.resolve(__dirname, 'src/app'),
      components: path.resolve(__dirname, 'src/components'),
      constants: path.resolve(__dirname, 'src/constants'),
      configs: path.resolve(__dirname, 'src/configs'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      styles: path.resolve(__dirname, 'src/styles'),
      i18n: path.resolve(__dirname, 'src/i18n'),
      utils: path.resolve(__dirname, 'src/utils'),
      services: path.resolve(__dirname, 'src/services'),
      middleware: path.resolve(__dirname, 'src/middleware'),
      assets: path.resolve(__dirname, 'src/assets'),
      fonts: path.resolve(__dirname, 'src/fonts'),
    },
  },
  base: '/',
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['via88online.com', 'localhost', '127.0.0.1', '51.79.188.189'],
    hmr: {
      port: 5173,
      host: 'localhost',
      protocol: 'ws'
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/api': {
        target: 'http://localhost:2324',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    watch: {
      include: 'src/**'
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true
  }
})
