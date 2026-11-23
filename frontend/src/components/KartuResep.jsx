import { Link } from 'react-router-dom'
import { t } from '../copy/id'
import { angka } from '../lib/format'
import FotoResep from './FotoResep'
import { IkonBintang, IkonJam } from './Ikon'

const PIL = 'absolute bottom-2.5 inline-flex items-center gap-1 rounded-full bg-kartu/95 px-2.5 py-1 text-xs font-medium text-waktu shadow-sm'

// Kartu resep di Beranda, Hasil, Jelajahi, Favorit. Foto jadi pusat kartu; label (Siap | angka) dipakai Jelajahi/Favorit.
export default function KartuResep({ resep: r, label, className = '', style }) {
  const k = t.kartu
  return (
    <Link
      to={`/resep/${r.id}`}
      state={{ resep: r }}
      style={style}
      className={`group block overflow-hidden rounded-3xl bg-kartu shadow-[0_2px_10px_rgba(27,20,22,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(27,20,22,0.16)] active:scale-[0.98] ${className}`}
    >
      <div className="relative overflow-hidden">
        <FotoResep resep={r} className="aspect-[4/3] transition duration-500 group-hover:scale-105" />
        {r.foto_url && <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/45 to-transparent" aria-hidden />}
        <span className={`${PIL} left-3`}><IkonJam className="size-3.5" />{k.mnt(r.total)}</span>
        {r.jumlah_ulasan > 0 && <span className={`${PIL} right-3`}><IkonBintang className="size-3.5 text-terakota" />{angka(r.rating_rata)}</span>}
        {label !== undefined && (
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${label === 'siap' ? 'bg-siap text-sage-gelap' : 'bg-kurang text-terakota'}`}>
            {label === 'siap' ? k.siap : k.kurangN(label)}
          </span>
        )}
        {r.eksklusif && <span className="absolute right-3 top-3 rounded-full bg-emas px-3 py-1 text-xs font-semibold">{k.plus}</span>}
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="line-clamp-2 font-judul text-base font-semibold leading-snug">{r.judul}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
          <span className="rounded-full bg-teks/5 px-2 py-0.5">{t.waktu[r.chip_waktu]}</span>
          {r.eksklusif && <span>{k.eksklusif}</span>}
        </div>
        {label === undefined && r.bahan_pantry_terpakai > 0 && <p className="text-sm font-medium text-sage-gelap">{k.pakai(r.bahan_pantry_terpakai)}</p>}
        {r.jumlah_kurang_takaran > 0 && label === undefined && <p className="text-xs text-neutral-500">{k.porsiKecil}</p>}
        {r.jumlah_kurang === 1 && label === undefined && (
          <p className="inline-block rounded-full bg-kurang px-3 py-0.5 text-xs text-terakota">{k.kurang(r.bahan_kurang[0].nama.toLowerCase())}</p>
        )}
        {r.butuh_alat_lain && <p className="text-xs text-neutral-500">{k.alatLain}</p>}
      </div>
    </Link>
  )
}
