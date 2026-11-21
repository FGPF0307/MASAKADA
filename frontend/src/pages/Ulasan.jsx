import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { BintangTampil } from '../components/Bintang'
import { Pesan, Tombol } from '../components/Form'
import KartuUlasan from '../components/KartuUlasan'
import LaporSheet from '../components/LaporSheet'
import NilaiModal from '../components/NilaiModal'
import { Chip } from '../components/Pilihan'
import PilihFoto from '../components/PilihFoto'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'
import { angka } from '../lib/format'

export default function Ulasan() {
  const { id } = useParams()
  const [d, setD] = useState(null)
  const [filter, setFilter] = useState('semua')
  const [teks, setTeks] = useState('')
  const [foto, setFoto] = useState(null)
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [nilai, setNilai] = useState(false)
  const [lapor, setLapor] = useState(null) // comment_id
  const u = t.ulasan

  const muat = useCallback(() => api(`/resep/${id}/ulasan`).then(setD).catch((e) => setGalat(e.message)), [id])
  useEffect(() => { muat() }, [muat])

  if (galat && !d) return <div className="max-w-md space-y-3"><TombolKembali ke={`/resep/${id}`} /><Pesan>{galat}</Pesan></div>
  if (!d) return <p className="text-neutral-500">{t.halaman.memuat}</p>

  const tampil = d.ulasan.filter((x) => filter === 'semua' || (filter === 'foto' && x.foto_url) || (filter === 'pengganti' && x.pakai_pengganti))
  const maks = Math.max(1, ...Object.values(d.distribusi))

  const kirim = async (e) => {
    e.preventDefault()
    if (!teks.trim()) return
    setSibuk(true)
    setGalat('')
    try {
      await api(`/resep/${id}/komentar`, { method: 'POST', body: { isi: teks, foto_url: foto } })
      setTeks('')
      setFoto(null)
      await muat()
    } catch (err) {
      setGalat(err.message)
    }
    setSibuk(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <TombolKembali ke={`/resep/${id}`} />
        <h1 className="font-judul text-3xl font-bold">{u.judul}</h1>
      </div>

      <section className="flex items-center gap-5 rounded-2xl bg-kartu p-4">
        <div className="text-center">
          <p className="font-judul text-5xl font-bold">{d.jumlah ? angka(d.rata) : '–'}</p>
          <BintangTampil n={Math.round(d.rata)} />
          <p className="mt-1 text-xs text-neutral-500">{u.jumlah(d.jumlah)}</p>
        </div>
        <ul className="flex-1 space-y-1" aria-label="Sebaran bintang">
          {[5, 4, 3, 2, 1].map((b) => (
            <li key={b} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-right">{b}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/10"><span className="block h-full rounded-full bg-[#f5a623]" style={{ width: `${(d.distribusi[b] / maks) * 100}%` }} /></span>
              <span className="w-5 text-neutral-500">{d.distribusi[b]}</span>
            </li>
          ))}
        </ul>
      </section>

      {d.boleh_menilai ? (
        <Tombol variant="sage" onClick={() => setNilai(true)}>{d.penilaian_saya ? u.ubahBintang : u.beriBintang}</Tombol>
      ) : (
        <p className="rounded-xl bg-emas/50 px-4 py-3 text-sm">{u.aturan}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Chip aktif={filter === 'semua'} onClick={() => setFilter('semua')}>{u.semua}</Chip>
        <Chip aktif={filter === 'foto'} onClick={() => setFilter('foto')}>{u.denganFoto}</Chip>
        <Chip aktif={filter === 'pengganti'} onClick={() => setFilter('pengganti')}>{u.pakaiPengganti}</Chip>
      </div>

      {tampil.length ? (
        <ul className="space-y-3">{tampil.map((x) => <KartuUlasan key={x.id} u={x} onLapor={setLapor} />)}</ul>
      ) : (
        <p className="py-4 text-center text-neutral-500">{d.ulasan.length ? u.kosongFilter : u.kosong}</p>
      )}

      <form onSubmit={kirim} className="space-y-3 rounded-2xl bg-kartu p-4">
        <textarea
          rows={3}
          maxLength={1000}
          placeholder={u.tulis}
          aria-label={u.tulis}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-sage"
        />
        <PilihFoto url={foto} onChange={setFoto} />
        <Pesan>{galat}</Pesan>
        <Tombol type="submit" disabled={sibuk || !teks.trim()}>{u.kirim}</Tombol>
      </form>

      <Link to={`/resep/${id}`} className="block text-center text-sm text-sage-gelap">{t.detail.kembali}</Link>

      {nilai && <NilaiModal resep={{ id, judul: d.judul, penulis: d.penulis }} awal={d.penilaian_saya} onTutup={() => setNilai(false)} onSelesai={() => { setNilai(false); muat() }} />}
      {lapor && <LaporSheet target={{ comment_id: lapor }} onTutup={() => setLapor(null)} />}
    </div>
  )
}
