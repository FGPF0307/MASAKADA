import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Galat, Memuat } from '../components/Kondisi'
import TombolKembali from '../components/TombolKembali'
import { f } from '../copy/fitur'
import { tglWib } from '../lib/tampil'

// Workshop saya (spesifikasi 8.10 #39): tiket mendatang dan yang sudah selesai.
export default function WorkshopSaya() {
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)
  const w = f.workshop

  useEffect(() => { api('/workshop/saya').then(setD).catch(setGalat) }, [])
  if (galat && !d) return <Galat apa="tiketmu" onCoba={() => location.reload()} />
  if (!d) return <Memuat n={1} />

  const kosong = !d.akan_datang.length && !d.selesai.length
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/workshop" />
        <h1 className="font-judul text-3xl font-bold">{w.sayaJudul}</h1>
      </div>
      {kosong && (
        <div className="space-y-3 py-8 text-center">
          <p className="text-neutral-500">{w.kosongSaya}</p>
          <Link to="/workshop" className="inline-block rounded-xl bg-terakota px-5 py-3 font-medium text-white">{w.lihatSemua}</Link>
        </div>
      )}

      {d.akan_datang.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-judul text-xl font-bold">{w.akanDatang}</h2>
          <ul className="space-y-3">
            {d.akan_datang.map((x) => (
              <li key={x.id} className="space-y-2 rounded-2xl bg-kartu p-4">
                <p className="text-xs text-neutral-500">{tglWib(x.mulai)}</p>
                <Link to={`/workshop/${x.id}`} className="block font-judul text-xl font-bold">{x.judul}</Link>
                <p className="text-sm text-neutral-600">{w.kodeTiket}: <strong>{x.kode_tiket}</strong></p>
                {x.pantry && <p className="text-sm text-neutral-600">{w.bahanAda(x.pantry.ada, x.pantry.total)}</p>}
                {x.bisa_gabung
                  ? <a href={x.tautan_zoom} target="_blank" rel="noreferrer" className="block rounded-xl bg-terakota py-3 text-center font-medium text-white">{w.gabung}</a>
                  : <p className="rounded-xl bg-teks/5 py-3 text-center text-sm text-neutral-500">{w.dibuka}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {d.selesai.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-judul text-xl font-bold">{w.sudahSelesai}</h2>
          <ul className="space-y-3">
            {d.selesai.map((x) => (
              <li key={x.id} className="space-y-2 rounded-2xl bg-kartu p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{x.judul}</p>
                  {x.lulus && <span className="rounded-full bg-siap px-3 py-0.5 text-xs text-sage-gelap">{w.lulus}</span>}
                </div>
                <p className="text-xs text-neutral-500">{tglWib(x.mulai)}</p>
                <p className="text-sm text-neutral-500">{w.rekaman} · {w.sertifikat}</p>
              </li>
            ))}
          </ul>
          <Link to="/bagikan/info" className="block text-sm text-sage-gelap">{w.unggah}</Link>
        </section>
      )}
    </div>
  )
}
