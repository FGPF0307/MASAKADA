import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Galat, Memuat } from '../components/Kondisi'
import TombolKembali from '../components/TombolKembali'
import { f } from '../copy/fitur'
import { kelompokWaktu } from '../lib/tampil'

// Riwayat memasak (spesifikasi 8.11 #42).
export default function Riwayat() {
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)
  const [ulang, setUlang] = useState(0)
  const r = f.riwayat

  useEffect(() => { api('/riwayat').then(setD).catch(setGalat) }, [ulang])

  if (galat && !d) return <Galat apa="riwayat memasakmu" onCoba={() => { setGalat(null); setUlang((n) => n + 1) }} />
  if (!d) return <Memuat />

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/profil" />
        <h1 className="font-judul text-3xl font-bold">{r.judul}</h1>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-2xl bg-sage-gelap p-4 text-white"><p className="text-sm text-white/80">{r.bulanIni(d.bulan_ini)}</p></div>
        <div className="flex-1 rounded-2xl bg-kartu p-4"><p className="text-sm text-neutral-600">{r.bahanTerpakai(d.bahan_bulan_ini)}</p></div>
      </div>

      {d.daftar.length === 0 && <p className="py-8 text-center text-neutral-500">{r.kosong}</p>}

      {kelompokWaktu(d.daftar, 'dimasak_pada').map(([kunci, daftar]) => (
        <section key={kunci} className="space-y-2">
          <h2 className="font-judul text-lg font-bold">{r.kelompok[kunci]}</h2>
          <ul className="space-y-2">
            {daftar.map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-2xl bg-kartu p-3">
                {h.foto_url ? <img src={h.foto_url} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl object-cover" /> : <span className="size-16 shrink-0 rounded-xl bg-siap" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{h.judul}</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(h.dimasak_pada).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {h.pakai_pengganti ? ` · ${r.pengganti}` : ''} · {h.bintang ? r.dinilai(h.bintang) : r.belumDinilai}
                  </p>
                </div>
                {h.bisa_lagi
                  ? <Link to={`/resep/${h.recipe_id}`} className="shrink-0 rounded-xl bg-terakota px-3 py-2 text-sm font-medium text-white">{r.masakLagi}</Link>
                  : <span className="shrink-0 text-xs text-neutral-400">{r.tidakTersedia}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
