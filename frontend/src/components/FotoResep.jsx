// Latar hangat dari palet untuk resep yang belum punya foto; dipilih konsisten dari judulnya.
const LATAR = ['from-kurang to-emas', 'from-siap to-emas/70', 'from-emas/80 to-kurang', 'from-siap to-kurang']
const pilih = (s) => LATAR[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % LATAR.length]

export default function FotoResep({ resep, className = 'aspect-[4/3]' }) {
  return resep.foto_url ? (
    <img src={resep.foto_url} alt={resep.judul} loading="lazy" className={`w-full object-cover ${className}`} />
  ) : (
    <div className={`flex w-full items-center justify-center bg-gradient-to-br ${pilih(resep.judul)} ${className}`} aria-hidden>
      <svg viewBox="0 0 64 64" className="size-1/4 min-w-10 max-w-20 text-sage-gelap/45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 32h48a24 24 0 0 1-48 0z" />
        <path d="M22 22c-4-4 4-6 0-12M34 22c-4-4 4-6 0-12M46 22c-4-4 4-6 0-12" />
      </svg>
    </div>
  )
}
