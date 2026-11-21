import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Galat, Memuat } from '../components/Kondisi'
import KartuResep from '../components/KartuResep'
import { Chip } from '../components/Pilihan'
import { useUmpan } from '../components/Umpan'
import { f } from '../copy/fitur'
import { u } from '../copy/prinsip'

// Favorit & koleksi (spesifikasi 8.11 #40). Koleksi gratis; batas 20 per pengguna.
export default function Favorit() {
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)
  const [aktif, setAktif] = useState(null) // id koleksi, null = semua tersimpan
  const [baru, setBaru] = useState(null) // null = form tertutup
  const [pesan, setPesan] = useState('')
  const k = f.favorit
  const { tanya } = useUmpan()

  useEffect(() => {
    api(`/favorit${aktif ? `?koleksi=${aktif}` : ''}`).then((x) => { setD(x); setGalat(null) }).catch(setGalat)
  }, [aktif])

  const buat = async (e) => {
    e.preventDefault()
    const nama = baru.trim()
    if (!nama) return
    setPesan('')
    try {
      const x = await api('/koleksi', { method: 'POST', body: { nama } })
      setBaru(null)
      setAktif(x.id)
    } catch (err) { setPesan(err.message) }
  }
  const hapus = async () => {
    if (!(await tanya(u.koleksiHapus))) return
    try {
      await api(`/koleksi/${aktif}`, { method: 'DELETE' })
      setAktif(null)
    } catch (err) { setPesan(err.message) }
  }

  if (galat && !d) return <Galat apa="favoritmu" onCoba={() => setAktif((a) => a)} />
  if (!d) return <Memuat />

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-judul text-3xl font-bold">{k.judul}</h1>
        <p className="text-sm text-neutral-500">{k.tersimpan(d.total)}</p>
      </header>

      <div className="tanpa-bar flex gap-2 overflow-x-auto pb-1">
        <Chip aktif={!aktif} onClick={() => setAktif(null)} className="shrink-0">{k.semua}</Chip>
        {d.koleksi.map((x) => <Chip key={x.id} aktif={aktif === x.id} onClick={() => setAktif(x.id)} className="shrink-0">{x.nama} · {x.jumlah}</Chip>)}
        <Chip aktif={false} onClick={() => setBaru(baru === null ? '' : null)} className="shrink-0 border-dashed">{k.koleksiBaru}</Chip>
      </div>

      {baru !== null && (
        <form onSubmit={buat} className="flex gap-2">
          <input autoFocus value={baru} onChange={(e) => setBaru(e.target.value)} maxLength={60} placeholder={k.namaKoleksi} aria-label={k.namaKoleksi} className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-sage" />
          <button className="rounded-xl bg-sage-gelap px-4 text-white disabled:opacity-60" disabled={!baru.trim()}>{k.buat}</button>
          <button type="button" onClick={() => setBaru(null)} className="px-2 text-neutral-500">{k.batal}</button>
        </form>
      )}
      {pesan && <p role="alert" className="rounded-xl bg-kurang px-4 py-3 text-sm text-terakota">{pesan}</p>}
      {aktif && <button onClick={hapus} className="text-sm text-terakota underline">{k.hapusKoleksi}</button>}

      {d.resep.length === 0 ? (
        <p className="py-10 text-center text-neutral-500">{aktif ? k.kosongKoleksi : k.kosong}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{d.resep.map((r) => <KartuResep key={r.id} resep={r} label={r.label} />)}</div>
      )}
    </div>
  )
}
