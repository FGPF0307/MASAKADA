import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import FotoResep from '../components/FotoResep'
import { Pesan } from '../components/Form'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'
import { waktuLalu } from '../lib/format'

// Status satu resep milik penulis: ditolak (dengan daftar perbaikan), ditinjau, atau terbit.
export default function DetailResepSaya() {
  const { id } = useParams()
  const go = useNavigate()
  const [r, setR] = useState(null)
  const [galat, setGalat] = useState('')
  const d = t.resepSaya.detail

  useEffect(() => {
    api(`/resep-saya/${id}`).then(setR).catch((e) => setGalat(e.message))
  }, [id])

  if (galat && !r) return <div className="max-w-md space-y-3"><TombolKembali ke="/resep-saya" /><Pesan>{galat}</Pesan></div>
  if (!r) return <p className="text-neutral-500">{t.halaman.memuat}</p>

  const hapus = async () => {
    if (!window.confirm(d.konfirmasiHapus)) return
    try { await api(`/resep-saya/${id}`, { method: 'DELETE' }); go('/resep-saya', { replace: true }) } catch (e) { setGalat(e.message) }
  }
  const ikon = { ditolak: ['!', 'bg-kurang text-terakota'], ditinjau: ['…', 'bg-emas'], terbit: ['✓', 'bg-siap text-sage-gelap'], draf: ['✎', 'bg-teks/5'] }[r.status]

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <TombolKembali ke="/resep-saya" />
      <div className="flex items-center gap-4">
        <FotoResep resep={{ foto_url: r.foto_url, judul: r.judul || '?' }} className="size-20 shrink-0 rounded-2xl text-2xl" />
        <div className="min-w-0">
          <h1 className="truncate font-judul text-2xl font-bold">{r.judul || t.resepSaya.tanpaJudul}</h1>
          {r.ditinjau_pada && <p className="text-sm text-neutral-500">{waktuLalu(r.ditinjau_pada)}</p>}
        </div>
      </div>
      <Pesan>{galat}</Pesan>

      <section className="space-y-3 rounded-2xl bg-kartu p-5 text-center">
        <div className={`mx-auto flex size-14 items-center justify-center rounded-full text-2xl ${ikon[1]}`} aria-hidden>{ikon[0]}</div>
        {r.status === 'ditolak' && <><h2 className="font-judul text-2xl font-bold">{d.ditolakJudul}</h2><span className="inline-block rounded-full bg-kurang px-3 py-0.5 text-xs text-terakota">{d.belumTerbit}</span><p className="text-neutral-600">{d.ditolakIsi}</p></>}
        {r.status === 'ditinjau' && <><h2 className="font-judul text-2xl font-bold">{d.ditinjauJudul}</h2><p className="text-neutral-600">{d.ditinjauIsi}</p></>}
        {r.status === 'terbit' && <><h2 className="font-judul text-2xl font-bold">{d.terbitJudul}</h2><p className="text-neutral-600">{d.terbitIsi}</p></>}
        {r.status === 'draf' && <h2 className="font-judul text-2xl font-bold">{t.resepSaya.tab.draf}</h2>}
      </section>

      {r.status === 'ditolak' && r.catatan_penolakan?.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-judul text-xl font-bold">{d.perbaikiList}</h2>
          <ol className="space-y-2">
            {r.catatan_penolakan.map((c) => (
              <li key={c.no} className="flex gap-3 rounded-xl bg-kartu p-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-terakota text-sm text-white">{c.no}</span>
                <span><span className="block font-medium">{c.judul}</span>{c.isi && <span className="text-sm text-neutral-600">{c.isi}</span>}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="space-y-3">
        {['ditolak', 'draf'].includes(r.status) && <Link to={`/bagikan/info?d=${r.id}`} className="block rounded-xl bg-terakota py-3 text-center font-medium text-white">{r.status === 'ditolak' ? d.edit : d.lanjutkan}</Link>}
        {r.status === 'terbit' && <Link to={`/resep/${r.id}`} className="block rounded-xl bg-terakota py-3 text-center font-medium text-white">{d.lihat}</Link>}
        {['ditolak', 'draf'].includes(r.status) && <button onClick={hapus} className="w-full py-2 text-terakota">{d.hapus}</button>}
      </div>
    </div>
  )
}
