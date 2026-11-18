import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { t } from '../copy/id'
import { takaran } from '../lib/format'

// Toko mitra (simulasi): hanya untuk bahan yang kurang atau habis. Tidak ada pesanan sungguhan.
export default function SheetTokoMitra({ bahan, onTutup }) {
  const [mitra, setMitra] = useState([])
  const [info, setInfo] = useState('')
  const m = t.mitra

  useEffect(() => {
    api('/mitra').then(setMitra).catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center" onClick={onTutup}>
      <div
        role="dialog"
        aria-label={m.judul}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-3xl bg-kartu p-5 lg:max-w-md lg:rounded-2xl"
      >
        <span className="inline-block rounded-full bg-emas px-3 py-0.5 text-xs font-semibold">{m.demo}</span>
        <h2 className="font-judul text-xl font-bold">{m.judul}</h2>

        <ul className="space-y-1">
          {bahan.map((b) => (
            <li key={b.id} className="rounded-xl bg-kurang px-4 py-2 text-sm">
              <span className="font-medium">{b.nama}</span> — {m.butuh(takaran(b.butuh, b.satuan))}
            </li>
          ))}
        </ul>

        <ul className="space-y-2">
          {mitra.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
              <span>
                <span className="block font-medium">{x.nama}</span>
                <span className="block text-sm text-neutral-500">{x.keterangan}</span>
              </span>
              <button onClick={() => setInfo(m.demoInfo)} className="shrink-0 rounded-lg bg-sage-gelap px-3 py-2 text-sm text-white">{m.bukaToko}</button>
            </li>
          ))}
        </ul>

        {info && <p role="status" className="rounded-xl bg-siap px-4 py-2 text-sm text-sage-gelap">{info}</p>}
        <p className="text-sm text-neutral-500">{m.catatan}</p>
        <Link to="/plus" className="block text-center text-sm text-sage-gelap">{m.pakaiPengganti}</Link>
        <button className="w-full py-2 text-neutral-500" onClick={onTutup}>{m.tutup}</button>
      </div>
    </div>
  )
}
