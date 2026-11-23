import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // host: true → bisa dibuka dari HP di jaringan yang sama (alamat "Network" di terminal).
  server: { host: true, proxy: { '/api': 'http://localhost:4000' } },
})
