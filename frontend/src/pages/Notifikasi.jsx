import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Pesan } from '../components/Form'
import { IkonBintang, IkonCentang, IkonLonceng, IkonPensil } from '../components/Ikon'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'
import { waktuLalu } from '../lib/format'

const IKON = { resep_terbit: IkonCentang, resep_ditolak: IkonPensil, lencana_baru: IkonBintang, bahan_disetujui: IkonCentang }

export default function Notifikasi() {
  const go = useNavigate()
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState('')
  const n = t.notifikasi

  useEffect(() => {
    api('/notifikasi').then(setD).catch((e) => setGalat(e.message))
  }, [])

  const bacaSemua = async () => {
    try {
      await api('/notifikasi/baca-semua', { method: 'POST' })
      setD((x) => ({ belum_dibaca: 0, daftar: x.daftar.map((i) => ({ ...i, dibaca: true })) }))
    } catch (e) { setGalat(e.message) }
  }
  const buka = (i) => {
    if (!i.dibaca) api(`/notifikasi/${i.id}/baca`, { method: 'POST' }).catch(() => {}) // gagal menandai tidak menghalangi navigasi
    if (i.tautan) go(i.tautan)
    else setD((x) => ({ ...x, daftar: x.daftar.map((y) => (y.id === i.id ? { ...y, dibaca: true } : y)) }))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/" />
        <h1 className="min-w-0 flex-1 font-judul text-3xl font-bold">{n.judul}</h1>
        {d?.belum_dibaca > 0 && <button onClick={bacaSemua} className="shrink-0 text-sm text-sage-gelap">{n.tandaiSemua}</button>}
      </div>
      <Pesan>{galat}</Pesan>
      {!d && !galat && <p className="text-neutral-500">{t.halaman.memuat}</p>}
      {d?.daftar.length === 0 && <p className="py-6 text-center text-neutral-500">{n.kosong}</p>}
      <ul className="space-y-2">
        {d?.daftar.map((i) => (
          <li key={i.id}>
            <button onClick={() => buka(i)} className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left ${i.dibaca ? 'bg-kartu' : 'bg-siap'}`}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-kartu text-sage-gelap" aria-hidden>{(() => { const Ikon = IKON[i.jenis] ?? IkonLonceng; return <Ikon className="size-5" /> })()}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">{i.judul}{!i.dibaca && <span className="size-2 rounded-full bg-terakota" aria-label="Belum dibaca" />}</span>
                {i.isi && <span className="block text-sm text-neutral-600">{i.isi}</span>}
                <span className="block text-xs text-neutral-500">{waktuLalu(i.dibuat_pada)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
