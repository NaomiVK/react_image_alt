import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()], // Enable React support in Vite
  base: '/react_image_alt/', // IMPORTANT: Set for GitHub Pages subdirectory
  
  // Specify the entry point for both development and build
  server: {
    open: '/image-alt-text.html', // Open this file when starting the dev server
  },
  
  // Treat PDF.js files as external resources
  optimizeDeps: {
    exclude: ['pdf.mjs', 'pdf.worker.mjs'],
  },
  
  // Resolve PDF.js files
  resolve: {
    alias: {
      '/pdf.mjs': '/js/pdfjs/pdf.mjs',
      '/pdf.worker.mjs': '/js/pdfjs/pdf.worker.mjs'
    }
  },
  
  // Explicitly tell Vite to ignore these files during build
  build: {
    outDir: 'docs', // Output built files to a 'docs' folder
    assetsDir: 'assets', // Bundled JS/CSS will go into 'docs/assets'
    rollupOptions: {
      input: {
        main: 'image-alt-text.html', // Use image-alt-text.html as the entry point
      },
      // Exclude PDF.js files from the build process
      external: ['/pdf.mjs', '/pdf.worker.mjs'],
      // You can customize output file names here if needed
      // Default hashed names are good for caching
      output: {
        // entryFileNames: `assets/bundle.[hash].js`,
        // assetFileNames: `assets/style.[hash].css`,
      }
    },
    emptyOutDir: true, // Clear the 'docs' folder before each build
  },
})