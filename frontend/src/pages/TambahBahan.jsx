import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { f } from '../copy/fitur'
import TombolKembali from '../components/TombolKembali'
import { api } from '../api/client'
import AvatarBahan from '../components/AvatarBahan'
import { Field, Pesan } from '../components/Form'
import { Chip } from '../components/Pilihan'
import SheetBahanBaru from '../components/SheetBahanBaru'
import { t } from '../copy/id'

function BarisBahan({ b, q, onClick }) {
  const kata = q.trim().toLowerCase()
  // Tampilkan sinonim yang cocok bila nama sendiri tidak memuat kata yang diketik.
  const sinonim = kata && !b.nama.toLowerCase().includes(kata) ? b.sinonim.find((x) => x.toLowerCase().includes(kata)) : null
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-kartu p-3 text-left">
        <AvatarBahan nama={b.nama} className="size-11" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{b.nama}</span>
          {sinonim && <span className="block text-sm text-neutral-500">{t.pantry.tambah.juga(sinonim)}</span>}
        </span>
        {b.belum_baku && <span className="shrink-0 rounded-full bg-emas px-2 py-0.5 text-xs">{t.pantry.tambah.menunggu}</span>}
      </button>
    </li>
  )
}

export default function TambahBahan() {
  const go = useNavigate()
  const [q, setQ] = useState('')
  const [hasil, setHasil] = useState(null)
  const [baruDipakai, setBaruDipakai] = useState([])
  const [kategori, setKategori] = useState(null)
  const [daftarKategori, setDaftarKategori] = useState([])
  const [sheet, setSheet] = useState(false)
  const [galat, setGalat] = useState('')
  const s = t.pantry.tambah
  const kata = q.trim()

  useEffect(() => {
    api('/bahan/baru-dipakai').then(setBaruDipakai).catch(() => {})
  }, [])

  // Saran otomatis dengan jeda 250 ms agar tidak memanggil server di tiap ketukan.
  useEffect(() => {
    if (!kata) { setHasil(null); return }
    const jeda = setTimeout(() => {
      api(`/bahan?q=${encodeURIComponent(kata)}`).then(setHasil).catch((e) => setGalat(e.message))
    }, 250)
    return () => clearTimeout(jeda)
  }, [kata])

  const pilihKategori = (k) => {
    if (kategori === k) return setKategori(null)
    setKategori(k)
    api(`/bahan/kategori/${k}`).then(setDaftarKategori).catch((e) => setGalat(e.message))
  }

  const buka = (b) => go(`/pantry/tambah/${b.id}`)
  const persis = hasil?.some((b) => b.nama.toLowerCase() === kata.toLowerCase())

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/pantry" />
        <h1 className="font-judul text-3xl font-bold">{s.judul}</h1>
      </div>
      <Field label={s.cari} type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="text-sm text-neutral-500">{s.catatan}</p>
      <Pesan>{galat}</Pesan>
      {!kata && (
        <Link to="/scan" className="flex items-center justify-between gap-3 rounded-2xl bg-kartu p-4">
          <span><span className="block font-medium">{f.scan.judul}</span><span className="text-sm text-neutral-500">{f.scan.sub}</span></span>
          <span className="rounded-full bg-emas px-2 py-0.5 text-[10px] font-semibold">{t.kartu.plus}</span>
        </Link>
      )}

      {kata ? (
        <ul className="space-y-2">
          {hasil?.map((b) => <BarisBahan key={b.id} b={b} q={q} onClick={() => buka(b)} />)}
          {hasil && !persis && (
            <li>
              <button onClick={() => setSheet(true)} className="w-full rounded-2xl border border-dashed border-sage p-3 text-left text-sage-gelap">
                {s.baruSebagai(kata)}
              </button>
            </li>
          )}
        </ul>
      ) : (
        <>
          {baruDipakai.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-medium">{s.baruDipakai}</h2>
              <div className="flex flex-wrap gap-2">
                {baruDipakai.map((b) => <Chip key={b.id} onClick={() => buka(b)}>{b.nama}</Chip>)}
              </div>
            </section>
          )}
          <section className="space-y-2">
            <h2 className="font-medium">{s.perKategori}</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.kategori).map(([k, label]) => <Chip key={k} aktif={kategori === k} onClick={() => pilihKategori(k)}>{label}</Chip>)}
            </div>
            {kategori && (
              <ul className="grid gap-2 pt-2 md:grid-cols-2">
                {daftarKategori.map((b) => <BarisBahan key={b.id} b={b} q="" onClick={() => buka(b)} />)}
              </ul>
            )}
          </section>
        </>
      )}

      {sheet && <SheetBahanBaru namaAwal={kata} onTutup={() => setSheet(false)} onSelesai={buka} />}
    </div>
  )
}
