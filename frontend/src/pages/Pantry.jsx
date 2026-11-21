import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IkonKamera } from '../components/Ikon'
import { api } from '../api/client'
import AvatarBahan from '../components/AvatarBahan'
import { Pesan } from '../components/Form'
import PantryKosong from '../components/PantryKosong'
import { Chip } from '../components/Pilihan'
import { takaran } from '../lib/format'
import { t } from '../copy/id'
import { f } from '../copy/fitur'

const TAB = [['semua', t.pantry.semua], ...Object.entries(t.tempat)]

export default function Pantry() {
  const [items, setItems] = useState(null)
  const [tab, setTab] = useState('semua')
  const [galat, setGalat] = useState('')
  const s = t.pantry

  useEffect(() => {
    const muat = () => api('/pantry').then(setItems).catch((e) => setGalat(e.message))
    muat()
    window.addEventListener('pantry-berubah', muat) // mis. setelah "Urungkan" hapus bahan
    return () => window.removeEventListener('pantry-berubah', muat)
  }, [])

  const tampil = items?.filter((i) => tab === 'semua' || i.tempat === tab)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-judul text-3xl font-bold">{s.judul}</h1>
          {items && <p className="text-sm text-neutral-500">{s.jumlahBahan(items.length)}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/scan" aria-label={f.scan.judul} className="flex size-11 items-center justify-center rounded-full bg-kartu text-sage-gelap shadow-[0_1px_6px_rgba(59,42,30,0.1)] transition active:scale-95"><IkonKamera className="size-6" /></Link>
          <Link to="/pantry/tambah" aria-label={t.plus.tambahBahan} className="flex size-11 items-center justify-center rounded-full bg-terakota text-2xl text-white shadow">+</Link>
        </div>
      </header>

      <Pesan>{galat}</Pesan>

      {items?.length === 0 ? (
        <PantryKosong />
      ) : (
        <>
          <div className="tanpa-bar flex gap-2 overflow-x-auto pb-1">
            {TAB.map(([k, label]) => <Chip key={k} aktif={tab === k} onClick={() => setTab(k)} className="shrink-0">{label}</Chip>)}
          </div>
          {tampil?.length === 0 && <p className="py-6 text-center text-neutral-500">{s.kosongTab}</p>}
          <ul className="grid gap-3 md:grid-cols-2">
            {tampil?.map((i) => (
              <li key={i.id}>
                <Link to={`/pantry/${i.id}`} className="flex items-center gap-3 rounded-2xl bg-kartu p-3 shadow-[0_1px_6px_rgba(59,42,30,0.06)] transition active:scale-[0.99]">
                  <AvatarBahan nama={i.nama} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{i.nama}</span>
                    <span className="block text-sm text-neutral-500">{takaran(i.jumlah, i.satuan)} · {t.tempat[i.tempat]}</span>
                  </span>
                  {i.belum_baku && <span className="shrink-0 rounded-full bg-emas px-2 py-0.5 text-xs">{s.tambah.menunggu}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
