const PASTEL = ['bg-[#ffd9c7]', 'bg-[#cfebd8]', 'bg-[#fbefb5]', 'bg-[#e3d9f7]', 'bg-[#d3e6f8]']
const warna = (s) => PASTEL[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PASTEL.length]

// Foto resep; bila belum ada foto, tampil blok pastel dengan inisial judul.
export default function FotoResep({ resep, className = 'aspect-[4/3]' }) {
  return resep.foto_url ? (
    <img src={resep.foto_url} alt={resep.judul} loading="lazy" className={`w-full object-cover ${className}`} />
  ) : (
    <div className={`flex w-full items-center justify-center font-judul text-4xl text-neutral-600/70 ${warna(resep.judul)} ${className}`} aria-hidden>
      {resep.judul.slice(0, 2)}
    </div>
  )
}
