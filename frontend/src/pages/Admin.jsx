import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { Field, Pesan, Tombol } from '../components/Form'
import { Chip, Segmented } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { takaran } from '../lib/format'

const post = (path, body) => api(`/admin${path}`, { method: 'POST', body })
const kotak = 'space-y-3 rounded-2xl bg-kartu p-4'

function ResepItem({ r, selesai, setGalat }) {
  const a = t.admin
  const [buka, setBuka] = useState(false)
  const [d, setD] = useState(null)
  const [poin, setPoin] = useState(null) // null = form tolak tertutup
  const jalan = (fn) => fn().then(selesai).catch((e) => setGalat(e.message))

  const toggle = () => {
    setBuka(!buka)
    if (!d) api(`/admin/resep/${r.id}`).then(setD).catch((e) => setGalat(e.message))
  }
  const ubahPoin = (i, p) => setPoin(poin.map((x, n) => (n === i ? { ...x, ...p } : x)))

  return (
    <li className={kotak}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="font-medium">{r.judul || t.resepSaya.tanpaJudul}</p><p className="text-sm text-neutral-500">{a.oleh(r.penulis)}</p></div>
        <button onClick={toggle} className="shrink-0 text-sm text-sage-gelap">{buka ? a.tutup : a.buka}</button>
      </div>
      {buka && d && (
        <div className="space-y-3 rounded-xl bg-kartu p-3 text-sm">
          {d.foto_url && <img src={d.foto_url} alt="" className="max-h-48 rounded-lg object-cover" />}
          <p>{d.deskripsi}</p>
          <p className="text-neutral-500">{d.porsi} porsi · {d.menit_persiapan} + {d.menit_memasak} mnt · {t.kesulitan[d.kesulitan]} · {d.kategori}</p>
          <ul className="space-y-1">
            {d.bahan.map((b) => <li key={b.ingredient_id}>{b.nama} {takaran(b.jumlah, b.satuan)} <span className="text-neutral-500">({t.detail.peran[b.peran]})</span>{b.belum_baku && <span className="ml-1 rounded-full bg-emas px-2 text-xs">{t.pantry.tambah.menunggu}</span>}</li>)}
          </ul>
          <ol className="space-y-2">
            {d.langkah.map((l) => (
              <li key={l.urutan} className="flex gap-2">
                {l.foto_url ? <img src={l.foto_url} alt="" className="size-14 shrink-0 rounded-lg object-cover" /> : <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-kurang text-xs text-terakota">no foto</span>}
                <span><span className="text-xs text-neutral-500">{l.urutan}. {t.detail.fase[l.fase]}</span><br />{l.instruksi}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {poin === null ? (
        <div className="flex gap-2">
          <Tombol variant="sage" className="flex-1" onClick={() => jalan(() => post(`/resep/${r.id}/setujui`))}>{a.setujui}</Tombol>
          <Tombol variant="garis" className="flex-1" onClick={() => setPoin([{ judul: '', isi: '' }])}>{a.tolak}</Tombol>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">{a.alasanPoin}</p>
          {poin.map((p, i) => (
            <div key={i} className="space-y-2 rounded-xl bg-kartu p-3">
              <Field label={`${a.judulPoin} ${i + 1}`} value={p.judul} maxLength={150} onChange={(e) => ubahPoin(i, { judul: e.target.value })} />
              <Field label={a.isiPoin} value={p.isi} maxLength={500} onChange={(e) => ubahPoin(i, { isi: e.target.value })} />
            </div>
          ))}
          <button onClick={() => setPoin([...poin, { judul: '', isi: '' }])} className="text-sm text-sage-gelap">{a.tambahPoin}</button>
          <div className="flex gap-2">
            <Tombol variant="garis" className="flex-1" onClick={() => setPoin(null)}>{a.batal}</Tombol>
            <Tombol className="flex-[2]" disabled={poin.every((p) => !p.judul.trim())} onClick={() => jalan(() => post(`/resep/${r.id}/tolak`, { catatan: poin.filter((p) => p.judul.trim()) }))}>{a.kirimTolak}</Tombol>
          </div>
        </div>
      )}
    </li>
  )
}

function BahanItem({ b, selesai, setGalat }) {
  const a = t.admin
  const [nama, setNama] = useState(b.nama)
  const [lain, setLain] = useState(b.sinonim.join(', '))
  const [satuan, setSatuan] = useState(b.satuan)
  const [kategori, setKategori] = useState(b.kategori)
  const [gabung, setGabung] = useState(false)
  const [q, setQ] = useState('')
  const [hasil, setHasil] = useState([])
  const jalan = (fn) => fn().then(selesai).catch((e) => setGalat(e.message))

  useEffect(() => {
    if (!gabung || !q.trim()) { setHasil([]); return }
    const jeda = setTimeout(() => api(`/bahan?q=${encodeURIComponent(q.trim())}`).then((l) => setHasil(l.filter((x) => !x.belum_baku))).catch(() => {}), 250)
    return () => clearTimeout(jeda)
  }, [q, gabung])

  return (
    <li className={kotak}>
      <p className="text-sm text-neutral-500">{a.pengaju(b.pengaju ?? '—')}</p>
      <Field label={a.nama} value={nama} onChange={(e) => setNama(e.target.value)} />
      <Field label={a.namaLain} value={lain} onChange={(e) => setLain(e.target.value)} />
      <Segmented nilai={satuan} onChange={setSatuan} opsi={['g', 'ml', 'butir'].map((x) => [x, x])} />
      <Segmented nilai={kategori} onChange={setKategori} opsi={Object.entries(t.kategori)} />
      {!gabung ? (
        <div className="flex flex-wrap gap-2">
          <Tombol variant="sage" className="min-w-[8rem] flex-1" onClick={() => jalan(() => post(`/bahan/${b.id}/setujui`, { nama, satuan, kategori, sinonim: lain.split(',').map((x) => x.trim()).filter(Boolean) }))}>{a.setujui}</Tombol>
          <Tombol variant="garis" className="min-w-[8rem] flex-1" onClick={() => setGabung(true)}>{a.gabung}</Tombol>
          <Tombol variant="garis" className="min-w-[8rem] flex-1" onClick={() => jalan(() => post(`/bahan/${b.id}/tolak`))}>{a.tolak}</Tombol>
        </div>
      ) : (
        <div className="space-y-2">
          <Field label={a.cariTujuan} type="search" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap gap-2">{hasil.map((x) => <Chip key={x.id} onClick={() => jalan(() => post(`/bahan/${b.id}/gabung`, { ke_id: x.id }))}>{a.gabungkan}: {x.nama}</Chip>)}</div>
          <button onClick={() => setGabung(false)} className="text-sm text-neutral-500">{a.batal}</button>
        </div>
      )}
    </li>
  )
}

function LaporanItem({ l, selesai, setGalat }) {
  const a = t.admin
  const jalan = (body) => post(`/laporan/${l.id}/selesai`, body).then(selesai).catch((e) => setGalat(e.message))
  return (
    <li className={kotak}>
      <p className="font-medium">{l.alasan}</p>
      {l.catatan && <p className="text-sm text-neutral-600">{l.catatan}</p>}
      <p className="text-sm text-neutral-500">{l.comment_id ? `${a.komentar}: “${l.isi_komentar}”` : `${a.resepLabel}: ${l.judul_resep}`}</p>
      <div className="flex flex-wrap gap-2">
        <Tombol variant="garis" className="min-w-[8rem] flex-1" onClick={() => jalan({})}>{a.selesai}</Tombol>
        {l.comment_id && <Tombol variant="garis" className="min-w-[8rem] flex-1" onClick={() => jalan({ sembunyikan_komentar: true })}>{a.sembunyikan}</Tombol>}
        {l.recipe_id && <Tombol className="min-w-[8rem] flex-1" onClick={() => jalan({ turunkan_resep: true })}>{a.turunkan}</Tombol>}
      </div>
    </li>
  )
}

export default function Admin() {
  const { profil } = usePreferences()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('resep')
  const [galat, setGalat] = useState('')
  const a = t.admin

  const muat = useCallback(() => {
    setGalat('')
    return api('/admin/antrean').then(setData).catch((e) => setGalat(e.message))
  }, [])
  useEffect(() => { muat() }, [muat])

  if (profil.role !== 'admin') return <Navigate to="/" replace />
  const daftar = data?.[tab] ?? []

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/profil" />
        <h1 className="font-judul text-3xl font-bold">{a.judul}</h1>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(a.tab).map(([k, label]) => <Chip key={k} aktif={tab === k} onClick={() => setTab(k)} className="shrink-0">{label} ({data?.[k].length ?? 0})</Chip>)}
      </div>
      <Pesan>{galat}</Pesan>
      {data && daftar.length === 0 && <p className="py-6 text-center text-neutral-500">{a.kosong}</p>}
      <ul className="space-y-3">
        {tab === 'resep' && daftar.map((r) => <ResepItem key={r.id} r={r} selesai={muat} setGalat={setGalat} />)}
        {tab === 'bahan' && daftar.map((b) => <BahanItem key={b.id} b={b} selesai={muat} setGalat={setGalat} />)}
        {tab === 'laporan' && daftar.map((l) => <LaporanItem key={l.id} l={l} selesai={muat} setGalat={setGalat} />)}
      </ul>
    </div>
  )
}
