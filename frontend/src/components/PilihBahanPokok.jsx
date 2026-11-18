import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { simpanBahanPokok } from '../api/saya'
import { t } from '../copy/id'
import { Chip } from './Pilihan'

// Memilih bahan pokok. Bahan default (air, garam, minyak goreng) terkunci.
// otomatis: simpan ke server tiap ketukan. onChange menerima daftar lengkap.
export default function PilihBahanPokok({ otomatis = false, onChange }) {
  const [daftar, setDaftar] = useState(null)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    api('/bahan/pokok').then((l) => { setDaftar(l); onChange?.(l) }).catch((e) => setGalat(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ketuk = (b) => {
    const baru = daftar.map((x) => (x.id === b.id ? { ...x, dipilih: !x.dipilih } : x))
    setDaftar(baru)
    onChange?.(baru)
    if (otomatis) simpanBahanPokok(baru).catch((e) => setGalat(e.message))
  }

  const kelompok = (judul, isi, catatan) => (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-neutral-600">{judul}</h3>
      <div className="flex flex-wrap gap-2">
        {isi?.map((b) => (
          <Chip key={b.id} aktif={b.dipilih} disabled={b.terkunci} onClick={() => ketuk(b)}>
            {b.nama}{catatan && <span className="ml-2 text-xs opacity-80">{catatan}</span>}
          </Chip>
        ))}
      </div>
    </section>
  )

  return (
    <div className="space-y-5">
      {galat && <p role="alert" className="text-sm text-terakota">{galat}</p>}
      {kelompok(t.setup.pokok.selalu, daftar?.filter((b) => b.terkunci), t.setup.pokok.default)}
      {kelompok(t.setup.pokok.sendiri, daftar?.filter((b) => !b.terkunci))}
    </div>
  )
}
