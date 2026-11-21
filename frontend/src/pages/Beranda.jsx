import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { IkonCari, IkonKalender, IkonPanci, IkonPetir, IkonTunas } from '../components/Ikon'
import IklanTiruan from '../components/IklanTiruan'
import { Galat, Memuat } from '../components/Kondisi'
import KartuResep from '../components/KartuResep'
import PantryKosong from '../components/PantryKosong'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { f } from '../copy/fitur'
import { tglWib } from '../lib/tampil'

// HP: rak geser dengan snap; laptop: grid. Kartu masuk bergantian sekali saat Beranda terbuka.
const RAK = 'tanpa-bar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4'
const KARTU = 'w-[74%] max-w-72 shrink-0 snap-start animate-naik sm:w-64 lg:w-auto lg:max-w-none'
const PRATINJAU = 4

const Rak = ({ daftar }) => (
  <div className={RAK}>
    {daftar.slice(0, PRATINJAU).map((r, i) => <KartuResep key={r.id} resep={r} className={KARTU} style={{ animationDelay: `${i * 70}ms` }} />)}
  </div>
)

export default function Beranda() {
  const { profil } = usePreferences()
  const [data, setData] = useState(null)
  const [galat, setGalat] = useState('')
  const b = t.beranda

  const [belumDibaca, setBelumDibaca] = useState(0)
  const [workshop, setWorkshop] = useState(null)

  useEffect(() => {
    api('/resep/cocok').then(setData).catch((e) => setGalat(e.message))
    api('/notifikasi').then((d) => setBelumDibaca(d.belum_dibaca)).catch(() => {}) // lencana saja; galat tidak menghalangi Beranda
    api('/workshop').then((d) => setWorkshop(d.workshop[0] ?? null)).catch(() => {}) // banner saja
  }, [])

  const chip = 'flex shrink-0 items-center gap-2 rounded-full bg-kartu px-4 py-2.5 text-sm font-medium shadow-[0_1px_6px_rgba(59,42,30,0.07)] transition hover:bg-siap active:scale-95'
  return (
    <div className="space-y-7">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-neutral-600">{b.sapaan(new Date().getHours())}</p>
          <div className="flex items-center gap-2">
            <h1 className="font-judul text-3xl font-bold leading-tight lg:text-4xl">{b.hai(profil.nama)}</h1>
            {profil.paket === 'plus' && <span className="rounded-full bg-emas px-2 py-0.5 text-xs font-semibold">{t.kartu.plus}</span>}
          </div>
          {data && <p className="text-sm text-neutral-600">{b.diPantry(data.jumlah_pantry)}</p>}
        </div>
        <Link to="/notifikasi" aria-label={belumDibaca ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi'} className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-kartu shadow-[0_1px_6px_rgba(59,42,30,0.1)] transition active:scale-95">
          {belumDibaca > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-terakota px-1 text-[11px] text-white">{belumDibaca}</span>}
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7z" /><path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
        </Link>
      </header>

      <Link to="/cari" className="flex items-center gap-3 rounded-full bg-kartu px-5 py-4 text-neutral-500 shadow-[0_2px_12px_rgba(59,42,30,0.08)] transition hover:shadow-[0_6px_20px_rgba(59,42,30,0.12)]">
        <IkonCari className="size-5 text-sage-gelap" />
        {b.cari}
      </Link>

      <div className="tanpa-bar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        <Link to="/resep/siap?waktu=kilat" className={chip}><IkonPetir className="size-4 text-terakota" />{b.chipKilat}</Link>
        <Link to="/resep/siap?alat=Rice%20cooker" className={chip}><IkonPanci className="size-4 text-sage-gelap" />{b.chipRiceCooker}</Link>
        <Link to="/resep/siap?kesulitan=mudah" className={chip}><IkonTunas className="size-4 text-sage-gelap" />{b.chipPemula}</Link>
      </div>

      {galat && !data && <Galat apa="resepmu" kode="MATCH-503" onCoba={() => location.reload()} />}
      {!data && !galat && <Memuat pesan={f.kondisi.memuat} />}

      {data?.jumlah_pantry === 0 ? (
        <PantryKosong />
      ) : (
        data && (
          <>
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-judul text-xl font-bold">{b.siap}</h2>
                {data.siap.length > 0 && <Link to="/resep/siap" className="text-sm font-medium text-sage-gelap">{b.lihatSemua(data.siap.length)}</Link>}
              </div>
              {data.siap.length ? <Rak daftar={data.siap} /> : <p className="text-neutral-600">{b.siapKosong}</p>}
            </section>

            {profil.tampilkan_kurang1 && data.kurang1.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-judul text-xl font-bold">{b.kurang1}</h2>
                <Rak daftar={data.kurang1} />
              </section>
            )}
          </>
        )
      )}

      {workshop && (
        <Link to={`/workshop/${workshop.id}`} className="flex items-center gap-4 rounded-3xl bg-emas/60 p-4 transition active:scale-[0.99]">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-kartu text-terakota"><IkonKalender className="size-6" /></span>
          <span className="min-w-0">
            <span className="block truncate font-judul text-base font-semibold">{workshop.judul}</span>
            <span className="block text-sm text-neutral-700">{tglWib(workshop.mulai, false)}</span>
          </span>
        </Link>
      )}

      {profil.paket !== 'plus' && <IklanTiruan />}

      <section className="space-y-2 rounded-3xl bg-sage-gelap p-6 text-white">
        <h2 className="font-judul text-xl font-bold">{b.bagikanJudul}</h2>
        <p className="text-sm text-white/85">{b.bagikanIsi}</p>
        <Link to="/bagikan/info" className="mt-2 inline-block rounded-full bg-kartu px-5 py-2.5 text-sm font-semibold text-sage-gelap transition active:scale-95">{b.bagikanTombol}</Link>
      </section>

      <div className="space-y-3">
        <Link to="/jelajahi" className="block text-center text-sm font-medium text-sage-gelap">{b.jelajahi}</Link>
        <Link to="/resep/siap" className="block rounded-full bg-terakota py-3.5 text-center font-semibold text-white shadow-[0_6px_16px_rgba(185,85,58,0.28)] transition active:scale-[0.98]">{b.cariResep}</Link>
      </div>
    </div>
  )
}
