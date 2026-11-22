import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { terapkanTema } from './lib/tema'
import { terapkanUkuran } from './lib/ukuranTeks'

terapkanTema() // tema warna pilihan pengguna
terapkanUkuran() // ukuran teks pilihan pengguna

// PWA: cangkang aplikasi bisa dibuka offline (hanya di build produksi).
if ('serviceWorker' in navigator && import.meta.env.PROD)
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
