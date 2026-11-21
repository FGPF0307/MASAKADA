import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { Galat, Memuat } from '../components/Kondisi'
import TombolKembali from '../components/TombolKembali'
import { f } from '../copy/fitur'
import { takaran } from '../lib/format'
import { rupiah, tglWib } from '../lib/tampil'

// Detail workshop (spesifikasi 8.10 #37): jadwal, cek pantry, harga, daftar.
export default function WorkshopDetail() {
  const { id } = useParams()
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)
  const w = f.workshop

  useEffect(() => { api(`/workshop/${id}`).then(setD).catch(setGalat) }, [id])
  if (galat && !d) return <Galat apa="workshop ini" onCoba={() => location.reload()} />
  if (!d) return <Memuat n={1} />

  const gaya = { pokok: 'bg-siap text-sage-gelap', ada: 'bg-siap text-sage-gelap', kurang_jumlah: 'bg-emas', tidak_ada: 'bg-kurang text-terakota' }
  return (
    <article className="mx-auto max-w-2xl space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/workshop" />
        <span className="rounded-full bg-terakota px-3 py-1 text-xs font-semibold text-white">{w.live}</span>
      </div>
      <header className="space-y-1">
        <h1 className="font-judul text-3xl font-bold">{d.judul}</h1>
        <p className="text-neutral-600">{tglWib(d.mulai)} · {d.durasi_menit} mnt</p>
        {d.pengisi && <p className="text-sm text-neutral-500">{w.pengisi(d.pengisi)}</p>}
      </header>
      {d.deskripsi && <p className="text-neutral-700">{d.deskripsi}</p>}
      <p className="rounded-xl bg-kartu px-4 py-3 text-sm">{w.zoomInfo}</p>

      <section className="space-y-2">
        <h2 className="font-judul text-xl font-bold">{w.cekPantry(d.pantry.ada, d.pantry.total)}</h2>
        <ul className="space-y-2">
          {d.pantry.bahan.map((b) => (
            <li key={b.nama} className="flex items-center justify-between gap-3 rounded-xl bg-kartu p-3">
              <span><span className="font-medium">{b.nama}</span> <span className="text-neutral-500">{takaran(b.butuh, b.satuan)}</span></span>
              <span className={`rounded-full px-3 py-1 text-xs ${gaya[b.status]}`}>{w.status[b.status]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-2xl bg-kartu p-4">
        <p className="text-sm text-neutral-500">{w.tiket}</p>
        <p className="font-judul text-2xl font-bold">{rupiah(d.tiket.harga)}{d.tiket.harga < d.harga && <span className="ml-2 text-base font-normal text-neutral-400 line-through">{rupiah(d.harga)}</span>}</p>
        {!d.plus && d.harga > 0 && <Link to="/plus" className="text-sm text-sage-gelap">{w.gratisPlus}</Link>}
      </section>

      {d.terdaftar ? (
        <p className="rounded-xl bg-siap px-4 py-3 text-center font-medium text-sage-gelap">{w.sudahDaftar(d.kode_tiket)}</p>
      ) : d.selesai ? (
        <p className="text-center text-neutral-500">{w.selesai}</p>
      ) : d.kursi_sisa === 0 ? (
        <p className="text-center text-neutral-500">{w.penuh}</p>
      ) : (
        <Link to={`/workshop/${d.id}/daftar`} className="block rounded-xl bg-terakota py-3 text-center font-medium text-white">{w.daftar}</Link>
      )}
    </article>
  )
}
