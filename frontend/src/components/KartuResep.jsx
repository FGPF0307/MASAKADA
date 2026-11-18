import { Link } from 'react-router-dom'
import { t } from '../copy/id'
import { angka } from '../lib/format'
import FotoResep from './FotoResep'

// Kartu resep di Beranda, Hasil, dan Jelajahi. label ('siap' | angka) dipakai Jelajahi.
export default function KartuResep({ resep: r, label }) {
  const k = t.kartu
  return (
    <Link to={`/resep/${r.id}`} className="block overflow-hidden rounded-2xl bg-kartu shadow-sm">
      <div className="relative">
        <FotoResep resep={r} />
        <span className="absolute bottom-2 left-2 rounded-full bg-waktu px-3 py-1 text-xs font-medium text-white">{k.mnt(r.total)}</span>
        {label !== undefined && (
          <span className={`absolute left-2 top-2 rounded-full px-3 py-1 text-xs font-medium ${label === 'siap' ? 'bg-siap text-sage-gelap' : 'bg-kurang text-terakota'}`}>
            {label === 'siap' ? k.siap : k.kurangN(label)}
          </span>
        )}
        {r.eksklusif && <span className="absolute right-2 top-2 rounded-full bg-emas px-3 py-1 text-xs font-semibold">{k.plus}</span>}
      </div>
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-2 font-medium leading-snug">{r.judul}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
          <span className="rounded-full bg-black/5 px-2 py-0.5">{t.waktu[r.chip_waktu]}</span>
          {r.jumlah_ulasan > 0 && <span>★ {angka(r.rating_rata)} ({r.jumlah_ulasan})</span>}
          {r.eksklusif && <span>{k.eksklusif}</span>}
        </div>
        {label === undefined && r.bahan_pantry_terpakai > 0 && <p className="text-sm text-sage-gelap">{k.pakai(r.bahan_pantry_terpakai)}</p>}
        {r.jumlah_kurang_takaran > 0 && label === undefined && <p className="text-xs text-neutral-500">{k.porsiKecil}</p>}
        {r.jumlah_kurang === 1 && label === undefined && (
          <p className="inline-block rounded-full bg-kurang px-3 py-0.5 text-xs text-terakota">{k.kurang(r.bahan_kurang[0].nama.toLowerCase())}</p>
        )}
        {r.butuh_alat_lain && <p className="text-xs text-neutral-500">{k.alatLain}</p>}
      </div>
    </Link>
  )
}
