import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Pesan } from '../components/Form'
import { IkonBintang, IkonKunci } from '../components/Ikon'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'

export default function Pencapaian() {
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState('')
  const p = t.pencapaian

  useEffect(() => {
    api('/pencapaian').then(setD).catch((e) => setGalat(e.message))
  }, [])

  if (galat && !d) return <div className="max-w-md space-y-3"><TombolKembali ke="/profil" /><Pesan>{galat}</Pesan></div>
  if (!d) return <p className="text-neutral-500">{t.halaman.memuat}</p>

  const awal = d.level.ambang
  const akhir = d.berikutnya?.ambang
  const persen = akhir ? Math.min(100, ((d.poin - awal) / (akhir - awal)) * 100) : 100
  const didapat = d.lencana.filter((b) => b.didapat).length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/profil" />
        <h1 className="font-judul text-3xl font-bold">{p.judul}</h1>
      </div>

      <section className="space-y-3 rounded-2xl bg-sage-gelap p-5 text-white">
        <p className="font-judul text-xl font-bold">{p.level(d.level.nomor, d.semua_level.length, d.level.nama, d.poin)}</p>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={Math.round(persen)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-emas transition-all" style={{ width: `${persen}%` }} />
        </div>
        <p className="text-sm text-white/90">{d.berikutnya ? p.keBerikut(d.poin_ke_berikutnya, d.berikutnya.nama) : p.levelTertinggi}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-judul text-xl font-bold">{p.semuaLevel}</h2>
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {d.semua_level.map((l) => {
            const capai = d.poin >= l.ambang
            return (
              <li key={l.nomor} className={`w-36 shrink-0 space-y-1 rounded-2xl p-3 ${capai ? 'bg-siap text-sage-gelap' : 'bg-kartu text-neutral-500'}`}>
                <p className="text-xs">Level {l.nomor}</p>
                <p className="font-medium">{l.nama}</p>
                <p className="text-xs">{l.ambang} poin</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-judul text-xl font-bold">{p.lencana}</h2>
          <span className="text-sm text-neutral-500">{p.didapat(didapat, d.lencana.length)}</span>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {d.lencana.map((b) => (
            <li key={b.kode} className={`space-y-2 rounded-2xl p-4 text-center ${b.didapat ? 'bg-emas/60' : 'bg-kartu'}`}>
              <div className={`mx-auto flex size-14 items-center justify-center rounded-full text-2xl ${b.didapat ? 'bg-terakota text-white' : 'bg-teks/10 text-neutral-400'}`} aria-hidden>{b.didapat ? <IkonBintang className="size-7" /> : <IkonKunci className="size-6" />}</div>
              <p className={`font-medium ${b.didapat ? '' : 'text-neutral-500'}`}>{b.nama}</p>
              <p className="text-xs text-neutral-600">{b.deskripsi}</p>
              {!b.didapat && <p className="text-xs font-medium text-neutral-500">{b.progres} / {b.target}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-2xl bg-kartu p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-judul text-xl font-bold">{p.caraJudul}</h2>
          <Link to="/pencapaian/riwayat" className="text-sm text-sage-gelap">{p.riwayat}</Link>
        </div>
        <ul className="space-y-2 text-sm">
          {p.cara.map(([aksi, poin]) => <li key={aksi} className="flex justify-between gap-3"><span>{aksi}</span><span className="shrink-0 font-medium text-sage-gelap">{poin}</span></li>)}
        </ul>
        <p className="text-xs text-neutral-500">{p.aturan}</p>
      </section>
    </div>
  )
}
