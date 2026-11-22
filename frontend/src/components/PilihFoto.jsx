import { useRef, useState } from 'react'
import { unggahFotoKeServer } from '../api/client'
import { kompresFoto } from '../lib/kompresFoto'
import { IkonKamera, IkonTutup } from './Ikon'
import { t } from '../copy/id'

// Memilih foto: dikompres di browser, diunggah, lalu onChange(url). onChange(null) saat dihapus.
export default function PilihFoto({ url, onChange, label = t.foto.tambah }) {
  const input = useRef(null)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  const pilih = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // boleh memilih berkas yang sama lagi
    if (!file) return
    setSibuk(true)
    setGalat('')
    try {
      onChange(await unggahFotoKeServer(await kompresFoto(file)))
    } catch (err) {
      setGalat(err.message)
    }
    setSibuk(false)
  }

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept="image/*" onChange={pilih} className="hidden" />
      {url ? (
        <div className="relative inline-block">
          <img src={url} alt="" className="h-28 rounded-xl object-cover" />
          <button type="button" onClick={() => onChange(null)} aria-label={t.foto.hapus} className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-terakota text-white shadow"><IkonTutup className="size-3.5" /></button>
        </div>
      ) : (
        <button type="button" disabled={sibuk} onClick={() => input.current.click()} className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-teks/25 px-4 py-3 text-sm text-neutral-600 transition hover:bg-teks/5 disabled:opacity-60">
          {sibuk ? t.foto.mengunggah : <><IkonKamera className="size-5" />{label}</>}
        </button>
      )}
      {galat && <p role="alert" className="text-sm text-terakota">{galat}</p>}
    </div>
  )
}
