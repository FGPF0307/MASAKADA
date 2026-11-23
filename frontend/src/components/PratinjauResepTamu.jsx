import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { t } from '../copy/id'
import { angka, takaran } from '../lib/format'
import FotoResep from './FotoResep'
import { IkonBintang, IkonJam, IkonKunci, IkonTutup } from './Ikon'
import Sheet from './Sheet'

// Halaman resep untuk tamu: isi resep tampil di belakang, tertutup popup ajakan masuk/daftar.
// Menutup popup (X, Esc, atau ketuk latar) kembali ke Beranda.
// Data kartu yang diklik (state.resep) langsung dipakai, lalu dilengkapi dari server.
export default function PratinjauResepTamu() {
  const { id } = useParams()
  const { state } = useLocation()
  const go = useNavigate()
  const [r, setR] = useState(state?.resep ?? null)
  const [popup, setPopup] = useState(false)
  const s = t.tamu.pratinjau
  const keBeranda = useCallback(() => go('/', { replace: true }), [go])

  useEffect(() => {
    api(`/publik/resep/${id}`).then((x) => setR((lama) => ({ ...lama, ...x }))).catch(() => {}) // gagal: tetap pakai data kartu
    const w = setTimeout(() => setPopup(true), 350) // biar halaman resep terlihat dulu
    return () => clearTimeout(w)
  }, [id])

  return (
    <div className="space-y-6" aria-hidden={popup}>
      {r ? (
        <div className="overflow-hidden rounded-[2rem]"><FotoResep resep={r} className="aspect-[4/3] lg:aspect-[16/6]" /></div>
      ) : (
        <div className="aspect-[4/3] animate-pulse rounded-[2rem] bg-teks/5 lg:aspect-[16/6]" />
      )}

      <header className="space-y-2">
        {r ? <h1 className="font-judul text-3xl font-bold leading-tight">{r.judul}</h1> : <div className="h-8 w-2/3 animate-pulse rounded-full bg-teks/10" />}
        {r && (
          <p className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1"><IkonJam className="size-4" />{t.kartu.mnt(r.total)}</span>
            {r.kesulitan && <span>{t.kesulitan[r.kesulitan]}</span>}
            {r.jumlah_ulasan > 0 && <span className="inline-flex items-center gap-1"><IkonBintang className="size-4 text-terakota" />{angka(r.rating_rata)}</span>}
            {r.penulis && <span>{s.oleh(r.penulis)}</span>}
          </p>
        )}
        {r?.deskripsi && <p className="text-neutral-700">{r.deskripsi}</p>}
      </header>

      <section className="space-y-3 rounded-3xl bg-kartu p-5">
        <h2 className="font-judul text-xl font-bold">{s.bahan}</h2>
        {r?.bahan ? (
          <ul className="divide-y divide-teks/5">
            {r.bahan.map((b) => (
              <li key={b.nama} className="flex justify-between gap-3 py-2">
                <span className="font-medium">{b.nama}{b.peran === 'opsional' && <span className="text-neutral-500"> {s.opsional}</span>}</span>
                <span className="text-neutral-500">{takaran(b.jumlah, b.satuan)}</span>
              </li>
            ))}
          </ul>
        ) : <Bayangan />}
      </section>

      <section className="space-y-3 rounded-3xl bg-kartu p-5">
        <h2 className="font-judul text-xl font-bold">{s.langkah}</h2>
        {r?.langkah ? (
          <ol className="space-y-3">
            {r.langkah.map((l) => (
              <li key={l.urutan} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-siap font-semibold text-sage-gelap">{l.urutan}</span>
                <p className="pt-1">{l.instruksi}</p>
              </li>
            ))}
          </ol>
        ) : <Bayangan />}
      </section>

      {popup && (
        <Sheet judul={s.judul} onTutup={keBeranda}>
          <div className="flex justify-end">
            <button type="button" autoFocus onClick={keBeranda} aria-label={s.tutup} className="-m-1 flex size-10 items-center justify-center rounded-full bg-teks/5 transition active:scale-90"><IkonTutup className="size-5" /></button>
          </div>
          <div className="space-y-3 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-siap text-sage-gelap"><IkonKunci className="size-6" /></span>
            <h2 className="font-judul text-2xl font-bold">{s.judul}</h2>
            <p className="text-neutral-600">{s.isi}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/daftar" state={{ dari: `/resep/${id}` }} className="rounded-full bg-sage-gelap py-3.5 text-center font-semibold text-white transition active:scale-[0.98]">{t.tamu.daftar}</Link>
            <Link to="/masuk" state={{ dari: `/resep/${id}` }} className="rounded-full border border-teks/15 py-3.5 text-center font-semibold transition active:scale-[0.98]">{t.tamu.masuk}</Link>
          </div>
        </Sheet>
      )}
    </div>
  )
}

// Garis abu-abu selagi isi resep dimuat.
const Bayangan = () => (
  <div className="space-y-2">
    {[90, 75, 82, 60].map((w) => <div key={w} className="h-4 animate-pulse rounded-full bg-teks/10" style={{ width: `${w}%` }} />)}
  </div>
)
