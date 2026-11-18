import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { simpanAlat } from '../api/saya'
import { t } from '../copy/id'
import { Chip } from './Pilihan'

// Memilih alat dapur. termasukKompor: tampilkan sakelar kompor (Pengaturan).
// otomatis: simpan ke server tiap ketukan. onChange menerima daftar lengkap (dipakai Setup untuk simpan saat Lanjut).
export default function PilihAlat({ termasukKompor = false, otomatis = false, onChange }) {
  const [alat, setAlat] = useState(null)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    api('/alat').then((l) => { setAlat(l); onChange?.(l) }).catch((e) => setGalat(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ketuk = (a) => {
    const baru = alat.map((x) => (x.id === a.id ? { ...x, punya: !x.punya } : x))
    setAlat(baru)
    onChange?.(baru)
    if (otomatis) simpanAlat([{ id: a.id, punya: !a.punya }]).catch((e) => setGalat(e.message))
  }

  const tampil = alat?.filter((a) => !a.diasumsikan_ada || (termasukKompor && a.nama === 'Kompor'))
  return (
    <div className="flex flex-wrap gap-2">
      {galat && <p role="alert" className="text-sm text-terakota">{galat}</p>}
      {tampil?.map((a) => (
        <Chip key={a.id} aktif={a.punya} onClick={() => ketuk(a)}>
          {a.nama === 'Kompor' ? t.pengaturan.kompor : a.nama}
        </Chip>
      ))}
    </div>
  )
}
