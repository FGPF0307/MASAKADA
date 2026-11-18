import { useState } from 'react'
import { api } from '../api/client'
import { t } from '../copy/id'
import { Field, Pesan, Tombol } from './Form'
import { Segmented } from './Pilihan'

// Mengajukan bahan yang belum ada di daftar baku (status "menunggu" sampai disetujui moderator).
export default function SheetBahanBaru({ namaAwal = '', onSelesai, onTutup }) {
  const [nama, setNama] = useState(namaAwal)
  const [lain, setLain] = useState('')
  const [satuan, setSatuan] = useState('g')
  const [kategori, setKategori] = useState('bumbu')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const s = t.pantry.baru

  const kirim = async (e) => {
    e.preventDefault()
    setSibuk(true)
    setGalat('')
    try {
      const sinonim = lain.split(',').map((x) => x.trim()).filter(Boolean)
      onSelesai(await api('/bahan', { method: 'POST', body: { nama, sinonim, satuan, kategori } }))
    } catch (err) {
      setGalat(err.message)
      setSibuk(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40" onClick={onTutup}>
      <form
        role="dialog"
        aria-label={s.judul}
        onSubmit={kirim}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-3xl bg-kartu p-5 lg:max-w-md lg:rounded-2xl"
      >
        <h2 className="font-judul text-xl font-bold">{s.judul}</h2>
        <Field label={s.nama} required minLength={2} maxLength={100} value={nama} onChange={(e) => setNama(e.target.value)} />
        <Field label={s.namaLain} value={lain} onChange={(e) => setLain(e.target.value)} />
        <div className="space-y-2">
          <p className="text-sm text-neutral-600">{s.satuan}</p>
          <Segmented nilai={satuan} onChange={setSatuan} opsi={['g', 'ml', 'butir'].map((x) => [x, x])} />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-neutral-600">{s.kategori}</p>
          <Segmented nilai={kategori} onChange={setKategori} opsi={Object.entries(t.kategori)} />
        </div>
        <p className="text-sm text-neutral-500">{s.info}</p>
        <Pesan>{galat}</Pesan>
        <Tombol type="submit" disabled={sibuk}>{s.tambahkan}</Tombol>
        <button type="button" className="w-full py-2 text-neutral-500" onClick={onTutup}>{s.batal}</button>
      </form>
    </div>
  )
}
