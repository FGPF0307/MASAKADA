import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Pesan } from '../components/Form'
import KartuResep from '../components/KartuResep'
import { Chip } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'

export default function Jelajahi() {
  const [kategori, setKategori] = useState(null)
  const [daftar, setDaftar] = useState(null)
  const [galat, setGalat] = useState('')
  const j = t.jelajahi

  useEffect(() => {
    setDaftar(null)
    api(`/resep/jelajahi${kategori ? `?kategori=${encodeURIComponent(kategori)}` : ''}`).then(setDaftar).catch((e) => setGalat(e.message))
  }, [kategori])

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <TombolKembali ke="/" />
          <h1 className="font-judul text-3xl font-bold">{j.judul}</h1>
        </div>
        <p className="text-sm text-neutral-600">{j.isi}</p>
      </header>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip aktif={!kategori} onClick={() => setKategori(null)} className="shrink-0">{j.semua}</Chip>
        {j.kategori.map((k) => <Chip key={k} aktif={kategori === k} onClick={() => setKategori(k)} className="shrink-0">{k}</Chip>)}
      </div>
      <Pesan>{galat}</Pesan>
      {!daftar && !galat && <p className="text-neutral-500">{t.halaman.memuat}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {daftar?.map((r) => <KartuResep key={r.id} resep={r} label={r.label} />)}
      </div>
    </div>
  )
}
