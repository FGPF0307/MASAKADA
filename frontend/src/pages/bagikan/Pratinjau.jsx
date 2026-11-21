import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../../api/client'
import FotoResep from '../../components/FotoResep'
import { Pesan, Tombol } from '../../components/Form'
import { IkonCentang } from '../../components/Ikon'
import { t } from '../../copy/id'
import { simpanId } from '../Bagikan'

export default function Pratinjau() {
  const { draf, simpanSekarang } = useOutletContext()
  const go = useNavigate()
  const [v, setV] = useState(null)
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const b = t.bagikan
  const total = (draf.menit_persiapan ?? 0) + (draf.menit_memasak ?? 0)

  // Pastikan perubahan terakhir tersimpan, lalu periksa di server.
  useEffect(() => {
    let batal = false
    ;(async () => {
      if (!(await simpanSekarang())) return
      api(`/resep/${draf.id}/validasi`, { method: 'POST' }).then((d) => !batal && setV(d)).catch((e) => !batal && setGalat(e.message))
    })()
    return () => { batal = true }
  }, [draf.id, simpanSekarang])

  const kirim = async () => {
    setSibuk(true)
    setGalat('')
    try {
      await api(`/resep/${draf.id}/kirim`, { method: 'POST' })
      simpanId(null)
      go('/bagikan/terkirim', { replace: true, state: { judul: draf.judul } })
    } catch (e) {
      setGalat(e.message)
      setSibuk(false)
    }
  }

  const pertama = v?.checks.find((c) => !c.ok)
  return (
    <div className="space-y-5">
      {!v && !galat && <p className="text-neutral-500">{t.halaman.memuat}</p>}
      {v && (
        <>
          <p className={`rounded-2xl px-4 py-3 font-medium ${v.ok ? 'bg-siap text-sage-gelap' : 'bg-kurang text-terakota'}`}>
            {v.ok ? b.siapKirim : b.perluDiperbaiki(v.perlu_diperbaiki)}
          </p>
          <ul className="space-y-2">
            {v.checks.map((c, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-kartu px-4 py-3">
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${c.ok ? 'bg-sage-gelap text-white' : 'bg-terakota text-white'}`} aria-hidden>{c.ok ? <IkonCentang className="size-4" /> : '!'}</span>
                <span className="min-w-0 flex-1">{c.pesan}</span>
                {!c.ok && <Link to={`/bagikan/${c.bagian}`} className="shrink-0 text-sm font-medium text-terakota">{b.perbaiki}</Link>}
              </li>
            ))}
          </ul>
        </>
      )}

      <section className="space-y-2">
        <h2 className="font-judul text-xl font-bold">{b.tampilanNanti}</h2>
        <div className="max-w-xs overflow-hidden rounded-2xl bg-kartu shadow-sm">
          <div className="relative">
            <FotoResep resep={{ foto_url: draf.foto_url, judul: draf.judul || '?' }} />
            {total > 0 && <span className="absolute bottom-2 left-2 rounded-full bg-waktu px-3 py-1 text-xs font-medium text-white">{t.kartu.mnt(total)}</span>}
          </div>
          <div className="space-y-1 p-3">
            <h3 className="font-medium">{draf.judul || t.resepSaya.tanpaJudul}</h3>
            <p className="text-xs text-neutral-500">{draf.bahan.length} bahan · {draf.langkah.length} langkah</p>
          </div>
        </div>
      </section>

      <Pesan>{galat}</Pesan>
      <div className="flex gap-3">
        {!v?.ok && pertama && <Tombol variant="garis" className="flex-1" onClick={() => go(`/bagikan/${pertama.bagian}`)}>{b.perbaiki}</Tombol>}
        <Tombol className="flex-[2]" disabled={sibuk || !v?.ok} onClick={kirim}>{b.kirim}</Tombol>
      </div>
    </div>
  )
}
