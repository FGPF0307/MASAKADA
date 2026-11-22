// Logo MasakAda: lambang topi koki (public/logo-topi.svg) + nama. `className` mengatur ukuran teks; lambang ikut skala (1.7em).
export default function Logo({ className = 'text-2xl', tanpaNama = false }) {
  return (
    <span className={`inline-flex items-center gap-2 font-judul font-bold ${className}`}>
      <img src="/logo-topi.svg" alt={tanpaNama ? 'MasakAda' : ''} className="size-[1.7em] shrink-0" />
      {!tanpaNama && (
        <span>
          <span className="text-waktu">Masak</span>
          <span className="text-sage-gelap">Ada</span>
        </span>
      )}
    </span>
  )
}
