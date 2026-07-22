import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    {
      name: 'crm-whatsapp-tailwind-compat',
      enforce: 'pre',
      transform(code, id) {
        if (!id.replace(/\\/g, '/').endsWith('/features/whatsapp-marketing/app/index.css')) return null
        return code
          .replace('@import "tailwindcss";', '@tailwind base;\n@tailwind components;\n@tailwind utilities;')
          .replace('@import "tw-animate-css";', '')
          .replace('@custom-variant dark (&:is(.dark *));', '')
      },
    },
    react(),
  ],
  resolve: {
    // The WhatsApp source lives in a sibling project. Force every shared
    // component (including Radix primitives) to use CRM's single React
    // dispatcher; two React copies produce invalid hook calls at runtime.
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@whatsapp': path.resolve(__dirname, '../sellerslogin-admin/src/features/whatsapp-marketing/app'),
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  define: {
    'import.meta.env.VITE_WHATSAPP_MARKETING_API_URL': JSON.stringify(
      process.env.VITE_WHATSAPP_MARKETING_API_URL || '/api/whatsapp-marketing',
    ),
  },
  server: { fs: { allow: [path.resolve(__dirname, '..')] } },
})
