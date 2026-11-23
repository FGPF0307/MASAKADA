import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { simpanAlat } from '../api/saya'
import { t } from '../copy/id'
import { Chip } from './Pilihan'
import { useUmpan } from './Umpan'

// Memilih alat dapur, dikelompokkan: alat dasar (dianggap ada, boleh dimatikan) dan alat tambahan.
// otomatis: simpan ke server tiap ketukan (Pengaturan); bila gagal, pilihan dikembalikan.
// onChange menerima daftar lengkap (dipakai Setup untuk simpan saat Lanjut).
export default function PilihAlat({ otomatis = false, onChange }) {
  const [alat, setAlat] = useState(null)
  const [galat, setGalat] = useState('')
  const antrean = useRef(Promise.resolve()) // simpan berurutan supaya ketukan cepat tidak saling menimpa
  const umpan = useUmpan()
  const s = t.pengaturan

  useEffect(() => {
    api('/alat').then((l) => { setAlat(l); onChange?.(l) }).catch((e) => setGalat(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ketuk = (a) => {
    const punya = !a.punya
    const terapkan = (nilai) => setAlat((l) => {
      const baru = l.map((x) => (x.id === a.id ? { ...x, punya: nilai } : x))
      onChange?.(baru)
      return baru
    })
    terapkan(punya)
    setGalat('')
    if (!otomatis) return
    antrean.current = antrean.current
      .then(() => simpanAlat([{ id: a.id, punya }]))
      .then(() => umpan?.tampil(s.alatDisimpan(a.nama, punya)))
      .catch((e) => { terapkan(!punya); setGalat(e.message) })
  }

  if (!alat) return galat ? <p role="alert" className="text-sm text-terakota">{galat}</p> : <p className="text-sm text-neutral-500">{t.halaman.memuat}</p>

  const grup = [[s.alatDasar, alat.filter((a) => a.diasumsikan_ada)], [s.alatTambahan, alat.filter((a) => !a.diasumsikan_ada)]]
  return (
    <div className="space-y-3">
      {grup.map(([judul, daftar]) => (
        <div key={judul} className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{judul}</p>
          <div className="flex flex-wrap gap-2">
            {daftar.map((a) => (
              <Chip key={a.id} aktif={a.punya} onClick={() => ketuk(a)} aria-pressed={a.punya}>{a.nama}</Chip>
            ))}
          </div>
        </div>
      ))}
      {!alat.find((a) => a.nama === 'Kompor')?.punya && <p className="rounded-xl bg-kurang px-3 py-2 text-sm">{s.tanpaKompor}</p>}
      {galat && <p role="alert" className="text-sm text-terakota">{galat}</p>}
    </div>
  )
}
