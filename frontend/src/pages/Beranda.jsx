import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import FotoResep from '../components/FotoResep'
import { IkonBintang, IkonCari, IkonFilter, IkonJam, IkonKalender, IkonPanah, IkonPanci, IkonPetir, IkonTunas } from '../components/Ikon'
import IklanTiruan from '../components/IklanTiruan'
import { Galat, Skeleton } from '../components/Kondisi'
import KartuResep from '../components/KartuResep'
import PantryKosong from '../components/PantryKosong'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { f } from '../copy/fitur'
import { angka } from '../lib/format'
import { tglWib } from '../lib/tampil'

// HP: rak geser dengan snap; laptop: grid. Kartu masuk bergantian sekali saat Beranda terbuka.
const RAK = 'tanpa-bar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 pt-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4'
const KARTU = 'w-[74%] max-w-72 shrink-0 snap-start animate-naik sm:w-64 lg:w-auto lg:max-w-none'
const BAYANGAN = 'shadow-[0_2px_12px_rgba(27,20,22,0.08)]'

const Rak = ({ daftar, mulai = 0 }) => (
  <div className={RAK}>
    {daftar.map((r, i) => <KartuResep key={r.id} resep={r} className={KARTU} style={{ animationDelay: `${(i + mulai) * 70}ms` }} />)}
  </div>
)

const Judul = ({ children, ke, label }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="font-judul text-xl font-bold">{children}</h2>
    {ke && <Link to={ke} className="-my-2 flex min-h-11 items-center gap-1 text-sm font-semibold text-sage-gelap">{label}<IkonPanah className="size-4" /></Link>}
  </div>
)

