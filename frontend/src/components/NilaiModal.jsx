import { useState } from 'react'
import { api } from '../api/client'
import { t } from '../copy/id'
import { BintangPilih } from './Bintang'
import { Pesan, Tombol } from './Form'
import { Segmented } from './Pilihan'
import PilihFoto from './PilihFoto'

// "Bagaimana hasilnya?": bintang (wajib), komentar, foto, dan pakai pengganti (opsional).
// onSelesai(true) setelah terkirim; onTutup() untuk "Nanti saja".
export default function NilaiModal({ resep, awal, onSelesai, onTutup }) {
  const [bintang, setBintang] = useState(awal?.bintang ?? 0)
  const [komentar, setKomentar] = useState('')
  const [foto, setFoto] = useState(null)
  const [pengganti, setPengganti] = useState(awal?.pakai_pengganti ? 'ya' : 'tidak')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const n = t.nilai

  const kirim = async () => {
    if (!bintang) return setGalat(n.pilihBintang)
    setSibuk(true)
    setGalat('')
    try {
      await api(`/resep/${resep.id}/rating`, { method: 'PUT', body: { bintang, pakai_pengganti: pengganti === 'ya' } })
      if (komentar.trim()) await api(`/resep/${resep.id}/komentar`, { method: 'POST', body: { isi: komentar, foto_url: foto } })
      onSelesai(true)
    } catch (e) {
      setGalat(e.message)
      setSibuk(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center" onClick={onTutup}>
      <div
        role="dialog"
        aria-label={n.judul}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full space-y-5 overflow-y-auto rounded-t-3xl bg-kartu p-5 lg:max-w-md lg:rounded-2xl"
      >
        <header className="text-center">
          <h2 className="font-judul text-2xl font-bold">{n.judul}</h2>
          <p className="text-sm text-neutral-600">{resep.penulis ? n.oleh(resep.judul, resep.penulis) : resep.judul}</p>
        </header>

        <BintangPilih nilai={bintang} onChange={setBintang} />

        <label className="block space-y-1">
          <span className="text-sm text-neutral-600">{n.komentar}</span>
          <textarea
            rows={3}
            maxLength={1000}
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-sage"
          />
        </label>

        <section className="space-y-2">
          <p className="text-sm text-neutral-600">{n.foto}</p>
          <PilihFoto url={foto} onChange={setFoto} />
        </section>

        <section className="space-y-2">
          <p className="text-sm text-neutral-600">{n.pengganti}</p>
          <Segmented nilai={pengganti} onChange={setPengganti} opsi={[['ya', n.ya], ['tidak', n.tidak]]} />
        </section>

        <Pesan>{galat}</Pesan>
        <Tombol onClick={kirim} disabled={sibuk}>{n.kirim}</Tombol>
        <button type="button" className="w-full py-2 text-neutral-500" onClick={onTutup}>{n.nanti}</button>
      </div>
    </div>
  )
}
