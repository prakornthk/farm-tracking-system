import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    rollupOptions: {
      output: {
        // NOTE: @line/liff is not installed (uses mock in dev).
        // When installing @line/liff-2 in production, add it here:
        // 'vendor-liff': ['@line/liff']
        manualChunks: {
          // Split vendor chunks for better caching and parallel loading
          'vendor-react': ['react', 'react-dom'],
          'vendor-http':  ['axios']
        },
        // Clean file names with content hash for long-term caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Inline small assets (< 4KB) to reduce HTTP requests
    assetsInlineLimit: 4096
  },
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios']
  }
})
