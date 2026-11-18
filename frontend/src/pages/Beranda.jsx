import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Pesan } from '../components/Form'
import KartuResep from '../components/KartuResep'
import PantryKosong from '../components/PantryKosong'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'

const GRID = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
const PRATINJAU = 3

export default function Beranda() {
  const { profil } = usePreferences()
  const [data, setData] = useState(null)
  const [galat, setGalat] = useState('')
  const b = t.beranda

  useEffect(() => {
    api('/resep/cocok').then(setData).catch((e) => setGalat(e.message))
  }, [])

  const chip = 'rounded-full border border-black/10 bg-kartu px-4 py-2 text-sm whitespace-nowrap'
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{b.sapaan(new Date().getHours())}</p>
          <div className="flex items-center gap-2">
            <h1 className="font-judul text-3xl font-bold">{b.hai(profil.nama)}</h1>
            {profil.paket === 'plus' && <span className="rounded-full bg-emas px-2 py-0.5 text-xs font-semibold">{t.kartu.plus}</span>}
          </div>
          {data && <p className="text-sm text-neutral-500">{b.diPantry(data.jumlah_pantry)}</p>}
        </div>
        <Link to="/notifikasi" aria-label="Notifikasi" className="flex size-11 items-center justify-center rounded-full bg-kartu shadow-sm">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7z" /><path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
        </Link>
      </header>

      <Link to="/cari" className="block rounded-xl border border-black/10 bg-white px-4 py-3 text-neutral-400">{b.cari}</Link>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link to="/resep/siap?waktu=kilat" className={chip}>{b.chipKilat}</Link>
        <Link to="/resep/siap?alat=Rice%20cooker" className={chip}>{b.chipRiceCooker}</Link>
        <Link to="/resep/siap?kesulitan=mudah" className={chip}>{b.chipPemula}</Link>
      </div>

      <Pesan>{galat}</Pesan>
      {!data && !galat && <p className="text-neutral-500">{b.memuat}</p>}

      {data?.jumlah_pantry === 0 ? (
        <PantryKosong />
      ) : (
        data && (
          <>
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-judul text-xl font-bold">{b.siap}</h2>
                {data.siap.length > 0 && <Link to="/resep/siap" className="text-sm text-sage-gelap">{b.lihatSemua(data.siap.length)}</Link>}
              </div>
              {data.siap.length ? (
                <div className={GRID}>{data.siap.slice(0, PRATINJAU).map((r) => <KartuResep key={r.id} resep={r} />)}</div>
              ) : (
                <p className="text-neutral-500">{b.siapKosong}</p>
              )}
            </section>

            {profil.tampilkan_kurang1 && data.kurang1.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-judul text-xl font-bold">{b.kurang1}</h2>
                <div className={GRID}>{data.kurang1.slice(0, PRATINJAU).map((r) => <KartuResep key={r.id} resep={r} />)}</div>
              </section>
            )}
          </>
        )
      )}

      <section className="space-y-2 rounded-2xl bg-sage-gelap p-5 text-white">
        <h2 className="font-judul text-xl font-bold">{b.bagikanJudul}</h2>
        <p className="text-sm text-white/85">{b.bagikanIsi}</p>
        <Link to="/bagikan/info" className="mt-2 inline-block rounded-xl bg-white px-4 py-2 text-sm font-medium text-sage-gelap">{b.bagikanTombol}</Link>
      </section>

      <div className="space-y-3">
        <Link to="/jelajahi" className="block text-center text-sm text-sage-gelap">{b.jelajahi}</Link>
        <Link to="/resep/siap" className="block rounded-xl bg-terakota py-3 text-center font-medium text-white">{b.cariResep}</Link>
      </div>
    </div>
  )
}
