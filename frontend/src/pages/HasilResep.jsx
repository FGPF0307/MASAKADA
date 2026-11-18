import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import FilterSheet from '../components/FilterSheet'
import { Pesan } from '../components/Form'
import KartuResep from '../components/KartuResep'
import PantryKosong from '../components/PantryKosong'
import TombolKembali from '../components/TombolKembali'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { chipAktif, dariParams, keParams } from '../lib/filter'

const GRID = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
const LABEL = { waktu: (w) => t.waktu[w], kesulitan: (k) => t.kesulitan[k], porsi: t.hasil.porsi, alatLain: t.hasil.alatLain }

export default function HasilResep() {
  const { profil } = usePreferences()
  const [sp, setSp] = useSearchParams()
  const [data, setData] = useState(null)
  const [galat, setGalat] = useState('')
  const [sheet, setSheet] = useState(false)
  const kurang1Ref = useRef(null)
  const h = t.hasil
  const filter = dariParams(sp)
  const kunci = sp.toString()

  useEffect(() => {
    setData(null)
    api(`/resep/cocok?${kunci}`).then(setData).catch((e) => setGalat(e.message))
  }, [kunci])

  const terapkan = (f) => { setSp(keParams(f)); setSheet(false) }
  const chip = chipAktif(filter, LABEL)
  const tampilKurang1 = profil.tampilkan_kurang1 && data?.kurang1.length > 0

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TombolKembali ke="/" />
          <h1 className="font-judul text-3xl font-bold">{h.judul}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/cari" aria-label="Cari" className="flex size-11 items-center justify-center rounded-full bg-kartu shadow-sm">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </Link>
          <button onClick={() => setSheet(true)} aria-label={h.ubahFilter} className="relative flex size-11 items-center justify-center rounded-full bg-kartu shadow-sm">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            {chip.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-terakota text-[11px] text-white">{chip.length}</span>}
          </button>
        </div>
      </header>

      {chip.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chip.map((c) => (
            <button key={c.kunci} onClick={() => terapkan(c.hapus)} aria-label={`${h.hapusFilter}: ${c.teks}`} className="rounded-full bg-sage-gelap px-3 py-1 text-sm text-white">
              {c.teks} ✕
            </button>
          ))}
        </div>
      )}

      <Pesan>{galat}</Pesan>
      {!data && !galat && <p className="text-neutral-500">{t.beranda.memuat}</p>}

      {data?.jumlah_pantry === 0 && <PantryKosong />}

      {data && data.jumlah_pantry > 0 && (
        <>
          <p className="text-sm text-neutral-600">{h.ringkas(data.siap.length, t.urut[filter.urut])}</p>

          {data.siap.length ? (
            <div className={GRID}>{data.siap.map((r) => <KartuResep key={r.id} resep={r} />)}</div>
          ) : (
            <div className="space-y-3 rounded-2xl bg-kartu p-5">
              <h2 className="font-judul text-xl font-bold">{h.kosongJudul}</h2>
              <p className="text-neutral-600">{h.kosongIsi}</p>
              <ul className="space-y-2 text-sage-gelap">
                {chip.length > 0 && <li><button onClick={() => setSp({})}>{h.longgarkan}</button></li>}
                {tampilKurang1 && <li><button onClick={() => kurang1Ref.current?.scrollIntoView({ behavior: 'smooth' })}>{h.lihatKurang1(data.kurang1.length)}</button></li>}
                <li><Link to="/pantry/tambah">{h.tambah}</Link></li>
                <li><Link to="/jelajahi">{h.jelajahi}</Link></li>
              </ul>
            </div>
          )}

          {tampilKurang1 && (
            <section ref={kurang1Ref} className="space-y-3 pt-4">
              <h2 className="font-judul text-xl font-bold">{t.beranda.kurang1}</h2>
              <p className="text-sm text-neutral-600">{h.kurang1Isi}</p>
              <div className={GRID}>{data.kurang1.map((r) => <KartuResep key={r.id} resep={r} />)}</div>
            </section>
          )}
        </>
      )}

      {sheet && <FilterSheet awal={filter} onTerapkan={terapkan} onTutup={() => setSheet(false)} />}
    </div>
  )
}
