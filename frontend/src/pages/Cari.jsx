import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import FotoResep from '../components/FotoResep'
import { Field, Pesan } from '../components/Form'
import { Chip } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'

const KUNCI = 'masakada_pencarian_terakhir'
const baca = () => { try { return JSON.parse(localStorage.getItem(KUNCI)) ?? [] } catch { return [] } }
const tulis = (d) => { try { localStorage.setItem(KUNCI, JSON.stringify(d)) } catch { /* mode privat: abaikan */ } }

export default function Cari() {
  const [q, setQ] = useState('')
  const [mode, setMode] = useState('nama')
  const [hasil, setHasil] = useState(null)
  const [terakhir, setTerakhir] = useState(baca)
  const [galat, setGalat] = useState('')
  const c = t.cari
  const kata = q.trim()

  // Jeda 300 ms agar tidak memanggil server di tiap ketukan.
  useEffect(() => {
    if (!kata) { setHasil(null); return }
    const jeda = setTimeout(() => {
      api(`/resep/cari?q=${encodeURIComponent(kata)}&mode=${mode}`).then(setHasil).catch((e) => setGalat(e.message))
    }, 300)
    return () => clearTimeout(jeda)
  }, [kata, mode])

  const simpan = (e) => {
    e.preventDefault()
    if (!kata) return
    const baru = [kata, ...terakhir.filter((x) => x !== kata)].slice(0, 8)
    setTerakhir(baru)
    tulis(baru)
  }
  const hapus = () => { setTerakhir([]); tulis([]) }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/" />
        <h1 className="font-judul text-3xl font-bold">{c.judul}</h1>
      </div>
      <form onSubmit={simpan}>
        <Field label={c.placeholder} type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <div className="flex gap-2">
        <Chip aktif={mode === 'nama'} onClick={() => setMode('nama')}>{c.nama}</Chip>
        <Chip aktif={mode === 'bahan'} onClick={() => setMode('bahan')}>{c.bahan}</Chip>
      </div>
      <Pesan>{galat}</Pesan>

      {kata ? (
        hasil && (hasil.length ? (
          <ul className="space-y-2">
            {hasil.map((r) => (
              <li key={r.id}>
                <Link to={`/resep/${r.id}`} className="flex items-center gap-3 rounded-2xl bg-kartu p-2 pr-3">
                  <FotoResep resep={r} className="size-16 shrink-0 rounded-xl text-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.judul}</span>
                    <span className="text-sm text-neutral-500">{t.kartu.mnt(r.total)} · {t.waktu[r.chip_waktu]}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${r.label === 'siap' ? 'bg-siap text-sage-gelap' : 'bg-kurang text-terakota'}`}>
                    {r.label === 'siap' ? t.beranda.siap : t.kartu.kurangN(r.label)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-neutral-500">{c.kosong}</p>
        ))
      ) : (
        terakhir.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{c.terakhir}</h2>
              <button onClick={hapus} className="text-sm text-terakota">{c.hapus}</button>
            </div>
            <div className="flex flex-wrap gap-2">{terakhir.map((x) => <Chip key={x} onClick={() => setQ(x)}>{x}</Chip>)}</div>
          </section>
        )
      )}
    </div>
  )
}
