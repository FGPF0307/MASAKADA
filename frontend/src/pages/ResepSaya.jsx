import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import FotoResep from '../components/FotoResep'
import { Pesan } from '../components/Form'
import { Chip } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'
import { waktuLalu } from '../lib/format'

const WARNA = { draf: 'bg-black/5', ditinjau: 'bg-emas', terbit: 'bg-siap text-sage-gelap', ditolak: 'bg-kurang text-terakota' }

export default function ResepSaya() {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('draf')
  const [galat, setGalat] = useState('')
  const s = t.resepSaya

  useEffect(() => {
    api('/resep-saya').then(setData).catch((e) => setGalat(e.message))
  }, [])

  const tampil = data?.daftar.filter((r) => r.status === tab)
  const tujuan = (r) => (r.status === 'draf' ? `/bagikan/info?d=${r.id}` : `/resep-saya/${r.id}`)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/profil" />
        <h1 className="font-judul text-3xl font-bold">{s.judul}</h1>
      </div>
      <Pesan>{galat}</Pesan>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(s.tab).map(([k, label]) => <Chip key={k} aktif={tab === k} onClick={() => setTab(k)} className="shrink-0">{label} ({data?.jumlah[k] ?? 0})</Chip>)}
      </div>
      {tampil?.length === 0 && <p className="py-6 text-center text-neutral-500">{s.kosong}</p>}
      <ul className="space-y-3">
        {tampil?.map((r) => (
          <li key={r.id}>
            <Link to={tujuan(r)} className="flex items-center gap-3 rounded-2xl bg-kartu p-2 pr-3">
              <FotoResep resep={{ foto_url: r.foto_url, judul: r.judul || '?' }} className="size-16 shrink-0 rounded-xl text-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.judul || s.tanpaJudul}</span>
                <span className="text-sm text-neutral-500">{s.langkah(r.jumlah_langkah)} · {s.diubah(waktuLalu(r.diubah_pada))}</span>
              </span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${WARNA[r.status]}`}>{s.tab[r.status]}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/bagikan/info" className="block rounded-xl bg-terakota py-3 text-center font-medium text-white">{s.buat}</Link>
    </div>
  )
}