// Resep teratas: kartu besar berpusat pada foto (HP: tumpuk, laptop: foto kiri + teks kanan).
function Unggulan({ r }) {
  const k = t.kartu
  const pil = 'absolute bottom-3 inline-flex items-center gap-1 rounded-full bg-kartu/95 px-3 py-1.5 text-xs font-medium text-waktu shadow-sm'
  return (
    <Link to={`/resep/${r.id}`} className={`group block animate-naik overflow-hidden rounded-[2rem] bg-kartu transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(27,20,22,0.16)] active:scale-[0.99] lg:flex ${BAYANGAN}`}>
      <div className="relative overflow-hidden lg:w-1/2">
        <FotoResep resep={r} className="aspect-[4/3] transition duration-500 group-hover:scale-105 lg:aspect-auto lg:h-full lg:min-h-72" />
        <span className={`${pil} left-3`}><IkonJam className="size-4" />{k.mnt(r.total)}</span>
        {r.jumlah_ulasan > 0 && <span className={`${pil} right-3`}><IkonBintang className="size-4 text-terakota" />{angka(r.rating_rata)}</span>}
      </div>
      <div className="space-y-3 p-5 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:space-y-4 lg:p-10">
        <h3 className="font-judul text-2xl font-bold leading-tight lg:text-3xl">{r.judul}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-700">
          <span className="rounded-full bg-teks/5 px-3 py-1">{t.waktu[r.chip_waktu]}</span>
          <span className="rounded-full bg-teks/5 px-3 py-1">{t.kesulitan[r.kesulitan]}</span>
          {r.bahan_pantry_terpakai > 0 && <span className="rounded-full bg-siap px-3 py-1 font-medium text-sage-gelap">{k.pakai(r.bahan_pantry_terpakai)}</span>}
        </div>
        {r.jumlah_kurang_takaran > 0 && <p className="text-sm text-neutral-600">{k.porsiKecil}</p>}
        <span className="inline-flex items-center gap-2 rounded-full bg-terakota px-6 py-3 font-semibold text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-terakota)_30%,transparent)] transition">
          {f.beranda.masakSekarang}<IkonPanah className="size-5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

// Beranda tamu: penjelasan singkat + ajakan daftar + etalase resep (tanpa rekomendasi pantry).
function BerandaTamu() {
  const [resep, setResep] = useState(null)
  const s = t.tamu.beranda
  useEffect(() => { api('/publik/resep').then(setResep).catch(() => setResep([])) }, [])
  return (
    <div className="relative space-y-8 lg:space-y-12">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-80 bg-[radial-gradient(40%_75%_at_60%_0%,var(--color-emas),transparent)] opacity-50" />
      <section className="space-y-4 rounded-[2rem] bg-sage-gelap p-6 text-white lg:p-10">
        <h1 className="font-judul text-[2rem] font-bold leading-[1.1] lg:text-5xl">{s.judul}</h1>
        <p className="text-white/85">{s.isi}</p>
        <ol className="space-y-2">
          {s.langkah.map((l, i) => (
            <li key={l} className="flex items-center gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 font-semibold">{i + 1}</span>{l}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Link to="/daftar" className="rounded-full bg-emas px-6 py-3.5 text-center font-semibold text-teks transition active:scale-[0.98]">{t.tamu.daftar}</Link>
          <Link to="/masuk" className="rounded-full border border-white/40 px-6 py-3.5 text-center font-semibold transition active:scale-[0.98]">{t.tamu.masuk}</Link>
        </div>
      </section>
      <section className="space-y-3">
        <Judul ke="/jelajahi" label={s.semua}>{s.contoh}</Judul>
        {!resep && <Skeleton className="aspect-[4/3] rounded-3xl" />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resep?.slice(0, 8).map((r) => <KartuResep key={r.id} resep={r} />)}
        </div>
      </section>
    </div>
  )
}

export default function Beranda() {
  const { profil } = usePreferences()
  return profil.tamu ? <BerandaTamu /> : <BerandaMasuk />
}

function BerandaMasuk() {
  const { profil } = usePreferences()
  const { bukaMenu } = useOutletContext()
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

  const chip = `flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-kartu px-4 py-2.5 text-sm font-medium transition hover:bg-siap active:scale-95 shadow-[0_1px_6px_rgba(27,20,22,0.07)]`
  const [utama, ...lain] = data?.siap ?? []
  return (
    <div className="relative space-y-8 lg:space-y-12">
      {/* Cahaya hangat tipis di belakang kepala halaman. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-80 bg-[radial-gradient(40%_75%_at_60%_0%,var(--color-emas),transparent)] opacity-50" />

      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={bukaMenu} aria-label={f.menu.buka} className="flex min-w-0 items-center gap-3 text-left transition active:scale-95">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sage-gelap font-judul text-lg font-bold text-white" aria-hidden>{profil.nama.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0">
            <span className="block text-xs text-neutral-600">{b.sapaan(new Date().getHours())}</span>
            <span className="flex items-center gap-2">
              <span className="truncate font-judul text-lg font-semibold leading-tight">{b.hai(profil.nama)}</span>
              {profil.paket === 'plus' && <span className="rounded-full bg-emas px-2 py-0.5 text-xs font-semibold">{t.kartu.plus}</span>}
            </span>
          </span>
        </button>
        <Link to="/notifikasi" aria-label={belumDibaca ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi'} className={`relative flex size-12 shrink-0 items-center justify-center rounded-full bg-kartu transition active:scale-95 lg:hidden ${BAYANGAN}`}>
          {belumDibaca > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-terakota px-1 text-[11px] text-white">{belumDibaca}</span>}
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7z" /><path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
        </Link>
      </header>

      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="font-judul text-[2rem] font-bold leading-[1.1] lg:text-5xl">{f.beranda.judul}</h1>
          <p className="flex min-h-5 items-center gap-1.5 text-sm text-neutral-600">{data && <><IkonPanci className="size-4 text-sage-gelap" />{b.diPantry(data.jumlah_pantry)}</>}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/cari" className={`flex flex-1 items-center gap-3 rounded-full bg-kartu px-5 py-4 text-neutral-500 transition hover:shadow-[0_6px_20px_rgba(27,20,22,0.12)] ${BAYANGAN}`}>
            <IkonCari className="size-5 text-sage-gelap" />
            {b.cari}
          </Link>
          <Link to="/resep/siap" aria-label={f.beranda.filter} className="flex size-14 shrink-0 items-center justify-center rounded-full bg-sage-gelap text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-sage-gelap)_30%,transparent)] transition active:scale-95">
            <IkonFilter className="size-5" />
          </Link>
        </div>
        <div className="tanpa-bar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          <Link to="/resep/siap?waktu=kilat" className={chip}><IkonPetir className="size-4 text-terakota" />{b.chipKilat}</Link>
          <Link to="/resep/siap?alat=Rice%20cooker" className={chip}><IkonPanci className="size-4 text-sage-gelap" />{b.chipRiceCooker}</Link>
          <Link to="/resep/siap?kesulitan=mudah" className={chip}><IkonTunas className="size-4 text-sage-gelap" />{b.chipPemula}</Link>
        </div>
      </section>

      {galat && !data && <Galat apa="resepmu" kode="MATCH-503" onCoba={() => location.reload()} />}
      {!data && !galat && (
        <div role="status" className="space-y-3">
          <p className="text-sm text-neutral-600">{f.kondisi.memuat}</p>
          <Skeleton className="aspect-[4/3] rounded-[2rem] lg:aspect-[16/6]" />
        </div>
      )}

      {data?.jumlah_pantry === 0 ? (
        <PantryKosong />
      ) : (
        data && (
          <>
            {utama ? (
              <section className="space-y-3">
                <Judul ke="/resep/siap" label={b.lihatSemua(data.siap.length)}>{f.beranda.pilihan}</Judul>
                <Unggulan r={utama} />
              </section>
            ) : (
              <p className="rounded-3xl bg-kartu p-5 text-neutral-600">{b.siapKosong}</p>
            )}

            {lain.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-judul text-xl font-bold">{f.beranda.lainnya}</h2>
                <Rak daftar={lain.slice(0, 4)} mulai={1} />
              </section>
            )}

            {profil.tampilkan_kurang1 && data.kurang1.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-judul text-xl font-bold">{b.kurang1}</h2>
                <Rak daftar={data.kurang1.slice(0, 4)} />
              </section>
            )}
          </>
        )
      )}

      {workshop && (
        <Link to={`/workshop/${workshop.id}`} className="flex items-center gap-4 rounded-3xl bg-emas/60 p-4 transition active:scale-[0.99]">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-kartu text-terakota"><IkonKalender className="size-6" /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-judul text-base font-semibold">{workshop.judul}</span>
            <span className="block text-sm text-neutral-700">{tglWib(workshop.mulai, false)}</span>
          </span>
          <IkonPanah className="size-5 shrink-0 text-neutral-600" />
        </Link>
      )}

      {profil.paket !== 'plus' && <IklanTiruan />}

      <section className="relative space-y-2 overflow-hidden rounded-[2rem] bg-sage-gelap p-6 text-white lg:p-8">
        <span aria-hidden className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-12 right-10 size-28 rounded-full bg-sage/40" />
        <h2 className="relative font-judul text-xl font-bold">{b.bagikanJudul}</h2>
        <p className="relative max-w-md text-sm text-white/85">{b.bagikanIsi}</p>
        <Link to="/bagikan/info" className="relative mt-2 inline-flex items-center gap-2 rounded-full bg-kartu px-5 py-2.5 text-sm font-semibold text-sage-gelap transition active:scale-95">{b.bagikanTombol}<IkonPanah className="size-4" /></Link>
      </section>

      <div className="space-y-3">
        <Link to="/jelajahi" className="block py-3 text-center text-sm font-medium text-sage-gelap">{b.jelajahi}</Link>
        <Link to="/resep/siap" className="block rounded-full bg-terakota py-3.5 text-center font-semibold text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-terakota)_30%,transparent)] transition active:scale-[0.98]">{b.cariResep}</Link>
      </div>
    </div>
  )
}
