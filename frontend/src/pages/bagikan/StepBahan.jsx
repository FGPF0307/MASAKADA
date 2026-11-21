import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../../api/client'
import AvatarBahan from '../../components/AvatarBahan'
import { Field, Tombol } from '../../components/Form'
import { Segmented } from '../../components/Pilihan'
import SheetBahanBaru from '../../components/SheetBahanBaru'
import { t } from '../../copy/id'
import { parseAngka } from '../../lib/format'

const AWAL = { g: 100, ml: 100, butir: 1 }

// Satu baris bahan. Jumlah diketik sebagai teks; hanya angka > 0 yang disimpan (server menolak selain itu).
function Baris({ b, onUbah, onHapus }) {
  const [teks, setTeks] = useState(String(b.jumlah))
  const bh = t.bagikan
  const salah = !(parseAngka(teks) > 0)
  return (
    <li className="space-y-3 rounded-2xl bg-kartu p-3">
      <div className="flex items-center gap-3">
        <AvatarBahan nama={b.nama} className="size-10" />
        <span className="min-w-0 flex-1 truncate font-medium">{b.nama}{b.belum_baku && <span className="ml-2 rounded-full bg-emas px-2 py-0.5 text-xs font-normal">{t.pantry.tambah.menunggu}</span>}</span>
        <button onClick={onHapus} aria-label={`${bh.hapus} ${b.nama}`} className="text-sm text-terakota">{bh.hapus}</button>
      </div>
      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          aria-label={`${bh.jumlah} ${b.nama}`}
          value={teks}
          onChange={(e) => { setTeks(e.target.value); const n = parseAngka(e.target.value); if (n > 0 && n <= 100000) onUbah({ jumlah: n }) }}
          className={`w-28 rounded-lg border bg-white px-3 py-2 ${salah ? 'border-terakota' : 'border-black/10'}`}
        />
        <span className="w-10 rounded-lg bg-black/5 px-2 py-2 text-center text-sm">{b.satuan}</span>
      </div>
      {salah && <p className="text-xs text-terakota">{t.pantry.atur.jumlahTidakValid}</p>}
      <Segmented nilai={b.peran} onChange={(peran) => onUbah({ peran })} opsi={Object.entries(t.detail.peran)} />
    </li>
  )
}

export default function StepBahan() {
  const { draf, ubah, simpanSekarang } = useOutletContext()
  const go = useNavigate()
  const [q, setQ] = useState('')
  const [hasil, setHasil] = useState(null)
  const [sheet, setSheet] = useState(false)
  const bh = t.bagikan
  const kata = q.trim()

  useEffect(() => {
    if (!kata) { setHasil(null); return }
    const jeda = setTimeout(() => api(`/bahan?q=${encodeURIComponent(kata)}`).then(setHasil).catch(() => {}), 250)
    return () => clearTimeout(jeda)
  }, [kata])

  const sudah = new Set(draf.bahan.map((x) => x.ingredient_id))
  const tambah = (x) => {
    if (sudah.has(x.id)) return
    ubah({ bahan: [...draf.bahan, { ingredient_id: x.id, nama: x.nama, satuan: x.satuan, belum_baku: x.belum_baku, jumlah: AWAL[x.satuan], peran: 'utama' }] })
    setQ('')
  }
  const ubahBaris = (id, patch) => ubah({ bahan: draf.bahan.map((x) => (x.ingredient_id === id ? { ...x, ...patch } : x)) })
  const hapus = (id) => ubah({ bahan: draf.bahan.filter((x) => x.ingredient_id !== id), langkah: draf.langkah.map((l) => ({ ...l, bahan: l.bahan.filter((i) => i !== id) })) })
  const lanjut = async () => { if (await simpanSekarang()) go('/bagikan/langkah') }
  const persis = hasil?.some((x) => x.nama.toLowerCase() === kata.toLowerCase())

  return (
    <div className="space-y-5">
      <Field label={bh.cariBahan} type="search" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="text-sm text-neutral-500">{bh.takaranPasti}</p>

      {kata && (
        <ul className="space-y-2">
          {hasil?.map((x) => (
            <li key={x.id}>
              <button onClick={() => tambah(x)} disabled={sudah.has(x.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left disabled:opacity-50">
                <AvatarBahan nama={x.nama} className="size-10" />
                <span className="flex-1 font-medium">{x.nama}</span>
                <span className="text-sm text-neutral-500">{sudah.has(x.id) ? bh.sudahAda : x.satuan}</span>
              </button>
            </li>
          ))}
          {hasil && !persis && (
            <li><button onClick={() => setSheet(true)} className="w-full rounded-2xl border border-dashed border-sage p-3 text-left text-sage-gelap">{bh.baruSebagai(kata)}</button></li>
          )}
        </ul>
      )}

      {draf.bahan.length === 0 ? <p className="text-neutral-500">{bh.belumBahan}</p> : (
        <ul className="space-y-3">{draf.bahan.map((x) => <Baris key={x.ingredient_id} b={x} onUbah={(p) => ubahBaris(x.ingredient_id, p)} onHapus={() => hapus(x.ingredient_id)} />)}</ul>
      )}

      <Tombol onClick={lanjut}>{bh.lanjutLangkah}</Tombol>
      {sheet && <SheetBahanBaru namaAwal={kata} onTutup={() => setSheet(false)} onSelesai={(x) => { setSheet(false); tambah(x) }} />}
    </div>
  )
}
