import { Component, useEffect, useState } from 'react'
import { f } from '../copy/fitur'

// Kondisi layar (spesifikasi 8.13): memuat (skeleton), galat, offline.
export const Skeleton = ({ className = '' }) => <div aria-hidden className={`animate-pulse rounded-2xl bg-teks/10 ${className}`} />

export const SkeletonKartu = ({ n = 3 }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="overflow-hidden rounded-2xl bg-kartu">
        <Skeleton className="aspect-[4/3] rounded-none" />
        <div className="space-y-2 p-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
      </div>
    ))}
  </div>
)

export const Memuat = ({ pesan = f.kondisi.memuat, n }) => (
  <div role="status" className="space-y-4">
    <p className="text-sm text-neutral-500">{pesan}</p>
    <SkeletonKartu n={n} />
  </div>
)

const Panci = () => (
  <svg viewBox="0 0 96 96" className="mx-auto size-24 text-waktu" aria-hidden>
    <path d="M20 46h56v20a14 14 0 0 1-14 14H34a14 14 0 0 1-14-14z" fill="currentColor" />
    <rect x="14" y="40" width="68" height="9" rx="4.5" fill="currentColor" opacity=".7" />
    <path d="M12 56h8M76 56h8" stroke="currentColor" opacity=".7" strokeWidth="5" strokeLinecap="round" />
    <path d="M36 32c-6-6 6-8 0-16M50 32c-6-6 6-8 0-16M64 32c-6-6 6-8 0-16" stroke="currentColor" opacity=".45" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
)

export function Galat({ apa = f.kondisi.layar, kode, onCoba }) {
  const k = f.kondisi
  return (
    <div role="alert" className="mx-auto max-w-sm space-y-3 py-10 text-center">
      <Panci />
      <h2 className="font-judul text-2xl font-bold">{k.judulGalat}</h2>
      <p className="text-neutral-600">{k.isiGalat(apa)}</p>
      {onCoba && <button onClick={onCoba} className="w-full rounded-xl bg-terakota py-3 font-medium text-white">{k.coba}</button>}
      <a href="/" className="block text-sm text-sage-gelap">{k.kembali}</a>
      {kode && <p className="text-xs text-neutral-400">{k.kode(kode)}</p>}
    </div>
  )
}

export function BannerOffline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const naik = () => setOnline(true)
    const turun = () => setOnline(false)
    window.addEventListener('online', naik)
    window.addEventListener('offline', turun)
    return () => { window.removeEventListener('online', naik); window.removeEventListener('offline', turun) }
  }, [])
  if (online) return null
  return (
    <div role="alert" className="fixed inset-x-0 top-0 z-[60] bg-neutral-800 px-4 py-3 text-center text-sm text-white">
      <strong>{f.kondisi.offlineJudul}.</strong> {f.kondisi.offlineIsi}{' '}
      <button onClick={() => location.reload()} className="ml-1 underline">{f.kondisi.coba}</button>
    </div>
  )
}

// Menangkap galat tak terduga di layar supaya aplikasi tidak putih kosong.
export class ErrorBoundary extends Component {
  state = { galat: false }
  static getDerivedStateFromError() { return { galat: true } }
  render() {
    return this.state.galat ? <Galat kode="APP-500" onCoba={() => location.reload()} /> : this.props.children
  }
}
