import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Galat, Memuat } from '../components/Kondisi'
import TombolKembali from '../components/TombolKembali'
import { f } from '../copy/fitur'
import { rupiah, tglWib } from '../lib/tampil'

// Daftar workshop (spesifikasi 8.10 #36), simulasi.
export default function Workshop() {
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)
  const w = f.workshop

  useEffect(() => { api('/workshop').then(setD).catch(setGalat) }, [])
  if (galat && !d) return <Galat apa="workshop" onCoba={() => location.reload()} />
  if (!d) return <Memuat n={2} />

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/" />
        <h1 className="min-w-0 flex-1 font-judul text-3xl font-bold">{w.judul}</h1>
        <Link to="/workshop/saya" className="shrink-0 text-sm text-sage-gelap">{w.tiketSaya}</Link>
      </div>
      <p className="text-neutral-600">{w.isi}</p>
      <span className="inline-block rounded-full bg-emas px-3 py-0.5 text-xs font-semibold">{w.demo}</span>
      {!d.plus && <Link to="/plus" className="block rounded-2xl bg-emas/60 p-4 text-sm"><strong>PLUS</strong> · {w.plusKartu}</Link>}

      {d.workshop.length === 0 && <p className="py-8 text-center text-neutral-500">{w.kosong}</p>}
      <ul className="space-y-3">
        {d.workshop.map((x) => (
          <li key={x.id}>
            <Link to={`/workshop/${x.id}`} className="block space-y-1 rounded-2xl bg-kartu p-4">
              <p className="text-xs text-neutral-500">{tglWib(x.mulai)}</p>
              <h2 className="font-judul text-xl font-bold">{x.judul}</h2>
              {x.tema && <p className="text-sm text-neutral-600">{x.tema}</p>}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
                <span className="rounded-full bg-sage-gelap px-3 py-0.5 text-white">{rupiah(x.harga)}</span>
                {d.plus && x.tiket.harga < x.harga && <span className="rounded-full bg-emas px-3 py-0.5 text-xs font-semibold">PLUS · {rupiah(x.tiket.harga)}</span>}
                <span className="text-neutral-500">{w.sisa(x.kursi_sisa)}</span>
                {x.terdaftar && <span className="rounded-full bg-siap px-3 py-0.5 text-xs text-sage-gelap">{w.terdaftar}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
